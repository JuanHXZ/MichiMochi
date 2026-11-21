import { UserProfile, UserRole } from '../entities/User.js';

export interface IUserRepository {
  findById(uid: string): Promise<UserProfile | null>;
  findByEmail(email: string): Promise<UserProfile | null>;
  save(user: UserProfile): Promise<UserProfile>;
  updateRole(uid: string, role: UserRole): Promise<UserProfile | null>;
  delete(uid: string): Promise<boolean>;
}
