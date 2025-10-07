import React, { forwardRef, useState } from 'react';
import { cn } from '../../../utils/cn';
import { Card } from '../modern/Card';

export interface Formation {
  id: string;
  name: string;
  description: string;
  formation: string; // e.g., "4-4-2", "4-3-3"
  positions: {
    role: string;
    x: number; // percentage
    y: number; // percentage
  }[];
  strengths: string[];
  weaknesses: string[];
  suitableFor: string[];
  popularity: number; // 1-5 stars
}

export interface FormationSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  formations: Formation[];
  selectedFormation?: string;
  onFormationSelect: (formationId: string) => void;
  mode?: 'grid' | 'list' | 'compact';
  showDetails?: boolean;
  allowCustom?: boolean;
  onCreateCustom?: () => void;
}

const popularFormations: Formation[] = [
  {
    id: '4-4-2',
    name: '4-4-2',
    description: 'Classic balanced formation with two strikers',
    formation: '4-4-2',
    positions: [
      { role: 'GK', x: 10, y: 50 },
      { role: 'CB', x: 25, y: 35 },
      { role: 'CB', x: 25, y: 65 },
      { role: 'LB', x: 25, y: 15 },
      { role: 'RB', x: 25, y: 85 },
      { role: 'CM', x: 50, y: 35 },
      { role: 'CM', x: 50, y: 65 },
      { role: 'LM', x: 50, y: 15 },
      { role: 'RM', x: 50, y: 85 },
      { role: 'ST', x: 75, y: 40 },
      { role: 'ST', x: 75, y: 60 },
    ],
    strengths: ['Balanced attack/defense', 'Easy to understand', 'Good width'],
    weaknesses: ['Can be outnumbered in midfield', 'Less creative freedom'],
    suitableFor: ['Beginner teams', 'Counter-attacking', 'Direct play'],
    popularity: 4,
  },
  {
    id: '4-3-3',
    name: '4-3-3',
    description: 'Modern attacking formation with wingers',
    formation: '4-3-3',
    positions: [
      { role: 'GK', x: 10, y: 50 },
      { role: 'CB', x: 25, y: 35 },
      { role: 'CB', x: 25, y: 65 },
      { role: 'LB', x: 25, y: 15 },
      { role: 'RB', x: 25, y: 85 },
      { role: 'CDM', x: 45, y: 50 },
      { role: 'CM', x: 55, y: 35 },
      { role: 'CM', x: 55, y: 65 },
      { role: 'LW', x: 75, y: 20 },
      { role: 'RW', x: 75, y: 80 },
      { role: 'ST', x: 80, y: 50 },
    ],
    strengths: ['Strong attack', 'Good possession', 'Width in attack'],
    weaknesses: ['Exposed defensively', 'Requires fit fullbacks'],
    suitableFor: ['Attacking teams', 'Possession play', 'Technical players'],
    popularity: 5,
  },
  {
    id: '4-2-3-1',
    name: '4-2-3-1',
    description: 'Flexible formation with attacking midfield',
    formation: '4-2-3-1',
    positions: [
      { role: 'GK', x: 10, y: 50 },
      { role: 'CB', x: 25, y: 35 },
      { role: 'CB', x: 25, y: 65 },
      { role: 'LB', x: 25, y: 15 },
      { role: 'RB', x: 25, y: 85 },
      { role: 'CDM', x: 45, y: 40 },
      { role: 'CDM', x: 45, y: 60 },
      { role: 'CAM', x: 65, y: 35 },
      { role: 'CAM', x: 65, y: 50 },
      { role: 'CAM', x: 65, y: 65 },
      { role: 'ST', x: 80, y: 50 },
    ],
    strengths: ['Defensive stability', 'Creative midfield', 'Versatile'],
    weaknesses: ['Isolated striker', 'Complex positioning'],
    suitableFor: ['Balanced teams', 'Tactical flexibility', 'Creative players'],
    popularity: 5,
  },
  {
    id: '3-5-2',
    name: '3-5-2',
    description: 'Midfield-heavy formation with wing-backs',
    formation: '3-5-2',
    positions: [
      { role: 'GK', x: 10, y: 50 },
      { role: 'CB', x: 25, y: 30 },
      { role: 'CB', x: 25, y: 50 },
      { role: 'CB', x: 25, y: 70 },
      { role: 'LM', x: 50, y: 15 },
      { role: 'RM', x: 50, y: 85 },
      { role: 'CM', x: 50, y: 35 },
      { role: 'CM', x: 50, y: 50 },
      { role: 'CM', x: 50, y: 65 },
      { role: 'ST', x: 75, y: 40 },
      { role: 'ST', x: 75, y: 60 },
    ],
    strengths: ['Midfield dominance', 'Wide play', 'Attacking options'],
    weaknesses: ['Weak against wingers', 'Requires discipline'],
    suitableFor: ['Possession teams', 'Midfield-strong squads', 'Wing-back system'],
    popularity: 3,
  },
];

export const FormationSelector = forwardRef<HTMLDivElement, FormationSelectorProps>(
  (
    {
      className,
      formations = popularFormations,
      selectedFormation,
      onFormationSelect,
      mode = 'grid',
      showDetails = true,
      allowCustom = false,
      onCreateCustom,
      ...props
    },
    ref,
  ) => {
    const [hoveredFormation, setHoveredFormation] = useState<string | null>(null);

    const renderFormationPreview = (formation: Formation, size: 'sm' | 'md' | 'lg' = 'md') => {
      const sizes = {
        sm: { width: 60, height: 40, dot: 3 },
        md: { width: 120, height: 80, dot: 4 },
        lg: { width: 180, height: 120, dot: 5 },
      };

      const { width, height, dot } = sizes[size];

      return (
        <div
          className="relative bg-green-600 rounded border border-white/20"
          style={{ width, height }}
        >
          {/* Field markings */}
          <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${width} ${height}`}>
            <rect
              x="2"
              y="2"
              width={width - 4}
              height={height - 4}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
            />
            <line
              x1={width / 2}
              y1="2"
              x2={width / 2}
              y2={height - 2}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
            />
          </svg>

          {/* Players */}
          {formation.positions.map((pos, index) => (
            <div
              key={index}
              className="absolute w-2 h-2 bg-white rounded-full border border-gray-300 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: dot,
                height: dot,
              }}
            />
          ))}
        </div>
      );
    };

    const renderPopularityStars = (rating: number) => {
      return (
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
            <svg
              key={star}
              className={cn('w-3 h-3', star <= rating ? 'text-yellow-400' : 'text-gray-400')}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      );
    };

    if (mode === 'compact') {
      return (
        <div
          ref={ref}
          className={cn('flex flex-wrap gap-2', className)}
          role="radiogroup"
          aria-label="Formation selection"
          {...props}
        >
          {formations.map(formation => (
            <button
              key={formation.id}
              onClick={() => onFormationSelect(formation.id)}
              role="radio"
              aria-checked={selectedFormation === formation.id}
              aria-label={`${formation.formation} formation: ${formation.description}`}
              className={cn(
                'px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200',
                'hover:scale-105 hover:shadow-md',
                selectedFormation === formation.id
                  ? 'bg-primary-600 border-primary-500 text-white'
                  : 'bg-secondary-700 border-secondary-600 text-secondary-300 hover:bg-secondary-600',
              )}
            >
              {formation.formation}
            </button>
          ))}
          {allowCustom && (
            <button
              onClick={onCreateCustom}
              aria-label="Create custom formation"
              className="px-3 py-2 rounded-lg border border-dashed border-secondary-600 text-sm font-medium text-secondary-400 hover:text-white hover:border-secondary-500 transition-colors"
            >
              + Custom
            </button>
          )}
        </div>
      );
    }

    if (mode === 'list') {
      return (
        <div
          ref={ref}
          className={cn('space-y-3', className)}
          role="radiogroup"
          aria-label="Formation selection"
          {...props}
        >
          {formations.map(formation => (
            <Card
              key={formation.id}
              variant={selectedFormation === formation.id ? 'elevated' : 'interactive'}
              className={cn(
                'cursor-pointer transition-all duration-200',
                selectedFormation === formation.id && 'ring-2 ring-primary-500/50',
              )}
              onClick={() => onFormationSelect(formation.id)}
              role="radio"
              aria-checked={selectedFormation === formation.id}
              aria-label={`${formation.name} formation`}
              aria-describedby={`formation-${formation.id}-details`}
              tabIndex={0}
            >
              <div className="p-4">
                <div className="flex items-center space-x-4">
                  {/* Formation preview */}
                  <div className="flex-shrink-0">{renderFormationPreview(formation, 'sm')}</div>

                  {/* Formation details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-white">{formation.name}</h3>
                      {renderPopularityStars(formation.popularity)}
                    </div>
                    <p className="text-sm text-secondary-400 mb-2">{formation.description}</p>

                    {/* Hidden details for screen readers */}
                    <div id={`formation-${formation.id}-details`} className="sr-only">
                      {formation.description}. Popularity: {formation.popularity} out of 5 stars.
                      Strengths: {formation.strengths.join(', ')}. Weaknesses:{' '}
                      {formation.weaknesses.join(', ')}. Suitable for:{' '}
                      {formation.suitableFor.join(', ')}.
                    </div>

                    {showDetails && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="font-medium text-success-400">Strengths:</span>
                          <ul className="text-secondary-400 mt-1">
                            {formation.strengths.slice(0, 2).map((strength, i) => (
                              <li key={i}>• {strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium text-warning-400">Weaknesses:</span>
                          <ul className="text-secondary-400 mt-1">
                            {formation.weaknesses.slice(0, 2).map((weakness, i) => (
                              <li key={i}>• {weakness}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium text-primary-400">Suitable for:</span>
                          <ul className="text-secondary-400 mt-1">
                            {formation.suitableFor.slice(0, 2).map((suitable, i) => (
                              <li key={i}>• {suitable}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {allowCustom && (
            <Card
              variant="interactive"
              className="cursor-pointer border-dashed border-secondary-600"
              onClick={onCreateCustom}
            >
              <div className="p-4 text-center">
                <div className="text-secondary-400 mb-2">
                  <svg
                    className="w-8 h-8 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white">Create Custom Formation</h3>
                <p className="text-sm text-secondary-400">Design your own tactical setup</p>
              </div>
            </Card>
          )}
        </div>
      );
    }

    // Grid mode (default)
    return (
      <div
        ref={ref}
        className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}
        role="radiogroup"
        aria-label="Formation selection"
        {...props}
      >
        {formations.map(formation => (
          <Card
            key={formation.id}
            variant={selectedFormation === formation.id ? 'elevated' : 'interactive'}
            className={cn(
              'cursor-pointer transition-all duration-200 group',
              selectedFormation === formation.id && 'ring-2 ring-primary-500/50',
              'hover:scale-105',
            )}
            onClick={() => onFormationSelect(formation.id)}
            onMouseEnter={() => setHoveredFormation(formation.id)}
            onMouseLeave={() => setHoveredFormation(null)}
            role="radio"
            aria-checked={selectedFormation === formation.id}
            aria-label={`${formation.name} formation`}
            aria-describedby={`formation-${formation.id}-grid-details`}
            tabIndex={0}
          >
            <div className="p-4">
              {/* Formation header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-white">{formation.name}</h3>
                {renderPopularityStars(formation.popularity)}
              </div>

              {/* Formation preview */}
              <div className="flex justify-center mb-3">
                {renderFormationPreview(formation, 'md')}
              </div>

              {/* Formation description */}
              <p className="text-sm text-secondary-400 mb-3 text-center">{formation.description}</p>

              {/* Hidden details for screen readers */}
              <div id={`formation-${formation.id}-grid-details`} className="sr-only">
                {formation.description}. Popularity: {formation.popularity} out of 5 stars.
                Strengths: {formation.strengths.join(', ')}. Weaknesses:{' '}
                {formation.weaknesses.join(', ')}. Suitable for: {formation.suitableFor.join(', ')}.
              </div>

              {/* Formation details */}
              {showDetails &&
                (hoveredFormation === formation.id || selectedFormation === formation.id) && (
                  <div className="space-y-2 text-xs animate-fade-in">
                    <div>
                      <span className="font-medium text-success-400">Strengths:</span>
                      <div className="text-secondary-400 mt-1">
                        {formation.strengths.join(', ')}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-warning-400">Weaknesses:</span>
                      <div className="text-secondary-400 mt-1">
                        {formation.weaknesses.join(', ')}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-primary-400">Best for:</span>
                      <div className="text-secondary-400 mt-1">
                        {formation.suitableFor.join(', ')}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </Card>
        ))}

        {/* Custom formation option */}
        {allowCustom && (
          <Card
            variant="interactive"
            className="cursor-pointer border-dashed border-secondary-600 hover:scale-105"
            onClick={onCreateCustom}
          >
            <div className="p-4 h-full flex flex-col items-center justify-center text-center">
              <div className="text-secondary-400 mb-3">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Create Custom</h3>
              <p className="text-sm text-secondary-400">Design your own formation</p>
            </div>
          </Card>
        )}
      </div>
    );
  },
);

FormationSelector.displayName = 'FormationSelector';
