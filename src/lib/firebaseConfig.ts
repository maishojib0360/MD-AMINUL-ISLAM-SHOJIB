/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let isFirebaseAvailable = false;
let app: any = null;
let db: any = null;
let auth: any = null;

// Determine if config is valid and not a placeholder
const config = firebaseConfig as any;
const isRealConfig = config && 
  !("isPlaceholder" in config) &&
  config.apiKey && 
  config.apiKey !== 'placeholder-api-key';

if (isRealConfig) {
  try {
    app = initializeApp(config);
    db = getFirestore(app, config.firestoreDatabaseId);
    auth = getAuth(app);
    isFirebaseAvailable = true;
    console.log("Firebase initialized successfully with real configuration.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.log("Firebase is not configured yet. Running in offline fallback (local storage) mode.");
}

export { app, db, auth, isFirebaseAvailable };
export default firebaseConfig;
