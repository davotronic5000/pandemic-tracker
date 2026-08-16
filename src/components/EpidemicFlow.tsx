"use client";

import { useState } from "react";
import { GameState, CityColor } from "../lib/types";
import { getBottomSectionCities } from "../lib/deck";
import { COLOR_CONFIG, COLOR_ORDER } from "../lib/constants";
import { CampaignConfig } from "../lib/types";

interface EpidemicFlowProps {
  gameState: GameState;
  campaignConfig: CampaignConfig;
  onEpidemic: (bottomCardCityId: string, cardsToRemove?: string[]) => void;
  onClose: () => void;
}

export function EpidemicFlow({
  gameState,
  campaignConfig,
  onEpidemic,
  onClose,
}: EpidemicFlowProps) {
  const [step, setStep] = useState<"select" | "review">("select");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [removedIndices, setRemovedIndices] = useState<Set<number>>(
    new Set()
  );

  const bottomCityIds = getBottomSectionCities(gameState);
  const bottomCities = campaignConfig.cities.filter((c) =>
    bottomCityIds.includes(c.id)
  );

  const grouped = COLOR_ORDER.reduce(
    (acc, color) => {
      const cities = bottomCities.filter((c) => c.color === color);
      if (cities.length > 0) acc[color] = cities;
      return acc;
    },
    {} as Record<CityColor, typeof bottomCities>
  );

  const cityLookup = Object.fromEntries(
    campaignConfig.cities.map((c) => [c.id, c])
  );

  const handleSelect = (cityId: string) => {
    setSelectedCity(cityId);
    setRemovedIndices(new Set());
    setStep("review");
  };

  const handleBack = () => {
    setSelectedCity(null);
    setRemovedIndices(new Set());
    setStep("select");
  };

  const toggleRemove = (index: number) => {
    setRemovedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const pileToShuffle = selectedCity
    ? [selectedCity, ...gameState.discardPile]
    : [];

  const handleConfirm = () => {
    if (selectedCity) {
      const cardsToRemove = pileToShuffle.filter((_, i) =>
        removedIndices.has(i)
      );
      onEpidemic(selectedCity, cardsToRemove);
      onClose();
    }
  };

  if (step === "review" && selectedCity) {
    const remainingCount = pileToShuffle.length - removedIndices.size;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col m-4">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">☣</span>
              <h2 className="text-lg font-bold text-red-600">
                Epidemic — Review Discard
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              Remove any cards before shuffling. {remainingCount} card
              {remainingCount !== 1 ? "s" : ""} will be placed on top of the
              infection deck.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {pileToShuffle.map((cityId, index) => {
              const city = cityLookup[cityId];
              if (!city) return null;
              const config = COLOR_CONFIG[city.color];
              const removed = removedIndices.has(index);
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between px-4 py-3 min-h-14 border-l-4 ${config.border} ${
                    removed ? "bg-gray-100" : config.bg
                  } rounded-r-lg mb-1 transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        removed ? "text-gray-400 line-through" : config.text
                      }`}
                    >
                      {city.name}
                    </span>
                    {index === 0 && (
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 border border-gray-300 rounded px-1.5 py-0.5">
                        Bottom card
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleRemove(index)}
                    className={`text-xs px-3 py-1.5 rounded font-medium ${
                      removed
                        ? "bg-gray-200 text-gray-600 active:bg-gray-300"
                        : "bg-white border border-gray-300 text-gray-700 active:bg-gray-100"
                    }`}
                  >
                    {removed ? "Undo" : "Remove"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 p-4 border-t">
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded-xl bg-gray-100 font-medium text-gray-700 active:bg-gray-200"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl bg-red-600 font-medium text-white active:bg-red-700"
            >
              Shuffle Discard Pile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-red-600">
              ☣ Epidemic — Bottom Card
            </h2>
            <p className="text-sm text-gray-500">
              Select the card drawn from the bottom of the infection deck
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
                    key={city.id}
                    onClick={() => handleSelect(city.id)}
                    className={`w-full flex items-center px-4 py-3 min-h-14 border-l-4 ${config.border} ${config.bg} rounded-r-lg mb-1 active:brightness-90 transition-colors`}
                  >
                    <span className={`font-medium ${config.text}`}>
                      {city.name}
                    </span>
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
