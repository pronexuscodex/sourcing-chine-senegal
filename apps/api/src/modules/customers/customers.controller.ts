import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  createAddressSchema,
  updateCustomerProfileSchema,
  type CreateAddressInput,
  type UpdateCustomerProfileInput,
} from '@sourcing/shared';
import { CustomersService } from './customers.service';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

// Toutes les routes ici opèrent sur le profil du user courant (pas de :id) —
// l'ownership vient du token, pas d'un paramètre d'URL (protection anti-IDOR).
@ApiTags('customers')
@Controller('customers/me')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  getProfile(@CurrentUser() user: RequestUser) {
    return this.customers.getProfile(user.id);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(updateCustomerProfileSchema)) body: UpdateCustomerProfileInput,
  ) {
    return this.customers.updateProfile(user.id, body);
  }

  @Get('addresses')
  listAddresses(@CurrentUser() user: RequestUser) {
    return this.customers.listAddresses(user.id);
  }

  @Post('addresses')
  addAddress(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createAddressSchema)) body: CreateAddressInput,
  ) {
    return this.customers.addAddress(user.id, body);
  }
}
