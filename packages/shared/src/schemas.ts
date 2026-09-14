import { z } from 'zod';
import { OrderStatus, Role, SourcingRequestStatus } from './enums';

// Schémas partagés — utilisés par apps/web (React Hook Form) et apps/api (validation DTO).
// Garder ce fichier comme unique source de vérité pour la forme des payloads d'API.

/**
 * `.optional()` seul ne traite PAS une chaîne vide comme absente — un champ optionnel
 * avec une contrainte (.email(), .url(), .uuid(), .min()) rejette la valeur `''` qu'envoie
 * un <input> HTML non rempli soumis via React Hook Form. Ce helper convertit `''` en
 * `undefined` avant validation, pour tout champ optionnel construit à partir de ce schéma.
 */
function optionalString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => (value === '' ? undefined : value), schema.optional());
}

export const requestItemSchema = z
  .object({
    productLink: optionalString(z.string().url()),
    photoDocumentId: optionalString(z.string().uuid()),
    description: z.string().min(3).max(2000).optional(),
    quantity: z.number().int().positive(),
    color: z.string().max(100).optional(),
    size: z.string().max(100).optional(),
    variants: z.record(z.string(), z.string()).optional(),
    budgetAmount: z.number().positive().optional(),
    budgetCurrency: z.enum(['XOF', 'CNY', 'USD', 'EUR']).default('XOF'),
    comments: z.string().max(2000).optional(),
  })
  .refine((data) => data.productLink || data.photoDocumentId || data.description, {
    message: 'Fournir au moins un lien, une photo ou une description du produit.',
  });
export type RequestItemInput = z.infer<typeof requestItemSchema>;

export const createSourcingRequestSchema = z.object({
  destination: z.string().min(2),
  items: z.array(requestItemSchema).min(1),
});
export type CreateSourcingRequestInput = z.infer<typeof createSourcingRequestSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(3), // email ou téléphone
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: optionalString(z.string().email()),
    phone: optionalString(z.string().min(6)),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Email ou téléphone requis.',
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const mfaVerifySchema = z.object({
  mfaChallenge: z.string().min(10),
  totpCode: z.string().length(6),
});
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;

export const mfaConfirmSchema = z.object({
  totpCode: z.string().length(6),
});
export type MfaConfirmInput = z.infer<typeof mfaConfirmSchema>;

const roleNames = Object.values(Role) as [Role, ...Role[]];

export const assignRoleSchema = z.object({
  roleName: z.enum(roleNames),
});
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;

export const createStaffUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  roleName: z.enum(roleNames),
});
export type CreateStaffUserInput = z.infer<typeof createStaffUserSchema>;

export const updateCustomerProfileSchema = z.object({
  firstName: optionalString(z.string().min(1)),
  lastName: optionalString(z.string().min(1)),
  companyName: z.string().max(200).optional(),
  preferredLanguage: z.enum(['fr', 'en']).optional(),
});
export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>;

export const createAddressSchema = z.object({
  label: z.string().max(100).optional(),
  line1: z.string().min(3),
  line2: z.string().max(200).optional(),
  city: z.string().min(1),
  region: z.string().max(100).optional(),
  country: z.string().length(2).default('SN'),
  phone: z.string().max(30).optional(),
});
export type CreateAddressInput = z.infer<typeof createAddressSchema>;

const sourcingRequestStatuses = Object.values(SourcingRequestStatus) as [
  SourcingRequestStatus,
  ...SourcingRequestStatus[],
];

export const updateSourcingRequestStatusSchema = z.object({
  status: z.enum(sourcingRequestStatuses),
});
export type UpdateSourcingRequestStatusInput = z.infer<typeof updateSourcingRequestStatusSchema>;

export const createSupplierSchema = z.object({
  name: z.string().min(1),
  contact: z.string().max(300).optional(),
  platform: z.enum(['ALIBABA', '1688', 'OTHER']).optional(),
  moq: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = createSupplierSchema.partial();
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

// Scores 0-10 ; issueRate = fraction (0-1) de commandes ayant eu un problème avec ce fournisseur.
export const createSupplierEvaluationSchema = z.object({
  priceScore: z.number().min(0).max(10),
  qualityScore: z.number().min(0).max(10),
  delayScore: z.number().min(0).max(10),
  reactivityScore: z.number().min(0).max(10),
  issueRate: z.number().min(0).max(1),
});
export type CreateSupplierEvaluationInput = z.infer<typeof createSupplierEvaluationSchema>;

// Moteur de tarification — ARCHITECTURE.md §10. Les montants sont en plus petite unité
// monétaire (jamais de float pour de l'argent), le taux de service est configurable par ligne.
export const serviceFeeRuleSchema = z.union([
  z.object({ type: z.literal('percentage'), value: z.number().min(0).max(100) }),
  z.object({ type: z.literal('flat'), value: z.number().int().min(0) }),
]);
export type ServiceFeeRuleInput = z.infer<typeof serviceFeeRuleSchema>;

export const createQuoteItemSchema = z.object({
  requestItemId: z.string().uuid(),
  supplierId: optionalString(z.string().uuid()),
  productCost: z.number().int().min(0),
  chinaInlandShipping: z.number().int().min(0),
  supplierFees: z.number().int().min(0).default(0),
  qualityControlFee: z.number().int().min(0).default(0),
  consolidationFee: z.number().int().min(0).default(0),
  internationalFreight: z.number().int().min(0),
  otherCosts: z.number().int().min(0).default(0),
  serviceFeeRule: serviceFeeRuleSchema,
});
export type CreateQuoteItemInput = z.infer<typeof createQuoteItemSchema>;

export const createQuoteSchema = z.object({
  requestId: z.string().uuid(),
  currency: z.enum(['XOF', 'CNY', 'USD', 'EUR']).default('XOF'),
  exchangeRateUsed: z.number().positive(),
  validUntil: z.string().datetime(),
  items: z.array(createQuoteItemSchema).min(1),
});
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

const orderStatuses = Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]];

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatuses),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const receiveWarehousePackageSchema = z.object({
  orderId: z.string().uuid(),
  photos: z.array(z.string()).default([]),
});
export type ReceiveWarehousePackageInput = z.infer<typeof receiveWarehousePackageSchema>;

export const createQualityInspectionSchema = z.object({
  quantityVerified: z.boolean(),
  variantVerified: z.boolean(),
  issueReported: z.boolean(),
  notes: z.string().max(2000).optional(),
  mediaDocumentIds: z.array(z.string()).default([]),
});
export type CreateQualityInspectionInput = z.infer<typeof createQualityInspectionSchema>;

export const createShipmentEventSchema = z.object({
  type: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
});
export type CreateShipmentEventInput = z.infer<typeof createShipmentEventSchema>;

export const createDeliverySchema = z.object({
  orderId: z.string().uuid(),
  addressId: z.string().uuid(),
});
export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;

export const createSupportTicketSchema = z.object({
  subject: z.string().min(3).max(200),
  orderId: optionalString(z.string().uuid()),
  message: z.string().min(1).max(5000),
});
export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;

export const createSupportMessageSchema = z.object({
  body: z.string().min(1).max(5000),
});
export type CreateSupportMessageInput = z.infer<typeof createSupportMessageSchema>;

export const SupportTicketStatus = ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'] as const;

export const updateSupportTicketStatusSchema = z.object({
  status: z.enum(SupportTicketStatus),
});
export type UpdateSupportTicketStatusInput = z.infer<typeof updateSupportTicketStatusSchema>;
