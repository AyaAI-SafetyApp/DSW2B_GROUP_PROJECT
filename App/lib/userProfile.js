import { supabase } from './supabase';

// must fetch user profile data
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return { success: false, error };
  }
};

export const checkUniqueFields = async (phoneNumber, idNumber, excludeUserId = null) => {
  try {
    let query = supabase
      .from('user_profiles')
      .select('user_id, phone_number, id_number')
      .or(`phone_number.eq.${phoneNumber},id_number.eq.${idNumber}`);

    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking unique fields:', error);
      return { isUnique: true }; 
    }

    const phoneExists = data.some(profile => profile.phone_number === phoneNumber);
    const idExists = data.some(profile => profile.id_number === idNumber);

    return {
      isUnique: !phoneExists && !idExists,
      phoneExists,
      idExists
    };
  } catch (error) {
    console.error('Error in checkUniqueFields:', error);
    return { isUnique: true }; 
  }
};
