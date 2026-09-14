export interface SupplierEvaluationScores {
  priceScore: number;
  qualityScore: number;
  delayScore: number;
  reactivityScore: number;
  issueRate: number;
}

/**
 * Score composite d'une évaluation individuelle (0-10) — ARCHITECTURE.md §12.
 * Pondération : qualité et prix comptent le plus, un taux de problème élevé pénalise le score.
 */
export function computeEvaluationScore(input: SupplierEvaluationScores): number {
  const weighted =
    input.priceScore * 0.25 +
    input.qualityScore * 0.35 +
    input.delayScore * 0.2 +
    input.reactivityScore * 0.2;
  return Math.round(weighted * (1 - input.issueRate) * 100) / 100;
}
