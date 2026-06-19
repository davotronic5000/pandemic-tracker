"use client";

import { useState } from "react";
import { CampaignConfig } from "../lib/types";
import { COLOR_CONFIG } from "../lib/constants";

interface RemovedCardsProps {
  removedCards: string[];
  campaignConfig: CampaignConfig;
}

export function RemovedCards({
  removedCards,
  campaignConfig,
}: RemovedCardsProps) {
  const [expanded, setExpanded] = useState(false);

  if (removedCards.length === 0) return null;

  const cityLookup = Object.fromEntries(
    campaignConfig.cities.map((c) => [c.id, c])
  );

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 active:bg-gray-100 rounded-xl"
      >
        <span className="text-sm font-medium text-gray-500">
          Removed ({removedCards.length})
        </span>
        <span className="text-gray-400 text-sm">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-1">
          {removedCards.map((cityId, idx) => {
            const city = cityLookup[cityId];
            if (!city) return null;
            const config = COLOR_CONFIG[city.color];
            return (
              <div
                key={`${cityId}-${idx}`}
                className={`flex items-center px-3 py-2 border-l-4 ${config.border} bg-gray-100 rounded-r-lg opacity-60`}
              >
                <span className={`text-sm ${config.text}`}>{city.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
