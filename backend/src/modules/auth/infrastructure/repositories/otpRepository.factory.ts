import { ENV } from '../../../../shared/config/env.js';
import { getPgPool } from '../../../../shared/database/postgres.js';
import { IOtpRepository } from '../../domain/repositories/IOtpRepository.js';
import { MemoryOtpRepository } from './MemoryOtpRepository.js';
import { PostgresOtpRepository } from './PostgresOtpRepository.js';

let activeOtpRepository: IOtpRepository =
  ENV.NODE_ENV !== 'test' && ENV.PERSISTENCE_MODE === 'postgres'
    ? new PostgresOtpRepository(getPgPool())
    : new MemoryOtpRepository();

export const getOtpRepository = (): IOtpRepository => activeOtpRepository;

export const setOtpRepository = (repo: IOtpRepository): void => {
  activeOtpRepository = repo;
};

export const otpRepository: IOtpRepository = {
  findByEmail: (email) => activeOtpRepository.findByEmail(email),
  save: (email, record) => activeOtpRepository.save(email, record),
  incrementAttempts: (email) => activeOtpRepository.incrementAttempts(email),
  delete: (email) => activeOtpRepository.delete(email),
  isResetTokenUsed: (jti) => activeOtpRepository.isResetTokenUsed(jti),
  markResetTokenUsed: (jti, expiresAt) => activeOtpRepository.markResetTokenUsed(jti, expiresAt),
};
