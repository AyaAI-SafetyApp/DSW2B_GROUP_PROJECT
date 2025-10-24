// ...existing code...
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

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
      if (String(op.postId || '') === String(localId)) {
        changed = true;
        return { ...op, postId: serverId };
      }
      // also try to update nested payload.postId if present
      if (op.payload && String(op.payload.postId || '') === String(localId)) {
        changed = true;
        return { ...op, payload: { ...op.payload, postId: serverId } };
      }
      return op;
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
 * - an object with .publicUrl /.publicURL /.url /.public_url
 * - an object with .storagePath (we can't derive public URL from it reliably)
 */
function extractPublicUrl(uploadResult) {
  if (!uploadResult) return null;
  if (typeof uploadResult === 'string') return uploadResult;
  if (uploadResult.publicUrl) return uploadResult.publicUrl;
  if (uploadResult.publicURL) return uploadResult.publicURL;
  if (uploadResult.public_url) return uploadResult.public_url;
  if (uploadResult.url) return uploadResult.url;
  // fallback to storagePath if present (caller may construct URL elsewhere)
  if (uploadResult.storagePath) return uploadResult.storagePath;
  return null;
}

/**
 * Process queued items sequentially.
 * - createPostFn(postPayload) should call your server/db to create post and ideally return created post with id.
 * - uploadFn(localUri, bucket) should upload to storage and return either a public URL string or an object containing a public URL.
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

    for (const item of queue) {
      const { id, payload } = item;
      try {
        // prepare payload for server
        const postPayload = { ...payload };

        // Determine target bucket for uploads (default to 'posts')
        const bucket = postPayload.bucket || 'posts';

        // If there are local media URIs, upload them
        if (Array.isArray(postPayload.mediaUris) && postPayload.mediaUris.length > 0) {
          const uploadedUrls = [];
          for (let i = 0; i < postPayload.mediaUris.length; i++) {
            const uri = postPayload.mediaUris[i];
            try {
              // uploadFn is expected to accept (localUri, bucket) and return either a public URL string
              // or an object containing a public URL field.
              const up = await uploadFn(uri, bucket);
              const publicUrl = extractPublicUrl(up);
              if (!publicUrl) {
                // If upload did not return usable URL, throw to stop processing this item (retry later)
                throw new Error('uploadFn did not return a public URL');
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
 * Pass your createPost and uploadFileToBucket functions.
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
// ...existing code...