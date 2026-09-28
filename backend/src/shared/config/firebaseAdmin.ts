import admin from 'firebase-admin';
import { ENV } from './env.js';

if (!admin.apps.length) {
  if (ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: ENV.FIREBASE_PROJECT_ID,
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
        privateKey: ENV.FIREBASE_PRIVATE_KEY,
      }),
    });
  } else {
    // Inicialización por defecto con Project ID para entorno local
    admin.initializeApp({
      projectId: ENV.FIREBASE_PROJECT_ID,
    });
  }
}

export const firebaseAdmin = admin;
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
