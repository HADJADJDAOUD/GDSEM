// src/api/firebase.js
import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
console.log("import.meta.env:", import.meta.env.VITE_FIREBASE_API_KEY);
// put actual values in .env: REACT_APP_... (never commit keys)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * uploadProof(file, userId, onProgress) -> Promise<string downloadUrl>
 * - file: File object from <input type="file" />
 * - userId: used to namespace the file
 * - onProgress: optional callback(progressPercent)
 */
export async function uploadProof(file, userId, onProgress) {
  if (!file) throw new Error("uploadProof: file is required");

  const ext = (file.name && file.name.split(".").pop()) || "bin";
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `proofs/${userId}/${unique}.${ext}`;
  const storageRef = ref(storage, path);
  console.log("Uploading to path:", path);
  console.log("firebaseConfig:", firebaseConfig);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || "application/octet-stream",
    });

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (typeof onProgress === "function") onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

export default { uploadProof };
