import { supabase } from '../supabaseClient';

// Fetch posts
export async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Create post
export async function createPost(post) {
  const { data, error } = await supabase
    .from('posts')
    .insert([post])
    .select();
  if (error) throw error;
  return data;
}

// Update post
export async function updatePost(postId, updates) {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select();
  if (error) throw error;
  return data;
}

// Delete post
export async function deletePost(postId) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);
  if (error) throw error;
}