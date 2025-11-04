import { collection, addDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const contactsRef = collection(db, "contacts");

export const listenContacts = (callback) => {
  return onSnapshot(contactsRef, (snapshot) => {
    const contacts = [];
    snapshot.forEach(doc => {
      contacts.push({ id: doc.id, ...doc.data() });
    });
    callback(contacts);
  });
};

export const addContact = (contact) => {
  return addDoc(contactsRef, contact);
};

// contacts.js - Firebase delete funksiyası
export const deleteContact = async (id) => {
  try {
    // id-nin null, undefined və ya boş olmadığını yoxlayaq
    if (id === null || id === undefined || id === '') {
      throw new Error("Contact ID is required");
    }

    // id-ni string-ə çevirək (Firestore həmişə string ID gözləyir)
    const contactId = String(id).trim();
    
    // Boş string-dən sonra yenidən yoxlayaq
    if (!contactId) {
      throw new Error("Contact ID cannot be empty");
    }

    // Firestore doc reference yaradaq
    const contactDoc = doc(db, "contacts", contactId);
    await deleteDoc(contactDoc);
    console.log("✅ Contact deleted from Firebase:", contactId);
  } catch (error) {
    console.error("Error deleting contact from Firebase:", error);
    // Xətanı yenidən throw edək ki, App.jsx-də handle edilsin
    throw error;
  }
};

