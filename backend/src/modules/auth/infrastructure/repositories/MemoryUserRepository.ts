import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { UserProfile, UserRole } from '../../domain/entities/User.js';
import { ENV } from '../../../../shared/config/env.js';
import { adminAuth } from '../../../../shared/config/firebaseAdmin.js';

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
        const roleClaim = userRecord.customClaims?.role === 'admin' ? 'admin' : 'customer';
        const profile: UserProfile = {
          uid: userRecord.uid,
          email: userRecord.email || '',
          fullName: userRecord.displayName || 'Usuario',
          role: roleClaim,
          phone: userRecord.phoneNumber || '',
          address: '',
          city: '',
          photoURL: userRecord.photoURL || null,
          provider: 'password',
          createdAt: userRecord.metadata?.creationTime || new Date().toISOString(),
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

  async save(user: UserProfile): Promise<UserProfile> {
    this.usersStore.set(user.uid, user);
    return user;
  }

  async updateRole(uid: string, role: UserRole): Promise<UserProfile | null> {
    const existing = await this.findById(uid);
    if (!existing) return null;
    const updated: UserProfile = {
      ...existing,
      role,
      updatedAt: new Date().toISOString(),
    };
    this.usersStore.set(uid, updated);
    return updated;
  }

  async delete(uid: string): Promise<boolean> {
    return this.usersStore.delete(uid);
  }

  clear(): void {
    this.usersStore.clear();
  }
}
