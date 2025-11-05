import { CiMenuBurger } from "react-icons/ci";
import "./index.css";
import { MdDelete } from "react-icons/md";
import { IoIosCall } from "react-icons/io";
import {
  addContact,
  deleteContact,
  listenContacts,
} from "./js/services/contacts";

import {
  saveContactIndexedDB,
  getPendingContacts,
  clearPendingContacts,
  deleteContactFromIndexedDB,
} from "./idb";

import React, { useEffect, useState } from "react";

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: "", number: "" });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker Registered: ", registration);
        })
        .catch((error) => {
          console.log("Service Worker Registration Failed: ", error);
        });
    }
  }, []);

  useEffect(() => {
    const unsub = listenContacts((data) => {
      setContacts(data);
    });
    return () => unsub();
  }, []);

  // Online/Offline status tracking and sync
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);

      // Sync pending contacts when coming back online
      try {
        const pending = await getPendingContacts();
        if (pending.length > 0) {
          console.log(`[Sync] Found ${pending.length} pending contacts to sync`);

          for (const contact of pending) {
            try {
              await addContact(contact);
              console.log("[Sync] Contact synced:", contact);
            } catch (error) {
              console.error("[Sync] Error syncing contact:", error);
            }
          }

          await clearPendingContacts();
          console.log("✅ Pending contacts synced to Firestore after going online!");
        }
      } catch (error) {
        console.error("[Sync] Error during sync:", error);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("⚠️ App went offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync check if already online
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.number) {
      alert("Zəhmət olmasa, ad və nömrə daxil edin!");
      return;
    }

    const contact = { name: form.name.trim(), number: form.number.trim() };

    if (!navigator.onLine) {
      try {
        await saveContactIndexedDB(contact);
        alert("✅ Offline yadda saxlandı. İnternet gələndə avtomatik göndəriləcək!");

        if ("serviceWorker" in navigator && "sync" in navigator.serviceWorker) {
          const reg = await navigator.serviceWorker.ready;
          reg.sync.register("sync-contacts");
        }
      } catch (error) {
        console.error("Error saving contact offline:", error);
        alert("❌ Xəta: Kontakt yadda saxlanılmadı!");
      }
      setForm({ name: "", number: "" });
      setModalOpen(false);
      return;
    }

    try {
      await addContact(contact);
      console.log("✅ Contact added successfully");
    } catch (error) {
      console.error("Error adding contact:", error);
      alert("❌ Xəta: Kontakt əlavə edilmədi!");
    }
    setForm({ name: "", number: "" });
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    // ID-nin mövcud olduğunu yoxlayaq
    if (id === null || id === undefined || id === '') {
      console.error("Invalid contact ID:", id);
      alert("❌ Xəta: Kontakt ID-si tapılmadı!");
      return;
    }

    // Onay soruşulması (opsional, istəyə görə silə bilərsiniz)
    if (!window.confirm("Bu kontakti silmək istədiyinizə əminsiniz?")) {
      return;
    }

    if (navigator.onLine) {
      try {
        // ID-ni string-ə çevirək
        const contactId = String(id).trim();
        await deleteContact(contactId);
        console.log("✅ Contact deleted successfully from Firebase");
      } catch (error) {
        console.error("Error deleting contact from Firebase:", error);
        alert("❌ Xəta: Kontakt silinmədi! " + (error.message || ""));
      }
    } else {
      try {
        // Offline üçün də ID-ni string-ə çevirək
        const contactId = String(id).trim();
        await deleteContactFromIndexedDB(contactId);
        alert("✅ Kontakt offline silindi, sinxronlaşdırılacaq");
      } catch (error) {
        console.error("Error deleting contact from IndexedDB:", error);
        alert("❌ Xəta: Kontakt silinmədi!");
      }
    }
  };

  return (
    <>
      <nav>
        <a className="nav-logo" href="/">
          Postgram
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              backgroundColor: isOnline ? "#4caf50" : "#f44336",
              color: "#fff",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#fff",
                display: "inline-block",
              }}
            />
            {isOnline ? "Online" : "Offline"}
          </div>
          <CiMenuBurger className="nav-menu" />
        </div>
      </nav>

      <main>
        <h1>Kontaktlarınızı paylaşın</h1>

        {!isOnline && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#fff3cd",
              color: "#856404",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            ⚠️ Offline rejimdəsiniz. Yeni əlavə edilən kontaktlar sinxronlaşdırılacaq.
          </div>
        )}

        {contacts.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#fff",
              opacity: 0.7,
            }}
          >
            <p>Hələ heç bir kontakt yoxdur.</p>
            <p style={{ fontSize: "14px", marginTop: "8px" }}>
              "+" düyməsinə basaraq yeni kontakt əlavə edin.
            </p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div className="contacts pk-contact" key={contact.id}>
              <div className="contact-image">
                <img src="/icons/contact.avif" alt="contact thumb" />
              </div>
              <div className="contact-details">
                <div className="contact-title">{contact.name}</div>
                <div className="contact-numbers">{contact.number}</div>
              </div>
              <div className="contact-options">
                <IoIosCall />
              <MdDelete onClick={() => handleDelete(contact.id)} />
              </div>
            </div>
          ))
        )}

        <button className="add-btn" onClick={() => setModalOpen(true)}>
          +
        </button>

        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <form className="add-contact">
                <h3>Yeni Kontakt</h3>
                <input
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ad Soyad"
                  type="text"
                />
                <input
                  name="number"
                  placeholder="Telefon Nömrəsi"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  type="text"
                />
                <button type="button" onClick={handleSubmit}>
                  Kontakt Əlavə Et
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default App;
