import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  loginSchema,
  mfaConfirmSchema,
  mfaVerifySchema,
  refreshSchema,
  registerSchema,
  type LoginInput,
  type MfaConfirmInput,
  type MfaVerifyInput,
  type RefreshInput,
  type RegisterInput,
} from '@sourcing/shared';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

// Limite stricte par IP sur les routes exploitables pour du brute-force
// (mot de passe, code MFA) — plus stricte que le défaut global (ARCHITECTURE.md §13/§24).
const BRUTE_FORCE_GUARD = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(BRUTE_FORCE_GUARD)
  @Post('register')
  register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput) {
    return this.auth.register(body);
  }

  @Public()
  @Throttle(BRUTE_FORCE_GUARD)
  @Post('login')
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return this.auth.login(body.identifier, body.password);
  }

  @Public()
  @Throttle(BRUTE_FORCE_GUARD)
  @Post('mfa/verify')
  verifyMfa(@Body(new ZodValidationPipe(mfaVerifySchema)) body: MfaVerifyInput) {
    return this.auth.verifyMfaAndIssueTokens(body.mfaChallenge, body.totpCode);
  }

  @Public()
  @Post('refresh')
  refresh(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput) {
    return this.auth.refresh(body.refreshToken);
  }

  @Public()
  @Post('logout')
  async logout(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput) {
    await this.auth.logout(body.refreshToken);
    return { success: true };
  }

  @Post('mfa/enroll')
  enrollMfa(@CurrentUser() user: RequestUser) {
    return this.auth.initiateMfaEnrollment(user.id);
  }

  @Post('mfa/confirm')
  @Throttle(BRUTE_FORCE_GUARD)
  confirmMfa(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(mfaConfirmSchema)) body: MfaConfirmInput,
  ) {
    return this.auth.confirmMfaEnrollment(user.id, body.totpCode);
  }
}
