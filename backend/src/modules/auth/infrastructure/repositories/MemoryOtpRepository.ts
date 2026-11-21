import { IOtpRepository, OtpRecord } from '../../domain/repositories/IOtpRepository.js';

export class MemoryOtpRepository implements IOtpRepository {
  private otpStore = new Map<string, OtpRecord>();
  private usedResetTokens = new Map<string, number>();

  private normalize(email: string): string {
    return email.trim().toLowerCase();
  }

  async findByEmail(email: string): Promise<OtpRecord | null> {
    const key = this.normalize(email);
    const record = this.otpStore.get(key);
    if (!record) return null;
    return { ...record };
  }

  async save(email: string, record: OtpRecord): Promise<void> {
    this.otpStore.set(this.normalize(email), { ...record });
  }

  async incrementAttempts(email: string): Promise<number> {
    const key = this.normalize(email);
    const record = this.otpStore.get(key);
    if (!record) return 0;
    record.attempts += 1;
    this.otpStore.set(key, record);
    return record.attempts;
  }

  async delete(email: string): Promise<void> {
    this.otpStore.delete(this.normalize(email));
  }

  async isResetTokenUsed(jti: string): Promise<boolean> {
    return this.usedResetTokens.has(jti);
  }

  async markResetTokenUsed(jti: string, expiresAt: number): Promise<void> {
    this.usedResetTokens.set(jti, expiresAt);
  }

  clear(): void {
    this.otpStore.clear();
    this.usedResetTokens.clear();
  }
}
