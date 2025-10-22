// ...existing code...
import { supabase } from '../supabaseClient';

/**
 * Robust upload helper for Expo / React Native.
 * - Tries response.arrayBuffer() first
 * - Falls back to response.blob()
 * - Final fallback reads file with expo-file-system as base64 (install expo-file-system)
 */

const BUCKET_NAME = 'posts';

function mimeTypeFromFilename(filename) {
  const ext = (filename || '').toLowerCase().split('.').pop();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    case 'heic':
      return 'image/heic';
    default:
      return 'application/octet-stream';
  }
}

function base64ToUint8Array(base64) {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  try {
    const { Buffer } = require('buffer');
    return Uint8Array.from(Buffer.from(base64, 'base64'));
  } catch (e) {
    throw new Error('No base64 decoder available. Install buffer or expo-file-system.');
  }
}

export async function uploadFileToBucket(fileUri, filename) {
  if (!fileUri) throw new Error('fileUri is required');
  if (!filename) throw new Error('filename is required');

  let response;
  try {
    response = await fetch(fileUri);
  } catch (e) {
    throw new Error('Failed to fetch file from uri: ' + (e?.message || e));
  }
  if (!response || !response.ok) throw new Error('Failed to fetch file from uri');

  let uploadData;
  try {
    if (typeof response.arrayBuffer === 'function') {
      const ab = await response.arrayBuffer();
      uploadData = new Uint8Array(ab);
    } else if (typeof response.blob === 'function') {
      uploadData = await response.blob();
    } else {
      throw new Error('No arrayBuffer() or blob() available on fetch response');
    }
  } catch (firstErr) {
    try {
      if (typeof response.blob === 'function') {
        uploadData = await response.blob();
      } else {
        throw firstErr;
      }
    } catch (secondErr) {
      try {
        const FileSystem = require('expo-file-system');
        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
        uploadData = base64ToUint8Array(base64);
      } catch (fsErr) {
        console.error('All read attempts failed', { firstErr, secondErr, fsErr });
        throw new Error('Unable to read file binary (tried arrayBuffer, blob, and expo-file-system).');
      }
    }
  }

  const path = filename;
  const contentType = mimeTypeFromFilename(filename);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, uploadData, { cacheControl: '3600', upsert: false, contentType });

  if (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }

  const storagePath = data?.path || path;
  const publicRes = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  const publicUrl = publicRes?.data?.publicUrl || publicRes?.publicURL || null;

  return { storagePath, publicUrl };
}

export async function removeFileFromBucket(storagePath) {
  if (!storagePath) throw new Error('storagePath is required');
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
  if (error) throw error;
  return true;
}
// ...existing code...