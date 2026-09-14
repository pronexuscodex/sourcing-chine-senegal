import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { PasswordService } from './password.service';
import { MfaService } from './mfa.service';

@Module({
  // Secrets/TTL passés explicitement à chaque sign/verify (TokenService) — pas de config globale ici,
  // pour garder les secrets access/refresh strictement séparés (ARCHITECTURE.md §8).
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, TokenService, PasswordService, MfaService],
  exports: [TokenService, PasswordService],
})
export class AuthModule {}
