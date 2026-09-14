import { PricingService } from './pricing.service';

describe('PricingService.computeQuoteItem', () => {
  const service = new PricingService();

  it('sums every cost component into realCost, excluding the service fee', () => {
    const result = service.computeQuoteItem({
      productCost: 75_000,
      chinaInlandShipping: 5_000,
      supplierFees: 0,
      qualityControlFee: 3_000,
      consolidationFee: 0,
      internationalFreight: 35_000,
      otherCosts: 0,
      serviceFeeRule: { type: 'flat', value: 10_000 },
    });
    expect(result.realCost).toBe(75_000 + 5_000 + 3_000 + 35_000);
    expect(result.serviceFee).toBe(10_000);
    expect(result.clientPrice).toBe(128_000);
    expect(result.margin).toBe(10_000);
  });

  it('computes a percentage service fee off realCost and rounds to the nearest unit', () => {
    const result = service.computeQuoteItem({
      productCost: 10_000,
      chinaInlandShipping: 0,
      supplierFees: 0,
      qualityControlFee: 0,
      consolidationFee: 0,
      internationalFreight: 0,
      otherCosts: 0,
      serviceFeeRule: { type: 'percentage', value: 12.5 },
    });
    expect(result.realCost).toBe(10_000);
    expect(result.serviceFee).toBe(1_250);
    expect(result.clientPrice).toBe(11_250);
  });

  it('never lets margin diverge from clientPrice minus realCost', () => {
    const result = service.computeQuoteItem({
      productCost: 33_333,
      chinaInlandShipping: 1_111,
      supplierFees: 222,
      qualityControlFee: 0,
      consolidationFee: 0,
      internationalFreight: 4_444,
      otherCosts: 0,
      serviceFeeRule: { type: 'percentage', value: 15 },
    });
    expect(result.margin).toBe(result.clientPrice - result.realCost);
  });
});
