import React from 'react';
import { UltimatePlayerCard } from '../components/player/UltimatePlayerCard';

const TestPlayerCard: React.FC = () => {
  return (
    <div>
      <h1>Test Player Card</h1>
      <UltimatePlayerCard
        player={{
          id: 'test',
          name: 'Test Player',
          jerseyNumber: 10,
          age: 25,
          overall: 85,
          nationality: 'England',
          roleId: 'ST',
        } as any}
      />
    </div>
  );
};

export default TestPlayerCard;
