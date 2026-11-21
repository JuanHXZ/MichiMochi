export interface OtpRecord {
  codeHash: string;
  expiresAt: number;
  createdAt: number;
  attempts: number;
}

export interface IOtpRepository {
  findByEmail(email: string): Promise<OtpRecord | null>;
  save(email: string, record: OtpRecord): Promise<void>;
  incrementAttempts(email: string): Promise<number>;
  delete(email: string): Promise<void>;
  isResetTokenUsed(jti: string): Promise<boolean>;
  markResetTokenUsed(jti: string, expiresAt: number): Promise<void>;
}
