// ...existing code...
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Storage from './storage';

const STORAGE_KEY = 'OFFLINE_POST_QUEUE';
const CRUD_OPS_KEY = 'OFFLINE_CRUD_QUEUE';
let processing = false;
let unsubscribeNetInfo = null;

/**
 * Read queue from storage
 */
async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('offlineQueue: getQueue', e);
    return [];
  }
}

/**
 * Persist queue
 */
async function setQueue(queue) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue || []));
  } catch (e) {
    console.error('offlineQueue: setQueue', e);
  }
}

/**
 * Add a post to the persistent queue.
 * postObj should include everything you need to recreate the post:
 * { localId?, username, content, mediaUris: [...localUris], media_type, created_at, bucket? }
 */
export async function enqueuePost(postObj) {
  const queue = await getQueue();
  queue.push({ id: `q_${Date.now()}`, payload: postObj });
  await setQueue(queue);
  return true;
}

/**
 * Remove by queue id
 */
async function removeQueueItem(queueId) {
  const queue = await getQueue();
  const updated = queue.filter((i) => i.id !== queueId);
  await setQueue(updated);
}

/**
 * Update CRUD ops queue to replace local placeholder postId -> serverId
 */
async function mapLocalIdToServerId(localId, serverId) {
  if (!localId || !serverId) return;
  try {
    const raw = await AsyncStorage.getItem(CRUD_OPS_KEY);
    if (!raw) return;
    let ops = JSON.parse(raw);
    let changed = false;
    ops = (ops || []).map((op) => {
      let newOp = { ...op };
      if (String(newOp.postId || '') === String(localId)) {
        newOp.postId = serverId;
        changed = true;
      }
      if (newOp.payload && String(newOp.payload.postId || '') === String(localId)) {
        newOp.payload = { ...newOp.payload, postId: serverId };
        changed = true;
      }
      return newOp;
    });
    if (changed) {
      await AsyncStorage.setItem(CRUD_OPS_KEY, JSON.stringify(ops));
    }
  } catch (e) {
    console.error('offlineQueue: mapLocalIdToServerId', e);
  }
}

/**
 * Normalize uploadFn result to a public URL string.
 * uploadFn may return:
 * - a string (public URL)
 * - an object with .publicUrl /.publicURL /.url /.public_url /.signedUrl /.path
 */
function extractPublicUrl(uploadResult) {
  if (!uploadResult) return null;
  if (typeof uploadResult === 'string') return uploadResult;
  if (uploadResult.publicUrl) return uploadResult.publicUrl;
  if (uploadResult.publicURL) return uploadResult.publicURL;
  if (uploadResult.public_url) return uploadResult.public_url;
  if (uploadResult.url) return uploadResult.url;
  if (uploadResult.signedUrl) return uploadResult.signedUrl;
  if (uploadResult.signedURL) return uploadResult.signedURL;
  if (uploadResult.path) return uploadResult.path; // caller may construct full URL
  if (uploadResult.data && (uploadResult.data.publicUrl || uploadResult.data.url || uploadResult.data.path)) {
    return uploadResult.data.publicUrl || uploadResult.data.url || uploadResult.data.path;
  }
  return null;
}

/**
 * Resolve a usable uploader function from the storage module or use provided uploadFn.
 * The resolved uploader will be called as uploader(localUri, bucket).
 */
function getResolvedUploader(uploadFn) {
  if (typeof uploadFn === 'function') return uploadFn;

  // try Storage exports: upload, uploadFile, uploadFileToBucket
  const s = Storage || {};
  const candidates = [
    s.upload,
    s.uploadFile,
    s.uploadFileToBucket,
    s.default && s.default.upload,
    s.default && s.default.uploadFile,
    s.default && s.default.uploadFileToBucket,
  ];
  const fn = candidates.find((c) => typeof c === 'function');
  if (fn) return fn;

  // no uploader available
  return null;
}

/**
 * Process queued items sequentially.
 * - createPostFn(postPayload) should call your server/db to create post and ideally return created post with id.
 * - uploadFn(localUri, bucket) optional; if not provided, attempt to resolve from ./storage
 *
 * The function stops on first failure to avoid spinning and will be retried by network listener.
 */
export async function processQueue(createPostFn, uploadFn) {
  if (processing) return;
  processing = true;

  try {
    const queue = await getQueue();
    if (!queue || queue.length === 0) {
      processing = false;
      return;
    }

    const uploader = getResolvedUploader(uploadFn);

    for (const item of queue) {
      const { id, payload } = item;
      try {
        // prepare payload for server
        const postPayload = { ...payload };

        // Determine target bucket for uploads (default to 'posts')
        const bucket = postPayload.bucket || 'posts';

        // If there are local media URIs, upload them
        if (Array.isArray(postPayload.mediaUris) && postPayload.mediaUris.length > 0) {
          if (!uploader) {
            throw new Error('No uploader available to process mediaUris');
          }

          const uploadedUrls = [];
          for (let i = 0; i < postPayload.mediaUris.length; i++) {
            const uri = postPayload.mediaUris[i];
            try {
              // uploader may accept (uri, bucket) or (uri, bucket, filename)
              const up = await uploader(uri, bucket);
              let publicUrl = extractPublicUrl(up);

              // If result is a "path" (no https) and storage.supabaseUrl exists, construct public URL
              if (publicUrl && !/^https?:\/\//i.test(publicUrl)) {
                const base = Storage.supabaseUrl || null;
                if (base) {
                  const manual = `${String(base).replace(/\/+$/, '')}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeURIComponent(publicUrl.replace(/^\/+/, ''))}`;
                  publicUrl = manual;
                }
              }

              if (!publicUrl) {
                throw new Error('uploadFn did not return a public URL for uri: ' + uri);
              }

              uploadedUrls.push(publicUrl);
            } catch (uploadErr) {
              console.error('offlineQueue: upload failed for uri', uri, uploadErr);
              throw uploadErr;
            }
          }
          postPayload.media_urls = uploadedUrls.filter(Boolean);
        }

        // Build the object to send to createPostFn
        const createPayload = {
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

        // Call createPostFn which saves to DB and ideally returns created post object (with id)
        const created = await createPostFn(createPayload);

        // Try to extract server id from create result
        const serverId =
          (created && created.id) ||
          (created && created.data && created.data.id) ||
          (created && created.post && created.post.id) ||
          (Array.isArray(created) && created[0] && created[0].id) ||
          null;

        // If queue item had a localId, map local -> server in CRUD ops queue
        if (postPayload.localId && serverId) {
          await mapLocalIdToServerId(postPayload.localId, serverId);
        }

        // Success -> remove queue item
        await removeQueueItem(id);
      } catch (itemErr) {
        // if one item fails (network or server), stop processing to retry later
        console.error('offlineQueue: failed processing item', item.id, itemErr);
        break;
      }
    }
  } catch (e) {
    console.error('offlineQueue: processQueue', e);
  } finally {
    processing = false;
  }
}

/**
 * Start automatic sync: listens to network changes and runs processQueue when online.
 * Pass your createPost and optional uploadFn.
 * Returns an unsubscribe function.
 */
export function startAutoSync({ createPostFn, uploadFn }) {
  // process any queued items on start attempt
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

  // subscribe to connectivity changes
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

/**
 * Helper to clear queue (useful for debugging)
 */
export async function clearQueue() {
  await setQueue([]);
}

export default {
  enqueuePost,
  processQueue,
  startAutoSync,
  clearQueue,
};