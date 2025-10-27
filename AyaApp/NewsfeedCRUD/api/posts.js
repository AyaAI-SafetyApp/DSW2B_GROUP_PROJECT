// ...existing code...
import { supabase } from '../supabaseClient';

/**
 * Fetch posts (returns array)
 */
export async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Normalize some common field shapes for safety
  return (data || []).map((p) => ({
    ...p,
    media_urls: Array.isArray(p.media_urls)
      ? p.media_urls
      : p.media_url
      ? [p.media_url]
      : [],
    likes: Array.isArray(p.likes) ? p.likes : [],
    comments: Array.isArray(p.comments) ? p.comments : [],
  }));
}

/**
 * Create a post.
 * Returns the created post object (not an array) when possible.
 */
export async function createPost(post) {
  const { data, error } = await supabase
    .from('posts')
    .insert([post])
    .select();

  if (error) throw error;

  // supabase returns an array of created rows; return first row if present
  if (Array.isArray(data)) return data[0];
  return data;
}

/**
 * Update a post by id.
 * Returns the updated post object (first row) when possible.
 */
export async function updatePost(postId, updates) {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select();

  if (error) throw error;

  if (Array.isArray(data)) return data[0];
  return data;
}

/**
 * Delete a post by id.
 * Returns deleted row(s) if available.
 */
export async function deletePost(postId) {
  const { data, error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .select();

  if (error) throw error;

  return Array.isArray(data) ? data[0] : data;
}
// ...existing code...
