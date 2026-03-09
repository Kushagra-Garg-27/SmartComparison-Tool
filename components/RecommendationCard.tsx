import React from "react";
import { Lightbulb, Clock, ShieldCheck } from "lucide-react";

interface RecommendationCardProps {
  recommendation: string;
  summary: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  summary,
}) => {
  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3.5 shadow-sm">
      <div className="flex items-center space-x-2 mb-2">
        <div className="h-6 w-6 rounded-lg bg-amber-100 flex items-center justify-center">
          <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
        </div>
        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
          Recommendation
        </h4>
      </div>
      <p className="text-xs text-amber-800 leading-relaxed">{recommendation}</p>
      {summary && (
        <p className="text-[11px] text-amber-600/80 mt-2 leading-relaxed italic">
          {summary}
        </p>
      )}
    </div>
  );
};

/** Trust meter for a single seller. */
interface TrustRowProps {
  platform: string;
  score: number;
}

const TrustRow: React.FC<TrustRowProps> = ({ platform, score }) => {
  const color =
    score >= 90
      ? "bg-emerald-500"
      : score >= 75
        ? "bg-blue-500"
        : score >= 60
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div className="flex items-center space-x-2">
      <span className="text-[11px] font-medium text-gray-700 w-16 truncate">
        {platform}
      </span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-gray-600 w-8 text-right">
        {score}%
      </span>
    </div>
  );
};

interface SellerTrustBlockProps {
  products: { platform: string; sellerTrustScore: number }[];
}

export const SellerTrustBlock: React.FC<SellerTrustBlockProps> = ({
  products,
}) => {
  // Dedupe by platform, keep highest score
  const platformMap = new Map<string, number>();
  products.forEach((p) => {
    if (
      p.sellerTrustScore > 0 &&
      (!platformMap.has(p.platform) ||
        platformMap.get(p.platform)! < p.sellerTrustScore)
    ) {
      platformMap.set(p.platform, p.sellerTrustScore);
    }
  });

  const entries = Array.from(platformMap.entries()).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center space-x-2 mb-3">
        <div className="h-6 w-6 rounded-lg bg-indigo-100 flex items-center justify-center">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
        </div>
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
          Seller Trust
        </h4>
      </div>
      <div className="space-y-2">
        {entries.map(([platform, score]) => (
          <TrustRow key={platform} platform={platform} score={score} />
        ))}
      </div>
    </div>
  );
};
