import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// import your local supabase client (named export)
import { supabase } from '../supabaseClient';

/**
 * Offline post queue implementation and helpers
 * Safe uploadFileToBucket implementation that works on Hermes (no resp.blob use)
 */

const STORAGE_KEY = 'OFFLINE_POST_QUEUE';
const CRUD_OPS_KEY = 'OFFLINE_CRUD_QUEUE';
let processing = false;
let unsubscribeNetInfo = null;

async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('offlineQueue: getQueue', e);
    return [];
  }
}

async function setQueue(queue) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue || []));
  } catch (e) {
    console.error('offlineQueue: setQueue', e);
  }
}

export async function enqueuePost(postObj) {
  const queue = await getQueue();
  queue.push({ id: `q_${Date.now()}`, payload: postObj });
  await setQueue(queue);
  return true;
}

async function removeQueueItem(queueId) {
  try {
    const queue = await getQueue();
    const updated = (queue || []).filter((i) => i.id !== queueId);
    await setQueue(updated);
  } catch (e) {
    console.error('offlineQueue: removeQueueItem', e);
  }
}

async function mapLocalIdToServerId(localId, serverId) {
  if (!localId || !serverId) return;
  try {
    const raw = await AsyncStorage.getItem(CRUD_OPS_KEY);
    if (!raw) return;
    let ops = JSON.parse(raw || '[]');
    let changed = false;
    ops = (ops || []).map((op) => {
      let modified = false;
      const newOp = { ...op };
      if (String(newOp.postId || '') === String(localId)) {
        newOp.postId = serverId;
        modified = true;
      }
      if (newOp.payload && String(newOp.payload.postId || '') === String(localId)) {
        newOp.payload = { ...newOp.payload, postId: serverId };
        modified = true;
      }
      if (modified) changed = true;
      return newOp;
    });
    if (changed) {
      await AsyncStorage.setItem(CRUD_OPS_KEY, JSON.stringify(ops));
    }
  } catch (e) {
    console.error('offlineQueue: mapLocalIdToServerId', e);
  }
}

function extractPublicUrl(uploadResult) {
  if (!uploadResult) return null;
  if (typeof uploadResult === 'string') return uploadResult;
  if (uploadResult.publicUrl) return uploadResult.publicUrl;
  if (uploadResult.publicURL) return uploadResult.publicURL;
  if (uploadResult.public_url) return uploadResult.public_url;
  if (uploadResult.url) return uploadResult.url;
  if (uploadResult.data && uploadResult.data.publicUrl) return uploadResult.data.publicUrl;
  if (uploadResult.data && uploadResult.data.publicURL) return uploadResult.data.publicURL;
  if (uploadResult.path) return uploadResult.path;
  if (uploadResult.data && uploadResult.data.path) return uploadResult.data.path;
  return null;
}

/**
 * Upload a local file URI to the specified bucket using Supabase storage.
 * Uses response.arrayBuffer -> Uint8Array (Hermes-safe). Returns public URL string if available or an object fallback.
 */
export async function uploadFileToBucket(localUri, bucket = 'posts', filename = null) {
  if (!localUri) throw new Error('uploadFileToBucket: no localUri provided');

  // Already remote URL -> return as-is
  if (typeof localUri === 'string' && (localUri.startsWith('http://') || localUri.startsWith('https://'))) {
    return localUri;
  }

  if (!supabase || typeof supabase.storage === 'undefined') {
    throw new Error('uploadFileToBucket: supabase client not available — adjust import in storage.js');
  }

  try {
    const resp = await fetch(localUri);
    if (!resp.ok && typeof resp.status !== 'undefined') {
      throw new Error(`Failed to fetch file: ${resp.status}`);
    }

    // Try to read content-type (may be null)
    const contentType = resp.headers && typeof resp.headers.get === 'function' ? resp.headers.get('Content-Type') : null;

    // Hermes/Expo: avoid resp.blob() — use arrayBuffer and Uint8Array
    const arrayBuffer = await resp.arrayBuffer();
    const fileForUpload = new Uint8Array(arrayBuffer);

    // derive extension/name
    const extMatch = (localUri || '').match(/\.(\w+)(?:\?.*)?$/);
    const ext = extMatch ? extMatch[1] : (contentType && contentType.split('/')[1]) || 'jpg';
    const name = filename || `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const path = name;

    // Try upload (Supabase accepts Uint8Array / Buffer)
    let uploadData = null;
    try {
      const options = contentType ? { contentType } : undefined;
      const { data, error } = await supabase.storage.from(bucket).upload(path, fileForUpload, options);
      if (error) throw error;
      uploadData = data || { path };
    } catch (uploadErr) {
      // If Buffer is available, convert and retry
      if (typeof global !== 'undefined' && typeof global.Buffer !== 'undefined' && fileForUpload instanceof Uint8Array) {
        try {
          const buf = global.Buffer.from(fileForUpload);
          const { data, error } = await supabase.storage.from(bucket).upload(path, buf, contentType ? { contentType } : undefined);
          if (error) throw error;
          uploadData = data || { path };
        } catch (bufErr) {
          throw bufErr;
        }
      } else {
        throw uploadErr;
      }
    }

    // Attempt to get public URL (supabase v1/v2 tolerant)
    try {
      const publicResult = await supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = extractPublicUrl(publicResult);
      if (publicUrl) return publicUrl;
    } catch (e) {
      // ignore and fallback
    }

    return { path: uploadData?.path || path, data: uploadData };
  } catch (err) {
    console.error('uploadFileToBucket failed', err);
    throw err;
  }
}

// aliases
export const uploadFile = uploadFileToBucket;
export const upload = uploadFileToBucket;

export async function processQueue(createPostFn, uploadFn) {
  if (processing) return;
  processing = true;

  try {
    const queue = await getQueue();
    if (!queue || queue.length === 0) {
      processing = false;
      return;
    }

    for (const item of queue) {
      const { id, payload } = item;
      try {
        const postPayload = { ...(payload || {}) };
        const bucket = postPayload.bucket || 'posts';

        if (Array.isArray(postPayload.mediaUris) && postPayload.mediaUris.length > 0) {
          const uploaded = [];
          for (const uri of postPayload.mediaUris) {
            try {
              const upRes = await uploadFn(uri, bucket);
              const publicUrl = extractPublicUrl(upRes) || (typeof upRes === 'string' ? upRes : null);
              if (!publicUrl) {
                throw new Error('uploadFn did not return a public URL');
              }
              uploaded.push(publicUrl);
            } catch (uploadErr) {
              console.error('offlineQueue: upload failed for', uri, uploadErr);
              throw uploadErr;
            }
          }
          postPayload.media_urls = uploaded;
        }

        const serverPayload = {
          username: postPayload.username,
          avatar: postPayload.avatar,
          content: postPayload.content,
          media_type:
            postPayload.media_type ||
            (postPayload.media_urls && postPayload.media_urls.length ? 'image' : 'none'),
          media_urls: postPayload.media_urls || [],
          likes: postPayload.likes || [],
          comments: postPayload.comments || [],
          created_at: postPayload.created_at || new Date().toISOString(),
        };

        const created = await createPostFn(serverPayload);

        const serverId =
          (created && created.id) ||
          (created && created.data && created.data.id) ||
          (created && Array.isArray(created) && created[0] && created[0].id) ||
          (created && created.post && created.post.id) ||
          null;

        if (postPayload.localId && serverId) {
          await mapLocalIdToServerId(postPayload.localId, serverId);
        }

        await removeQueueItem(id);
      } catch (itemErr) {
        console.error('offlineQueue: failed processing queue item', item.id, itemErr);
        break;
      }
    }
  } catch (e) {
    console.error('offlineQueue: processQueue', e);
  } finally {
    processing = false;
  }
}

export function startAutoSync({ createPostFn, uploadFn }) {
  (async () => {
    try {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        await processQueue(createPostFn, uploadFn);
      }
    } catch (e) {
      // ignore
    }
  })();

  unsubscribeNetInfo = NetInfo.addEventListener(async (state) => {
    if (state.isConnected) {
      await processQueue(createPostFn, uploadFn);
    }
  });

  return () => {
    if (typeof unsubscribeNetInfo === 'function') unsubscribeNetInfo();
    unsubscribeNetInfo = null;
  };
}

export async function clearQueue() {
  try {
    await setQueue([]);
  } catch (e) {
    console.error('offlineQueue: clearQueue', e);
  }
}

export default {
  enqueuePost,
  processQueue,
  startAutoSync,
  clearQueue,
  uploadFileToBucket,
  uploadFile,
  upload,
};