import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  ok() {
    return { status: 'ok' };
  }

  @Get('db')
  async db() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
