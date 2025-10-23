import { supabase } from "./supabaseClient";

/**
 * Generate a unique passkey credential for a user
 * @param {string} userId - User's email or phone number
 * @returns {Object} Generated passkey credentials
 */
export const generatePasskey = (userId) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  
  return {
    credentialId: `cred_${userId}_${timestamp}_${randomString}`,
    publicKey: `key_${userId}_${timestamp}_${randomString}`,
    type: "public-key",
  };
};

/**
 * Store a passkey in Supabase database
 * @param {string} userId - User's email or phone number
 * @param {string} credentialId - Generated credential ID
 * @param {string} publicKey - Generated public key
 * @param {string} provider - Provider name (Apple, Google, etc.)
 * @returns {Promise<Object>} Stored passkey data
 */
export const storePasskey = async (userId, credentialId, publicKey, provider = "biometric") => {
  try {
    const { data, error } = await supabase
      .from("passkeys")
      .insert([
        {
          user_id: userId,
          credential_id: credentialId,
          public_key: publicKey,
          provider: provider,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Error storing passkey:", error);
      throw error;
    }

    return data[0];
  } catch (error) {
    console.error("Failed to store passkey:", error);
    throw error;
  }
};

/**
 * Get all passkeys for a specific user
 * @param {string} userId - User's email or phone number
 * @returns {Promise<Array>} Array of user's passkeys
 */
export const getUserPasskeys = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("passkeys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error retrieving passkeys:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to retrieve passkeys:", error);
    throw error;
  }
};

/**
 * Get a specific passkey by user ID and credential ID
 * @param {string} userId - User's email or phone number
 * @param {string} credentialId - Credential ID to retrieve
 * @returns {Promise<Object|null>} Passkey data or null if not found
 */
export const getPasskey = async (userId, credentialId) => {
  try {
    const { data, error } = await supabase
      .from("passkeys")
      .select("*")
      .eq("user_id", userId)
      .eq("credential_id", credentialId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        return null;
      }
      console.error("Error retrieving passkey:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to retrieve passkey:", error);
    throw error;
  }
};

/**
 * Verify if a passkey exists for a user
 * @param {string} userId - User's email or phone number
 * @param {string} credentialId - Credential ID to verify
 * @returns {Promise<boolean>} True if passkey exists, false otherwise
 */
export const verifyPasskey = async (userId, credentialId) => {
  try {
    const passkey = await getPasskey(userId, credentialId);
    return passkey !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Update the last_used_at timestamp for a passkey
 * @param {string} passkeyId - UUID of the passkey
 * @returns {Promise<void>}
 */
export const updatePasskeyLastUsed = async (passkeyId) => {
  try {
    const { error } = await supabase
      .from("passkeys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", passkeyId);

    if (error) {
      console.error("Error updating passkey last used:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to update passkey last used:", error);
    throw error;
  }
};

/**
 * Delete a specific passkey
 * @param {string} passkeyId - UUID of the passkey to delete
 * @returns {Promise<void>}
 */
export const deletePasskey = async (passkeyId) => {
  try {
    const { error } = await supabase
      .from("passkeys")
      .delete()
      .eq("id", passkeyId);

    if (error) {
      console.error("Error deleting passkey:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to delete passkey:", error);
    throw error;
  }
};

/**
 * Delete all passkeys for a user
 * @param {string} userId - User's email or phone number
 * @returns {Promise<void>}
 */
export const deleteAllUserPasskeys = async (userId) => {
  try {
    const { error } = await supabase
      .from("passkeys")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting user passkeys:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to delete user passkeys:", error);
    throw error;
  }
};

/**
 * Send passkey email to user via Supabase Edge Function
 * @param {string} email - User's email address
 * @param {string} credentialId - Generated credential ID
 * @param {string} provider - Provider name (Apple, Google, etc.)
 * @param {string} userName - Optional user name
 * @returns {Promise<Object>} Email sending result
 */
export const sendPasskeyEmail = async (email, credentialId, provider, userName) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-passkey-email', {
      body: {
        email,
        credentialId,
        provider,
        userName,
      },
    });

    if (error) {
      console.error("Error sending passkey email:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to send passkey email:", error);
    throw error;
  }
};

/**
 * Register a new user with passkey
 * Complete registration flow: generate passkey + store in Supabase + send email
 * @param {string} userId - User's email or phone number
 * @param {string} provider - Provider name (Apple, Google, etc.)
 * @param {boolean} sendEmail - Whether to send passkey via email (default: true)
 * @param {string} userName - Optional user name for email
 * @returns {Promise<Object>} Registration result with passkey data
 */
export const registerUserWithPasskey = async (userId, provider, sendEmail = true, userName) => {
  try {
    // Generate unique passkey
    const passkey = generatePasskey(userId);
    
    // Store in Supabase
    const storedPasskey = await storePasskey(
      userId,
      passkey.credentialId,
      passkey.publicKey,
      provider
    );

    // Send email with passkey if requested and userId is an email
    let emailSent = false;
    if (sendEmail && userId.includes('@')) {
      try {
        await sendPasskeyEmail(userId, passkey.credentialId, provider, userName);
        emailSent = true;
        console.log("Passkey email sent successfully to:", userId);
      } catch (emailError) {
        console.warn("Failed to send passkey email (continuing anyway):", emailError);
        // Don't fail the registration if email fails
      }
    }

    return {
      success: true,
      userId,
      credentialId: passkey.credentialId,
      passkey: storedPasskey,
      emailSent,
    };
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
};

/**
 * Verify user login with passkey
 * @param {string} userId - User's email or phone number
 * @returns {Promise<Object>} Login result
 */
export const verifyUserLogin = async (userId) => {
  try {
    // Get user's passkeys
    const passkeys = await getUserPasskeys(userId);
    
    if (!passkeys || passkeys.length === 0) {
      return {
        success: false,
        error: "No passkey found. Please register first.",
      };
    }

    // Use the most recent passkey
    const latestPasskey = passkeys[0];
    
    // Update last used timestamp
    await updatePasskeyLastUsed(latestPasskey.id);

    return {
      success: true,
      userId,
      passkey: latestPasskey,
    };
  } catch (error) {
    console.error("Login verification failed:", error);
    return {
      success: false,
      error: error.message || "Login verification failed",
    };
  }
};
