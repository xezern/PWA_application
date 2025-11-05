// src/firebase.js
import { initializeApp } from "firebase/app";
// lazımdırsa Firestore, Auth və s. burada import edirsən
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC3jDbeBYEU4h3x49qfSjPfqqO3fxPHu-4",
  authDomain: "postgram-pwa.firebaseapp.com",
  projectId: "postgram-pwa",
  storageBucket: "postgram-pwa.appspot.com",
  messagingSenderId: "244451734554",
  appId: "1:244451734554:web:93cec84eb86c ee6f1b8da3"
};

const app = initializeApp(firebaseConfig);

// Firestore offline persistence ilə aktivləşdir
const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

console.log("✅ Firestore offline persistence aktivləşdirildi");

export default app;
export { db };
