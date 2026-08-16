"use client";

import { CityProbability, CityColor } from "../lib/types";
import { COLOR_CONFIG, COLOR_ORDER } from "../lib/constants";
import { CityRow } from "./CityRow";

interface CityListProps {
  probabilities: CityProbability[];
}

export function CityList({ probabilities }: CityListProps) {
  const sectionCount = probabilities.reduce(
    (max, p) =>
      p.cardsBySection.reduce(
        (m, s) => Math.max(m, s.sectionIndex + 1),
        max
      ),
    0
  );

  // Cities keep the order from the campaign configuration (not sorted by
  // probability) so rows don't reshuffle as probabilities update mid-game.
  const grouped = COLOR_ORDER.reduce(
    (acc, color) => {
      const cities = probabilities.filter((p) => p.color === color);
      if (cities.length > 0) acc[color] = cities;
      return acc;
    },
    {} as Record<CityColor, CityProbability[]>
  );

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      {COLOR_ORDER.filter((c) => grouped[c]).map((color) => {
        const config = COLOR_CONFIG[color];
        const cities = grouped[color];
        const totalCards = (cities[0]?.totalCardsInDeck ?? 0) > 0
          ? cities.reduce((sum, c) => {
              const perCity = (c.totalCardsInDeck + c.cardsInDiscard + c.cardsRemoved);
              return Math.max(sum, perCity);
            }, 0)
          : 3;

        return (
          <div key={color}>
            <h3
              className={`text-sm font-semibold uppercase tracking-wide mb-2 ${config.text}`}
            >
              {config.label}
            </h3>
            <div className="flex flex-col">
              {cities.map((city) => (
                <CityRow
                  key={city.cityId}
                  city={city}
                  totalCards={totalCards}
                  sectionCount={sectionCount}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
