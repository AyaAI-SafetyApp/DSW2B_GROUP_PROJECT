const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const SUPABASE_URL = "https://gfrnxqhivmgfgdersflu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmcm54cWhpdm1nZmdkZXJzZmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDY2NjYsImV4cCI6MjA3NjYyMjY2Nn0._6i4zlwcGDfyYMH5vJQKP_n4LTboPNGegh8f8A8_GIM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Generate a unique passkey credential
 */
const generatePasskey = (userId) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  
  return {
    credentialId: `cred_${userId}_${timestamp}_${randomString}`,
    rawId: `raw_${userId}_${timestamp}_${randomString}`,
    type: "public-key",
  };
};

/**
 * Store passkey in Supabase database
 */
const storePasskey = async (userId, credentialId, publicKey, provider = "biometric") => {
  try {
    const passkeyData = {
      user_id: userId,
      credential_id: credentialId,
      public_key: publicKey,
      provider: provider,
      created_at: new Date().toISOString(),
    };

    // Insert passkey into Supabase
    const { data, error } = await supabase
      .from("passkeys")
      .insert([passkeyData])
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
 * Retrieve passkey from Supabase
 */
const getPasskey = async (userId, credentialId) => {
  try {
    const { data, error } = await supabase
      .from("passkeys")
      .select("*")
      .eq("user_id", userId)
      .eq("credential_id", credentialId)
      .single();

    if (error) {
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
 * Get all passkeys for a user
 */
const getUserPasskeys = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("passkeys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error retrieving user passkeys:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to retrieve user passkeys:", error);
    throw error;
  }
};

/**
 * Verify passkey exists for login
 */
const verifyPasskey = async (userId, credentialId) => {
  try {
    const passkey = await getPasskey(userId, credentialId);
    return passkey !== null;
  } catch (error) {
    return false;
  }
};

module.exports = {
  generatePasskey,
  storePasskey,
  getPasskey,
  getUserPasskeys,
  verifyPasskey,
};