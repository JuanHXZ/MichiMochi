import { ENV } from '../../../../shared/config/env.js';
import { getPgPool } from '../../../../shared/database/postgres.js';
import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { MemoryUserRepository } from './MemoryUserRepository.js';
import { PostgresUserRepository } from './PostgresUserRepository.js';

let activeUserRepository: IUserRepository =
  ENV.NODE_ENV !== 'test' && ENV.PERSISTENCE_MODE === 'postgres'
    ? new PostgresUserRepository(getPgPool())
    : new MemoryUserRepository();

export const getUserRepository = (): IUserRepository => activeUserRepository;

export const setUserRepository = (repo: IUserRepository): void => {
  activeUserRepository = repo;
};

export const userRepository: IUserRepository = {
  findById: (uid) => activeUserRepository.findById(uid),
  findByEmail: (email) => activeUserRepository.findByEmail(email),
  save: (user) => activeUserRepository.save(user),
  updateRole: (uid, role) => activeUserRepository.updateRole(uid, role),
  delete: (uid) => activeUserRepository.delete(uid),
};
