"use client";

import { useState } from "react";
import { CampaignConfig, CityColor, CityDefinition } from "../lib/types";
import { COLOR_CONFIG, COLOR_ORDER, DEFAULT_CARDS_PER_CITY } from "../lib/constants";

interface CityConfigModalProps {
  campaignConfig: CampaignConfig;
  onSave: (config: CampaignConfig) => void;
  onClose: () => void;
}

export function CityConfigModal({
  campaignConfig,
  onSave,
  onClose,
}: CityConfigModalProps) {
  const [cities, setCities] = useState<CityDefinition[]>([
    ...campaignConfig.cities,
  ]);
  const [cardsPerCity, setCardsPerCity] = useState<Record<string, number>>({
    ...campaignConfig.cardsPerCity,
  });
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<CityColor>("red");
  const [newCount, setNewCount] = useState(DEFAULT_CARDS_PER_CITY);

  const handleAddCity = () => {
    if (!newName.trim()) return;
    const id = newName.trim().toLowerCase().replace(/\s+/g, "-");
    if (cities.some((c) => c.id === id)) return;

    setCities([...cities, { id, name: newName.trim(), color: newColor }]);
    setCardsPerCity({ ...cardsPerCity, [id]: newCount });
    setNewName("");
    setNewCount(DEFAULT_CARDS_PER_CITY);
  };

  const handleRemoveCity = (id: string) => {
    setCities(cities.filter((c) => c.id !== id));
    const next = { ...cardsPerCity };
    delete next[id];
    setCardsPerCity(next);
  };

  const handleSave = () => {
    onSave({ cities, cardsPerCity });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">City Configuration</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:bg-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 mb-4">
            Changes take effect when you start a new game.
          </p>

          {COLOR_ORDER.map((color) => {
            const colorCities = cities.filter((c) => c.color === color);
            if (colorCities.length === 0) return null;
            const config = COLOR_CONFIG[color];
            return (
              <div key={color} className="mb-4">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wide mb-1 ${config.text}`}
                >
                  {config.label}
                </h3>
                {colorCities.map((city) => (
                  <div
                    key={city.id}
                    className={`flex items-center justify-between px-3 py-2 border-l-4 ${config.border} ${config.bg} rounded-r-lg mb-1`}
                  >
                    <span className={`text-sm font-medium ${config.text}`}>
                      {city.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {cardsPerCity[city.id] ?? DEFAULT_CARDS_PER_CITY} cards
                      </span>
                      <button
                        onClick={() => handleRemoveCity(city.id)}
                        className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 active:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-sm font-semibold mb-3">Add City</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="City name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              />
              <div className="flex gap-3">
                <select
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value as CityColor)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                >
                  {COLOR_ORDER.map((color) => (
                    <option key={color} value={color}>
                      {COLOR_CONFIG[color].label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={newCount}
                  onChange={(e) => setNewCount(Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                />
              </div>
              <button
                onClick={handleAddCity}
                disabled={!newName.trim()}
                className="py-2 rounded-lg bg-green-600 text-white font-medium active:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add City
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 font-medium text-gray-700 active:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-blue-600 font-medium text-white active:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
