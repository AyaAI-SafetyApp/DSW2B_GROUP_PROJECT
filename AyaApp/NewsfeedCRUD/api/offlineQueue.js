import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const STORAGE_KEY = 'OFFLINE_POST_QUEUE';
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
 * { username, content, mediaUris: [...localUris], media_type, created_at, ... }
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
 * Process queued items sequentially.
 * - createPostFn(postPayload) should call your server/db to create post.
 * - uploadFn(localUri, filename) should upload to storage and return { storagePath, publicUrl }.
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

        // If there are local media URIs, upload them
        if (Array.isArray(payload.mediaUris) && payload.mediaUris.length > 0) {
          const uploadedUrls = [];
          for (let i = 0; i < payload.mediaUris.length; i++) {
            const uri = payload.mediaUris[i];
            // generate filename - keep deterministic/unique
            const extMatch = uri.match(/\.(\w+)(\?|$)/);
            const ext = extMatch ? `.${extMatch[1]}` : '.jpg';
            const filename = `posts/${Date.now()}_${Math.floor(Math.random() * 1e6)}${ext}`;

            // uploadFn should support local uri -> { storagePath, publicUrl }
            const up = await uploadFn(uri, filename);
            if (!up) throw new Error('uploadFn returned nothing');
            // prefer publicUrl when available
            uploadedUrls.push(up.publicUrl || up.storagePath || null);
          }
          postPayload.media_urls = uploadedUrls.filter(Boolean);
        }

        // call createPostFn which saves to DB
        await createPostFn({
          username: postPayload.username,
          avatar: postPayload.avatar,
          content: postPayload.content,
          media_type: postPayload.media_type || (postPayload.media_urls && postPayload.media_urls.length ? 'image' : 'none'),
          media_urls: postPayload.media_urls || [],
          likes: postPayload.likes || [],
          comments: postPayload.comments || [],
          created_at: postPayload.created_at || new Date().toISOString(),
        });

        // success -> remove queue item
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