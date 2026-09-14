import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';

/** TOTP — MFA obligatoire pour les comptes internes (ARCHITECTURE.md §8). */
@Injectable()
export class MfaService {
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  keyUri(accountName: string, secret: string): string {
    return authenticator.keyuri(accountName, 'Sourcing Platform', secret);
  }

  verify(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  }
}
