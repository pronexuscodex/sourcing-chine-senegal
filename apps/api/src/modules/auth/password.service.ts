import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/** Argon2id — cf. ARCHITECTURE.md §3, standard moderne recommandé au-dessus de bcrypt. */
@Injectable()
export class PasswordService {
  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
