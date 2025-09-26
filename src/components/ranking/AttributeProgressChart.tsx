// Attribute Progress Chart Component
import React from 'react';
import type { PlayerAttributes } from '../../types/player';

interface AttributeProgressChartProps {
  baseAttributes: PlayerAttributes;
  earnedAttributes: Partial<PlayerAttributes>;
  onSpendPoints?: (attribute: keyof PlayerAttributes, points: number) => void;
  availablePoints?: number;
}

const AttributeProgressChart: React.FC<AttributeProgressChartProps> = ({
  baseAttributes,
  earnedAttributes,
  onSpendPoints,
  availablePoints = 0,
}) => {
  return (
    <div className="space-y-4">
      {Object.entries(baseAttributes).map(([key, baseValue]) => {
        const earnedValue = earnedAttributes[key as keyof PlayerAttributes] || 0;
        const totalValue = baseValue + earnedValue;
        const percentage = (totalValue / 100) * 100;

        return (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-300 capitalize">{key}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {baseValue} <span className="text-green-400">+{earnedValue}</span> = {totalValue}
                </span>
                {onSpendPoints && availablePoints > 0 && (
                  <button
                    onClick={() => onSpendPoints(key as keyof PlayerAttributes, 1)}
                    className="px-2 py-0.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    +1
                  </button>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="relative h-2 rounded-full overflow-hidden">
                <div
                  className="absolute h-2 bg-gray-500 rounded-full"
                  style={{ width: `${(baseValue / 100) * 100}%` }}
                />
                <div
                  className="absolute h-2 bg-green-500 rounded-full"
                  style={{
                    left: `${(baseValue / 100) * 100}%`,
                    width: `${(earnedValue / 100) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AttributeProgressChart;
