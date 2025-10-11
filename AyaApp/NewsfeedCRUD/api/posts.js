import { supabase } from '../supabaseClient.js';

// CREATE
export async function createPost({ username, content, media_type, media_url }) {
  const { data, error } = await supabase
    .from('posts')
    .insert([{ username, content, media_type, media_url }])
    .single();
  if (error) throw error;
  return data;
}

// READ (all posts, newest first)
export async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// UPDATE
export async function updatePost(id, updates) {
  const { data, error } = await supabase
    .from('posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// DELETE
export async function deletePost(id) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}