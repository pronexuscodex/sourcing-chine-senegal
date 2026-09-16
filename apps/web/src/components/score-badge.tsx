import { Star } from 'lucide-react';

export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">Non évalué</span>;
  }

  const className =
    score >= 7
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      : score >= 4
        ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
        : 'bg-red-50 text-red-700 ring-red-600/20';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${className}`}>
      <Star className="h-3.5 w-3.5" strokeWidth={2.25} fill="currentColor" />
      {score.toFixed(1)}/10
    </span>
  );
}
