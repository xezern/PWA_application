import { openDB } from "idb";

export const initDB = async () => {
  return openDB("postgram-db", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("pending-contacts")) {
        db.createObjectStore("pending-contacts", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    },
  });
};

export const saveContactIndexedDB = async (contact) => {
  const db = await initDB();
  await db.add("pending-contacts", contact);
};

export const getPendingContacts = async () => {
  const db = await initDB();
  return await db.getAll("pending-contacts");
};

export const clearPendingContacts = async () => {
  const db = await initDB();
  return await db.clear("pending-contacts");
};

// idb.js - IndexedDB delete funksiyası
export const deleteContactFromIndexedDB = async (id) => {
  try {
    // ID-nin mövcud olduğunu yoxlayaq
    if (id === null || id === undefined || id === '') {
      throw new Error("Contact ID is required for deletion");
    }

    const db = await initDB();
    
    // ID-ni string-ə çevirək (IndexedDB həm string, həm də number qəbul edir)
    // Lakin bizim halda Firebase ID-ləri string-dir
    const contactId = typeof id === 'number' ? id : String(id).trim();
    
    if (!contactId) {
      throw new Error("Contact ID cannot be empty");
    }

    await db.delete("pending-contacts", contactId);
    console.log("✅ Contact deleted from IndexedDB:", contactId);
  } catch (error) {
    console.error("Error deleting contact from IndexedDB:", error);
    throw error;
  }
};
