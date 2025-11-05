import { supabase } from './supabaseClient';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Upload profile picture to Supabase Storage
 * @param {string} imageUri - Local image URI
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export const uploadProfilePicture = async (imageUri, userId) => {
  try {
    if (!imageUri) return null;

    const fileExt = imageUri.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

/**
 * Create or update user profile
 * @param {Object} profileData - User profile data
 * @returns {Promise<Object>} - Created/updated profile
 */
export const saveUserProfile = async (profileData) => {
  try {
    const {
      userId,
      email,
      fullName,
      username,
      phone,
      location,
      age,
      gender,
      profilePicUri,
      provider,
    } = profileData;

    let profilePictureUrl = null;
    if (profilePicUri) {
      profilePictureUrl = await uploadProfilePicture(profilePicUri, userId);
    }

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    let result;
    
    if (existingProfile) {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          username,
          phone,
          location,
          age: age ? parseInt(age) : null,
          gender,
          profile_picture_url: profilePictureUrl || existingProfile.profile_picture_url,
          provider,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: userId,
            email,
            full_name: fullName,
            username,
            phone,
            location,
            age: age ? parseInt(age) : null,
            gender,
            profile_picture_url: profilePictureUrl,
            provider,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    await AsyncStorage.setItem('@user_profile', JSON.stringify(result));
    
    return result;
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

/**
 * Get user profile from Supabase
 * @param {string} userId - User ID or email
 * @returns {Promise<Object|null>} - User profile data or null if not found
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`user_id.eq.${userId},email.eq.${userId}`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting user profile:', error);
      throw error;
    }

    if (data) {
      await AsyncStorage.setItem('@user_profile', JSON.stringify(data));
      return data;
    }

    const cachedProfile = await AsyncStorage.getItem('@user_profile');
    if (cachedProfile) {
      console.log('📦 Using cached profile');
      return JSON.parse(cachedProfile);
    }

    console.log('ℹ️ No profile found for user:', userId);
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);

    const cachedProfile = await AsyncStorage.getItem('@user_profile');
    if (cachedProfile) {
      console.log('📦 Using cached profile after error');
      return JSON.parse(cachedProfile);
    }

    return null;
  }
};

/**
 * Update last login timestamp
 * @param {string} userId - User ID
 */
export const updateLastLogin = async (userId) => {
  try {
    await supabase
      .from('user_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error updating last login:', error);
  }
};

/**
 * Update safety preferences
 * @param {string} userId - User ID
 * @param {Object} preferences - Safety preferences object
 */
export const updateSafetyPreferences = async (userId, preferences) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ safety_preferences: preferences })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating safety preferences:', error);
    throw error;
  }
};

/**
 * Add emergency contact
 * @param {string} userId - User ID
 * @param {Object} contact - Contact object {name, phone, relationship}
 */
export const addEmergencyContact = async (userId, contact) => {
  try {
    const profile = await getUserProfile(userId);
    const currentContacts = profile.emergency_contacts || [];

    const updatedContacts = [...currentContacts, { ...contact, id: Date.now() }];
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ emergency_contacts: updatedContacts })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    throw error;
  }
};

/**
 * Delete profile picture
 * @param {string} userId - User ID
 * @param {string} pictureUrl - Picture URL to delete
 */
export const deleteProfilePicture = async (userId, pictureUrl) => {
  try {
    if (!pictureUrl) return;

    const urlParts = pictureUrl.split('/');
    const filePath = urlParts.slice(-2).join('/'); 

    await supabase.storage
      .from('profile-pictures')
      .remove([filePath]);

    await supabase
      .from('user_profiles')
      .update({ profile_picture_url: null })
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw error;
  }
};

/**
 * Update user profile information
 * @param {string} email - User email (identifier)
 * @param {Object} updates - Profile fields to update
 */
export const updateUserProfile = async (email, updates) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Profile updated successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    throw error;
  }
};
