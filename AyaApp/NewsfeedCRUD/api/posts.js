import { supabase } from '../supabaseClient';

const BUCKET = 'posts';

// Fetch posts (returns posts with displayImage resolved)
export async function fetchPosts() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!posts || posts.length === 0) return [];

  const normalized = await Promise.all(
    posts.map(async (p) => {
      const out = { ...p, displayImage: null };

      // prefer persisted public URL
      if (p.image_url) {
        out.displayImage = p.image_url;
        return out;
      }

      // attempt to resolve image_path -> public URL or signed URL
      if (p.image_path) {
        try {
          const pub = supabase.storage.from(BUCKET).getPublicUrl(p.image_path);
          const publicUrl = pub?.data?.publicUrl || pub?.publicURL || null;
          if (publicUrl) {
            out.displayImage = publicUrl;
            return out;
          }

          const signed = await supabase.storage.from(BUCKET).createSignedUrl(p.image_path, 60);
          const signedUrl = signed?.data?.signedUrl || null;
          if (signedUrl) {
            out.displayImage = signedUrl;
            return out;
          }
        } catch (e) {
          console.warn('fetchPosts: resolve image url failed', p.image_path, e?.message ?? e);
        }
      }

      return out;
    })
  );

  return normalized;
}

// Create post (if image_path present but image_url missing, try to resolve and persist image_url)
export async function createPost(post) {
  if (!post) throw new Error('post required');
  const payload = { ...post };

  if (payload.image_path && !payload.image_url) {
    try {
      const pub = supabase.storage.from(BUCKET).getPublicUrl(payload.image_path);
      const publicUrl = pub?.data?.publicUrl || pub?.publicURL || null;
      if (publicUrl) {
        payload.image_url = publicUrl;
      } else {
        const signed = await supabase.storage.from(BUCKET).createSignedUrl(payload.image_path, 60 * 60);
        const signedUrl = signed?.data?.signedUrl || null;
        if (signedUrl) payload.image_url = signedUrl;
      }
    } catch (e) {
      console.warn('createPost: resolve image url failed', payload.image_path, e?.message ?? e);
    }
  }

  const { data, error } = await supabase
    .from('posts')
    .insert([payload])
    .select();

  if (error) throw error;
  return data;
}

export async function updatePost(postId, updates) {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select();
  if (error) throw error;
  return data;
}

export async function deletePost(postId) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);
  if (error) throw error;
  return true;
}