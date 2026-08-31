// Configuration Firebase pour Klasso.
// L'app est multi-établissement : chaque école est un document dans la
// collection "schools", et toutes ses données (élèves, classes, notes,
// enseignants...) vivent dans des sous-collections sous ce document,
// afin qu'un établissement ne voie jamais les données d'un autre.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBYb_SZAJWQSktMgYNSHkBOTHZ5JDATh3E",
  authDomain: "klasso-2001.firebaseapp.com",
  projectId: "klasso-2001",
  storageBucket: "klasso-2001.firebasestorage.app",
  messagingSenderId: "490828938338",
  appId: "1:490828938338:web:a7b85676ccfae9fe3aa53b",
  measurementId: "G-6LS0ELQ7EM",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
