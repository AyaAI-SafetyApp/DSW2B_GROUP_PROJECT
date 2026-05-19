import { supabase, getCurrentUser } from "./supabaseClient";


async function resolveUserId(userId) {
  if (userId) return userId;
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/** fetch all contacts for a user */
export async function fetchContacts(userId = null) {
  const uid = await resolveUserId(userId);
  if (!uid) return [];
  try {
    const { data, error } = await supabase
      .from("sos_contacts")
      .select("phone")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("fetchContacts error", error);
      return [];
    }
    return Array.isArray(data) ? data.map((r) => r.phone) : [];
  } catch (e) {
    console.error("fetchContacts failed", e);
    return [];
  }
}

/** add a contact (phone) for user — returns current contact list on success */
export async function addContact(userId = null, phone) {
  if (!phone || !/^\+?\d{10,15}$/.test(phone)) {
    throw new Error("Invalid phone");
  }
  const uid = await resolveUserId(userId);
  if (!uid) throw new Error("Not authenticated");

  try {
    // avoid duplicate inserts
    const { data: existing } = await supabase
      .from("sos_contacts")
      .select("id")
      .eq("user_id", uid)
      .eq("phone", phone)
      .limit(1);

    if (existing && existing.length > 0) {
      return fetchContacts(uid);
    }

    const { error } = await supabase.from("sos_contacts").insert([
      {
        user_id: uid,
        phone,
      },
    ]);
    if (error) {
      console.warn("addContact error", error);
      throw error;
    }
    return fetchContacts(uid);
  } catch (e) {
    console.error("addContact failed", e);
    throw e;
  }
}


export async function removeContact(userId = null, phone) {
  const uid = await resolveUserId(userId);
  if (!uid) throw new Error("Not authenticated");
  try {
    const { error } = await supabase
      .from("sos_contacts")
      .delete()
      .eq("user_id", uid)
      .eq("phone", phone);
    if (error) {
      console.warn("removeContact error", error);
      throw error;
    }
    return fetchContacts(uid);
  } catch (e) {
    console.error("removeContact failed", e);
    throw e;
  }
}

export default {
  fetchContacts,
  addContact,
  removeContact,
};