// Statuts partagés entre apps/web et apps/api — source unique de vérité.
// Voir ARCHITECTURE.md §7 pour la machine à états complète des commandes.

export const OrderStatus = {
  QUOTE_PENDING: 'QUOTE_PENDING',
  QUOTE_SENT: 'QUOTE_SENT',
  QUOTE_ACCEPTED: 'QUOTE_ACCEPTED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAID: 'PAID',
  ORDERED: 'ORDERED',
  SUPPLIER_PROCESSING: 'SUPPLIER_PROCESSING',
  READY_FOR_SHIPMENT: 'READY_FOR_SHIPMENT',
  AT_CHINA_WAREHOUSE: 'AT_CHINA_WAREHOUSE',
  QUALITY_CHECK: 'QUALITY_CHECK',
  CONSOLIDATED: 'CONSOLIDATED',
  SHIPPED: 'SHIPPED',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED_SENEGAL: 'ARRIVED_SENEGAL',
  CUSTOMS_PROCESSING: 'CUSTOMS_PROCESSING',
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/** Transitions autorisées — même table côté backend (guard) et frontend (affichage). */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  QUOTE_PENDING: ['QUOTE_SENT'],
  QUOTE_SENT: ['QUOTE_ACCEPTED', 'CANCELLED'],
  QUOTE_ACCEPTED: ['PAYMENT_PENDING'],
  PAYMENT_PENDING: ['PAID', 'CANCELLED'],
  PAID: ['ORDERED'],
  ORDERED: ['SUPPLIER_PROCESSING'],
  SUPPLIER_PROCESSING: ['READY_FOR_SHIPMENT'],
  READY_FOR_SHIPMENT: ['AT_CHINA_WAREHOUSE'],
  AT_CHINA_WAREHOUSE: ['QUALITY_CHECK'],
  QUALITY_CHECK: ['CONSOLIDATED', 'DISPUTED'],
  CONSOLIDATED: ['SHIPPED'],
  SHIPPED: ['IN_TRANSIT'],
  IN_TRANSIT: ['ARRIVED_SENEGAL'],
  ARRIVED_SENEGAL: ['CUSTOMS_PROCESSING'],
  CUSTOMS_PROCESSING: ['READY_FOR_DELIVERY'],
  READY_FOR_DELIVERY: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: ['QUALITY_CHECK', 'CANCELLED'],
};

export const QuoteStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus];

export const QUOTE_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ['SENT'],
  SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};

export const SourcingRequestStatus = {
  RECEIVED: 'RECEIVED',
  IN_ANALYSIS: 'IN_ANALYSIS',
  QUOTED: 'QUOTED',
  CLOSED: 'CLOSED',
} as const;
export type SourcingRequestStatus =
  (typeof SourcingRequestStatus)[keyof typeof SourcingRequestStatus];

export const SOURCING_REQUEST_STATUS_TRANSITIONS: Record<SourcingRequestStatus, SourcingRequestStatus[]> = {
  RECEIVED: ['IN_ANALYSIS'],
  IN_ANALYSIS: ['QUOTED', 'CLOSED'],
  QUOTED: ['CLOSED'],
  CLOSED: [],
};

export const PaymentStatus = {
  PENDING: 'PENDING',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const Role = {
  CUSTOMER: 'CUSTOMER',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  SOURCING_AGENT: 'SOURCING_AGENT',
  LOGISTICS_AGENT: 'LOGISTICS_AGENT',
  QUALITY_CONTROL: 'QUALITY_CONTROL',
  FINANCE: 'FINANCE',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];
