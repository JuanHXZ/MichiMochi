import { UserProfile } from '../entities/User.js';

export interface IUserRepository {
  findById(uid: string): Promise<UserProfile | null>;
  findByEmail(email: string): Promise<UserProfile | null>;
  save(user: UserProfile, idToken?: string): Promise<UserProfile>;
  delete(uid: string): Promise<boolean>;
}
