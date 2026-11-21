import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { UserProfile } from '../../domain/entities/User.js';
import { ENV } from '../../../../shared/config/env.js';
import { adminAuth, adminDb } from '../../../../shared/config/firebaseAdmin.js';

export class MemoryUserRepository implements IUserRepository {
  private usersStore = new Map<string, UserProfile>();

  async findById(uid: string): Promise<UserProfile | null> {
    const cached = this.usersStore.get(uid);
    if (cached) {
      return cached;
    }

    if (ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
      try {
        const userRecord = await adminAuth.getUser(uid);
        let docData: any = {};
        try {
          const docSnap = await adminDb.collection('users').doc(uid).get();
          if (docSnap.exists) {
            docData = docSnap.data() || {};
          }
        } catch {
          // Si firestore falla, continuar con auth
        }

        const profile: UserProfile = {
          uid: userRecord.uid,
          email: userRecord.email || '',
          fullName: docData.fullName || userRecord.displayName || 'Usuario',
          phone: docData.phone || userRecord.phoneNumber || '',
          address: docData.address || '',
          city: docData.city || '',
          photoURL: docData.photoURL || userRecord.photoURL || null,
          provider: (docData.provider as any) || 'password',
          createdAt: docData.createdAt || userRecord.metadata?.creationTime || new Date().toISOString(),
        };

        this.usersStore.set(uid, profile);
        return profile;
      } catch (adminErr) {
        console.warn('[MemoryUserRepository] Advertencia al consultar usuario en Firebase Admin:', adminErr);
      }
    }

    return null;
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.usersStore.values()) {
      if (user.email.toLowerCase() === normalized) {
        return user;
      }
    }

    if (ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
      try {
        const userRecord = await adminAuth.getUserByEmail(normalized);
        if (userRecord) {
          return this.findById(userRecord.uid);
        }
      } catch {
        // No encontrado en Firebase Admin
      }
    }

    return null;
  }

  async save(user: UserProfile, idToken?: string): Promise<UserProfile> {
    this.usersStore.set(user.uid, user);

    // Sincronizar en Firestore
    try {
      if (ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
        await adminDb.collection('users').doc(user.uid).set(user, { merge: true });
      } else if (idToken) {
        const fsUrl = `https://firestore.googleapis.com/v1/projects/${ENV.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${user.uid}`;
        await fetch(fsUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            fields: {
              uid: { stringValue: user.uid },
              email: { stringValue: user.email },
              fullName: { stringValue: user.fullName },
              phone: { stringValue: user.phone || '' },
              address: { stringValue: user.address || '' },
              city: { stringValue: user.city || '' },
              photoURL: { stringValue: user.photoURL || '' },
              provider: { stringValue: user.provider },
              createdAt: { stringValue: user.createdAt },
            },
          }),
        });
      }
    } catch (err) {
      console.warn('[MemoryUserRepository] Advertencia al sincronizar en Firestore:', err);
    }

    return user;
  }

  async delete(uid: string): Promise<boolean> {
    return this.usersStore.delete(uid);
  }
}

export const userRepository = new MemoryUserRepository();
