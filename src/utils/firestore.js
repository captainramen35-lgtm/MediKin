import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const PROFILES_COLLECTION = "profiles";
const USERS_COLLECTION = "users";

// --- User ---
export const createUserDoc = async (uid, email, displayName) => {
  await setDoc(doc(db, USERS_COLLECTION, uid), {
    uid,
    email,
    displayName,
    createdAt: serverTimestamp(),
  }, { merge: true });
};

// --- Profiles ---
export const createProfile = async (ownerId, profileData) => {
  const docRef = await addDoc(collection(db, PROFILES_COLLECTION), {
    ...profileData,
    ownerId,
    familyMembers: [ownerId],
    cachedBrief: null,
    lastUpdated: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateProfile = async (profileId, data) => {
  await updateDoc(doc(db, PROFILES_COLLECTION, profileId), {
    ...data,
    lastUpdated: serverTimestamp(),
  });
};

export const getProfile = async (profileId) => {
  const snap = await getDoc(doc(db, PROFILES_COLLECTION, profileId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const getUserProfiles = async (uid) => {
  const q = query(
    collection(db, PROFILES_COLLECTION),
    where("familyMembers", "array-contains", uid)
  );
  const snap = await getDocs(q);
  const profiles = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort client-side (avoids composite index requirement)
  return profiles.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
};

export const updateCachedBrief = async (profileId, brief, criticalAlerts) => {
  await updateDoc(doc(db, PROFILES_COLLECTION, profileId), {
    cachedBrief: {
      text: brief,
      criticalAlerts,
      generatedAt: serverTimestamp(),
    },
  });
};
