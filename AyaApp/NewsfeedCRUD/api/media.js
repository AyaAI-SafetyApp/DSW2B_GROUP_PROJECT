import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabaseClient';

export async function pickMedia(type = 'image') {
  let result;
  if (type === 'image') {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
  } else {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8,
    });
  }
  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

// Upload to Supabase Storage (optional, or use direct links)
export async function uploadMedia(uri, fileName) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const { data, error } = await supabase.storage
    .from('media')
    .upload(fileName, blob, { upsert: true });
  if (error) throw error;
  return data.path;
}