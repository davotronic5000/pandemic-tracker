"use client";

import { useState } from "react";
import { GameState, CityColor } from "../lib/types";
import { getBottomSectionCities } from "../lib/deck";
import { COLOR_CONFIG, COLOR_ORDER } from "../lib/constants";
import { CampaignConfig } from "../lib/types";

interface EpidemicFlowProps {
  gameState: GameState;
  campaignConfig: CampaignConfig;
  onEpidemic: (bottomCardCityId: string) => void;
  onClose: () => void;
}

export function EpidemicFlow({
  gameState,
  campaignConfig,
  onEpidemic,
  onClose,
}: EpidemicFlowProps) {
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

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

  const handleSelect = (cityId: string) => {
    setSelectedCity(cityId);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (selectedCity) {
      onEpidemic(selectedCity);
      onClose();
    }
  };

  if (step === "confirm" && selectedCity) {
    const city = campaignConfig.cities.find((c) => c.id === selectedCity);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl w-full max-w-md m-4 p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">☣</div>
            <h2 className="text-xl font-bold text-red-600">Epidemic!</h2>
            <p className="text-gray-600 mt-2">
              Bottom card: <strong>{city?.name}</strong>
            </p>
            <p className="text-gray-500 text-sm mt-2">
              The discard pile ({gameState.discardPile.length + 1} cards) will be
              shuffled and placed on top of the infection deck.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("select")}
              className="flex-1 py-3 rounded-xl bg-gray-100 font-medium text-gray-700 active:bg-gray-200"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl bg-red-600 font-medium text-white active:bg-red-700"
            >
              Confirm
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
