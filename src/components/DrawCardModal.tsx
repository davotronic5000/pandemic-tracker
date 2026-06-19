"use client";

import { CityProbability, CityColor } from "../lib/types";
import { COLOR_CONFIG, COLOR_ORDER } from "../lib/constants";

interface DrawCardModalProps {
  probabilities: CityProbability[];
  infectionRate: number;
  cardsDrawnThisTurn: number;
  onDraw: (cityId: string) => void;
  onClose: () => void;
}

export function DrawCardModal({
  probabilities,
  infectionRate,
  cardsDrawnThisTurn,
  onDraw,
  onClose,
}: DrawCardModalProps) {
  const remaining = infectionRate - cardsDrawnThisTurn;
  const drawableCities = probabilities.filter((p) => p.totalCardsInDeck > 0);

  const grouped = COLOR_ORDER.reduce(
    (acc, color) => {
      const cities = drawableCities
        .filter((p) => p.color === color)
        .sort((a, b) => b.probability - a.probability);
      if (cities.length > 0) acc[color] = cities;
      return acc;
    },
    {} as Record<CityColor, CityProbability[]>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold">Draw Infection Card</h2>
            <p className="text-sm text-gray-500">
              Cards remaining to draw: {remaining}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:bg-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {COLOR_ORDER.filter((c) => grouped[c]).map((color) => {
            const config = COLOR_CONFIG[color];
            return (
              <div key={color} className="mb-4">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wide mb-1 ${config.text}`}
                >
                  {config.label}
                </h3>
                {grouped[color].map((city) => (
                  <button
                    key={city.cityId}
                    onClick={() => onDraw(city.cityId)}
                    className={`w-full flex items-center justify-between px-4 py-3 min-h-14 border-l-4 ${config.border} ${config.bg} rounded-r-lg mb-1 active:brightness-90 transition-colors`}
                  >
                    <span className={`font-medium ${config.text}`}>
                      {city.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {city.totalCardsInDeck} in deck
                      </span>
                      <span className="text-sm font-bold text-gray-700">
                        {(city.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
