"use client";

import { useState } from "react";
import { CityProbability, CityColor } from "../lib/types";
import { COLOR_CONFIG, COLOR_ORDER } from "../lib/constants";

interface DrawCardModalProps {
  probabilities: CityProbability[];
  remaining: number;
  title?: string;
  onDraw: (cityId: string) => void;
  onClose: () => void;
}

export function DrawCardModal({
  probabilities,
  remaining,
  title = "Draw Infection Card",
  onDraw,
  onClose,
}: DrawCardModalProps) {
  // Freeze the row order (and membership) as of when the modal opened, so
  // cities don't reshuffle or disappear as probabilities update mid-session.
  const [cityOrder] = useState(() =>
    probabilities
      .filter((p) => p.totalCardsInDeck > 0)
      .sort((a, b) => b.probability - a.probability)
      .map((p) => p.cityId)
  );

  const latestById = new Map(probabilities.map((p) => [p.cityId, p]));

  const grouped = COLOR_ORDER.reduce(
    (acc, color) => {
      const cities = cityOrder
        .map((id) => latestById.get(id))
        .filter((p): p is CityProbability => p !== undefined && p.color === color);
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
            <h2 className="text-lg font-bold">{title}</h2>
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
                {grouped[color].map((city) => {
                  const exhausted = city.totalCardsInDeck === 0;
                  return (
                    <button
                      key={city.cityId}
                      onClick={() => onDraw(city.cityId)}
                      disabled={exhausted}
                      className={`w-full flex items-center justify-between px-4 py-3 min-h-14 border-l-4 ${config.border} ${config.bg} rounded-r-lg mb-1 transition-colors ${
                        exhausted
                          ? "opacity-40 cursor-not-allowed"
                          : "active:brightness-90"
                      }`}
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
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
