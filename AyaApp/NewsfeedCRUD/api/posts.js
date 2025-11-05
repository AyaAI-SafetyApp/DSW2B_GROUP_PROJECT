import { supabase } from '../supabaseClient';


export async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

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

export async function createPost(post) {
  const { data, error } = await supabase
    .from('posts')
    .insert([post])
    .select();

  if (error) throw error;

  if (Array.isArray(data)) return data[0];
  return data;
}

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

export async function deletePost(postId) {
  const { data, error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .select();

  if (error) throw error;

  return Array.isArray(data) ? data[0] : data;
}

