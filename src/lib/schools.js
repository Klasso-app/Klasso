// Fonctions d'accès à Firestore pour les établissements et les profils
// utilisateurs. Modèle multi-établissement :
//
//   schools/{schoolId}                  informations de l'école, éditables
//                                        par le directeur ou un membre désigné
//   users/{uid}                         profil lié au compte Firebase Auth
//     - role: 'directeur' | 'secretaire' | 'enseignant' | 'parent'
//     - schoolId: référence vers l'établissement
//     - canEditSchoolSettings: bool (accordé par le directeur)
//   schools/{schoolId}/students/{id}
//   schools/{schoolId}/classes/{id}
//   schools/{schoolId}/teachers/{id}
//   schools/{schoolId}/grades/{id}

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

export async function createSchoolAndDirector({ uid, schoolName, city, country, directorName, email }) {
  const schoolRef = doc(collection(db, "schools"));

  await setDoc(schoolRef, {
    name: schoolName,
    city: city || "",
    country: country || "",
    address: "",
    phone: "",
    email: "",
    levels: [],
    createdAt: serverTimestamp(),
    createdBy: uid,
  });

  await setDoc(doc(db, "users", uid), {
    name: directorName,
    email,
    role: "directeur",
    schoolId: schoolRef.id,
    canEditSchoolSettings: true,
    createdAt: serverTimestamp(),
  });

  return schoolRef.id;
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getSchool(schoolId) {
  const snap = await getDoc(doc(db, "schools", schoolId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateSchool(schoolId, data) {
  await updateDoc(doc(db, "schools", schoolId), data);
}

export async function uploadSchoolLogo(schoolId, file) {
  const extension = file.name.split(".").pop();
  const logoRef = ref(storage, `schools/${schoolId}/logo.${extension}`);
  await uploadBytes(logoRef, file);
  const url = await getDownloadURL(logoRef);
  await updateSchool(schoolId, { logoUrl: url });
  return url;
}
