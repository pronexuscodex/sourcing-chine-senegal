import { computeEvaluationScore } from './supplier-score';

describe('computeEvaluationScore', () => {
  it('returns the max weighted score for a perfect, issue-free supplier', () => {
    const score = computeEvaluationScore({
      priceScore: 10,
      qualityScore: 10,
      delayScore: 10,
      reactivityScore: 10,
      issueRate: 0,
    });
    expect(score).toBe(10);
  });

  it('penalizes the score proportionally to the issue rate', () => {
    const clean = computeEvaluationScore({
      priceScore: 8,
      qualityScore: 8,
      delayScore: 8,
      reactivityScore: 8,
      issueRate: 0,
    });
    const problematic = computeEvaluationScore({
      priceScore: 8,
      qualityScore: 8,
      delayScore: 8,
      reactivityScore: 8,
      issueRate: 0.5,
    });
    expect(problematic).toBeCloseTo(clean * 0.5, 5);
  });

  it('weights quality more heavily than delay or reactivity', () => {
    const highQuality = computeEvaluationScore({
      priceScore: 5,
      qualityScore: 10,
      delayScore: 5,
      reactivityScore: 5,
      issueRate: 0,
    });
    const highDelay = computeEvaluationScore({
      priceScore: 5,
      qualityScore: 5,
      delayScore: 10,
      reactivityScore: 5,
      issueRate: 0,
    });
    expect(highQuality).toBeGreaterThan(highDelay);
  });
});
