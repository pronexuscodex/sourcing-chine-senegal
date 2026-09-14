import { Injectable } from '@nestjs/common';
import type { ServiceFeeRuleInput } from '@sourcing/shared';

export interface QuoteItemCostInput {
  productCost: number;
  chinaInlandShipping: number;
  supplierFees: number;
  qualityControlFee: number;
  consolidationFee: number;
  internationalFreight: number;
  otherCosts: number;
  serviceFeeRule: ServiceFeeRuleInput;
}

export interface QuoteItemCostResult {
  realCost: number;
  serviceFee: number;
  clientPrice: number;
  margin: number;
}

/**
 * Moteur de tarification — pur et déterministe (ARCHITECTURE.md §10).
 * Montants en plus petite unité monétaire (entiers), jamais de float pour de l'argent.
 * Le détail de chaque ligne (hors realCost/margin) est ce qui s'affiche au client (§14) —
 * ne jamais introduire d'hypothèse cachée ici sans la refléter dans la ligne de coût correspondante.
 */
@Injectable()
export class PricingService {
  computeQuoteItem(input: QuoteItemCostInput): QuoteItemCostResult {
    const realCost =
      input.productCost +
      input.chinaInlandShipping +
      input.supplierFees +
      input.qualityControlFee +
      input.consolidationFee +
      input.internationalFreight +
      input.otherCosts;

    const serviceFee = this.computeServiceFee(realCost, input.serviceFeeRule);
    const clientPrice = realCost + serviceFee;
    const margin = clientPrice - realCost;

    return { realCost, serviceFee, clientPrice, margin };
  }

  private computeServiceFee(realCost: number, rule: ServiceFeeRuleInput): number {
    if (rule.type === 'flat') return rule.value;
    return Math.round(realCost * (rule.value / 100));
  }
}
