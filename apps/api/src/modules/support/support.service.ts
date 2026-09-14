import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { CreateSupportTicketInput } from '@sourcing/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async create(userId: string, input: CreateSupportTicketInput) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: input.subject,
        orderId: input.orderId,
        messages: { create: { authorId: userId, body: input.message } },
      },
      include: { messages: true },
    });
  }

  listMine(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOneOwned(userId: string, id: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException('Ticket introuvable.');
    return ticket;
  }

  async addMessageAsCustomer(userId: string, ticketId: string, body: string) {
    const ticket = await this.findOneOwned(userId, ticketId);
    if (ticket.status === 'CLOSED') {
      throw new BadRequestException('Ce ticket est clos — ouvrez un nouveau ticket.');
    }

    await this.prisma.supportMessage.create({ data: { ticketId, authorId: userId, body } });
    // Le client relance → redevient prioritaire côté support, quel que soit l'état précédent.
    return this.prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'OPEN' } });
  }

  listAll(status?: string) {
    return this.prisma.supportTicket.findMany({
      where: status ? { status } : undefined,
      include: { messages: { orderBy: { createdAt: 'asc' } }, user: { select: { email: true, phone: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOneAny(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        // Jamais `user: true` — fuiterait passwordHash/mfaSecret vers le staff (voir
        // feedback_no_unscoped_user_include.md). Un champ sensible manquant ici doit
        // être ajouté explicitement, jamais récupéré via un include complet.
        user: { select: { id: true, email: true, phone: true, status: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket introuvable.');
    return ticket;
  }

  async addMessageAsStaff(ticketId: string, authorId: string, body: string) {
    const ticket = await this.findOneAny(ticketId);
    if (ticket.status === 'CLOSED') {
      throw new BadRequestException('Ce ticket est clos — rouvrez-le avant de répondre.');
    }

    await this.prisma.supportMessage.create({ data: { ticketId, authorId, body } });
    // Une réponse staff met la balle dans le camp du client (§10 "Mes notifications").
    const updated = await this.prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'PENDING' } });

    this.events.emit('support.reply.received', { ticketId, userId: ticket.userId });

    return updated;
  }

  async updateStatus(id: string, status: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket introuvable.');
    // Contrairement aux flux logistiques (§7), le statut d'un ticket support est
    // conversationnel, pas une chaîne d'étapes physiques/financières strictement
    // ordonnée — pas de table de transitions rigide ici, le staff choisit librement.
    return this.prisma.supportTicket.update({ where: { id }, data: { status } });
  }
}
