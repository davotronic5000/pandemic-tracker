"use client";

import { useState } from "react";
import { CampaignConfig } from "../lib/types";
import { COLOR_CONFIG } from "../lib/constants";

interface DiscardPileProps {
  discardPile: string[];
  campaignConfig: CampaignConfig;
  onRemoveCard: (cityId: string) => void;
}

export function DiscardPile({
  discardPile,
  campaignConfig,
  onRemoveCard,
}: DiscardPileProps) {
  const [expanded, setExpanded] = useState(false);

  const cityLookup = Object.fromEntries(
    campaignConfig.cities.map((c) => [c.id, c])
  );

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 active:bg-gray-100 rounded-xl"
      >
        <span className="text-sm font-medium text-gray-700">
          Discard Pile ({discardPile.length})
        </span>
        <span className="text-gray-400 text-sm">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-1">
          {discardPile.length === 0 ? (
            <p className="text-sm text-gray-400 py-2 text-center">Empty</p>
          ) : (
            discardPile.map((cityId, idx) => {
              const city = cityLookup[cityId];
              if (!city) return null;
              const config = COLOR_CONFIG[city.color];
              return (
                <div
                  key={`${cityId}-${idx}`}
                  className={`flex items-center justify-between px-3 py-2 border-l-4 ${config.border} ${config.bg} rounded-r-lg`}
                >
                  <span className={`text-sm ${config.text}`}>{city.name}</span>
                  <button
                    onClick={() => onRemoveCard(cityId)}
                    className="text-xs px-2 py-1 rounded bg-gray-300 text-gray-700 active:bg-gray-400"
                    title="Remove from game"
                  >
                    Remove
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
