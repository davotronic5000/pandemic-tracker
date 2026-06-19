"use client";

import { CityProbability } from "../lib/types";
import { COLOR_CONFIG } from "../lib/constants";

interface CityRowProps {
  city: CityProbability;
  totalCards: number;
}

export function CityRow({ city, totalCards }: CityRowProps) {
  const config = COLOR_CONFIG[city.color];
  const probPercent = (city.probability * 100).toFixed(1);

  const bgOpacity =
    city.probability > 0.5
      ? "bg-opacity-100"
      : city.probability > 0.2
        ? "bg-opacity-60"
        : city.probability > 0
          ? "bg-opacity-30"
          : "bg-opacity-10";

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 min-h-12 border-l-4 ${config.border} ${config.bg} ${bgOpacity} rounded-r-lg mb-1`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`font-medium ${config.text} truncate`}>
          {city.name}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {city.cardsBySection.map((s) => (
          <span
            key={s.sectionIndex}
            className="inline-flex items-center justify-center h-6 px-1.5 rounded-full bg-white/70 text-xs font-bold text-gray-700 border border-gray-300 gap-0.5"
            title={`${s.count} card(s) in section ${s.sectionIndex + 1}`}
          >
            <span className="text-gray-400">S{s.sectionIndex + 1}</span>
            <span>×{s.count}</span>
          </span>
        ))}

        <span className="text-sm text-gray-600 w-10 text-right">
          {city.totalCardsInDeck}/{totalCards}
        </span>

        <span
          className={`text-sm font-bold w-14 text-right ${
            city.probability > 0.5
              ? "text-red-600"
              : city.probability > 0.2
                ? "text-orange-600"
                : city.probability > 0
                  ? "text-gray-700"
                  : "text-gray-400"
          }`}
        >
          {probPercent}%
        </span>
      </div>
    </div>
  );
}
