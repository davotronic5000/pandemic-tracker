"use client";

interface EpidemicCounterProps {
  epidemicCount: number;
  infectionRate: number;
}

export function EpidemicCounter({
  epidemicCount,
  infectionRate,
}: EpidemicCounterProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          Epidemics
        </span>
        <span className="text-3xl font-bold text-red-600">{epidemicCount}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          Infection Rate
        </span>
        <span className="text-xl font-bold text-orange-600">
          {infectionRate} cards/turn
        </span>
      </div>
      <div className="flex gap-1 mt-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i < epidemicCount ? "bg-red-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
