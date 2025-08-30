import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { usePersonalization } from '../components/ui/PersonalizationSystem';
import { 
  EnhancedButton, 
  EnhancedCard, 
  EnhancedInput, 
  EnhancedSwitch 
} from '../components/ui/InteractiveComponents';
import {
  EnhancedLineChart,
  EnhancedBarChart,
  EnhancedDoughnutChart,
  EnhancedRadarChart
} from '../components/charts/EnhancedCharts';
import {
  SwipeArea,
  Draggable,
  SortableList
} from '../components/ui/GestureSystem';
import {
  ThemeCustomizer,
  LayoutPreferences,
  AccessibilityPreferences,
  PreferencesBackup
} from '../components/ui/PersonalizationSystem';
import { AnimatedContainer, LoadingAnimation, SuccessAnimation } from '../components/ui/AnimationSystem';

const UIDemoPage: React.FC = () => {
  const { theme, tokens } = useTheme();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [demoStates, setDemoStates] = useState({
    switch1: false,
    switch2: true,
    loading: false,
    success: false,
    inputValue: '',
    error: ''
  });

  // Demo data for charts
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Goals Scored',
        data: [12, 19, 3, 5, 2, 3],
        color: theme.colors.accent.primary,
        gradient: true
      },
      {
        label: 'Goals Conceded',
        data: [2, 3, 20, 5, 1, 4],
        color: theme.colors.status.error,
        gradient: true
      }
    ]
  };

  const barChartData = {
    labels: ['Midfielder', 'Defender', 'Forward', 'Goalkeeper'],
    datasets: [
      {
        label: 'Player Count',
        data: [8, 6, 4, 2],
        color: theme.colors.status.success,
        gradient: true
      }
    ]
  };

  const doughnutData = {
    labels: ['Wins', 'Draws', 'Losses'],
    values: [15, 8, 5]
  };

  const radarData = {
    labels: ['Attack', 'Defense', 'Speed', 'Stamina', 'Skill', 'Teamwork'],
    datasets: [
      {
        label: 'Team Stats',
        data: [85, 78, 92, 80, 88, 90],
        color: theme.colors.accent.primary
      }
    ]
  };

  const [sortableItems, setSortableItems] = useState([
    { id: '1', content: <div className="p-3">🥇 First Place Team</div> },
    { id: '2', content: <div className="p-3">🥈 Second Place Team</div> },
    { id: '3', content: <div className="p-3">🥉 Third Place Team</div> },
    { id: '4', content: <div className="p-3">⚽ Fourth Place Team</div> }
  ]);

  const handleSwipe = (event: any) => {
    console.log('Swipe detected:', event);
  };

  const handleDrag = (event: any) => {
    console.log('Drag detected:', event);
  };

  const simulateLoading = () => {
    setDemoStates(prev => ({ ...prev, loading: true, success: false }));
    setTimeout(() => {
      setDemoStates(prev => ({ ...prev, loading: false, success: true }));
      setTimeout(() => {
        setDemoStates(prev => ({ ...prev, success: false }));
      }, 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen p-6 space-y-8" style={{ backgroundColor: theme.colors.background.primary }}>
      {/* Header */}
      <AnimatedContainer variant="fade">
        <div className="text-center mb-12">
          <h1 
            className="text-4xl font-bold mb-4 gradient-text"
            style={{ 
              background: theme.gradients.primary,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            🎨 Enhanced UI Showcase
          </h1>
          <p className="text-lg" style={{ color: theme.colors.text.secondary }}>
            Explore the enhanced UI/UX features of Astral Turf Soccer Management
          </p>
        </div>
      </AnimatedContainer>

      {/* Theme & Personalization Controls */}
      <AnimatedContainer variant="slide" className="mb-8">
        <EnhancedCard padding="lg">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: theme.colors.text.primary }}>
            🎛️ Personalization Controls
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <EnhancedButton 
              variant="primary" 
              onClick={() => setActiveModal('theme')}
              fullWidth
            >
              🎨 Theme Customizer
            </EnhancedButton>
            <EnhancedButton 
              variant="secondary" 
              onClick={() => setActiveModal('layout')}
              fullWidth
            >
              📐 Layout Preferences
            </EnhancedButton>
            <EnhancedButton 
              variant="tertiary" 
              onClick={() => setActiveModal('accessibility')}
              fullWidth
            >
              ♿ Accessibility
            </EnhancedButton>
            <EnhancedButton 
              variant="ghost" 
              onClick={() => setActiveModal('backup')}
              fullWidth
            >
              💾 Backup & Restore
            </EnhancedButton>
          </div>
        </EnhancedCard>
      </AnimatedContainer>

      {/* Interactive Components */}
      <AnimatedContainer variant="spring" className="mb-8">
        <EnhancedCard padding="lg">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: theme.colors.text.primary }}>
            🔘 Interactive Components
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: theme.colors.text.primary }}>Buttons</h3>
              <div className="space-y-3">
                <EnhancedButton variant="primary" fullWidth>Primary Button</EnhancedButton>
                <EnhancedButton variant="secondary" fullWidth>Secondary Button</EnhancedButton>
                <EnhancedButton variant="tertiary" fullWidth>Tertiary Button</EnhancedButton>
                <EnhancedButton variant="ghost" fullWidth>Ghost Button</EnhancedButton>
                <EnhancedButton variant="danger" fullWidth>Danger Button</EnhancedButton>
                <EnhancedButton 
                  variant="primary" 
                  loading={demoStates.loading} 
                  onClick={simulateLoading}
                  fullWidth
                >
                  {demoStates.loading ? 'Loading...' : 'Simulate Loading'}
                </EnhancedButton>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: theme.colors.text.primary }}>Inputs</h3>
              <div className="space-y-3">
                <EnhancedInput
                  label="Player Name"
                  placeholder="Enter player name..."
                  value={demoStates.inputValue}
                  onChange={(e) => setDemoStates(prev => ({ ...prev, inputValue: e.target.value }))}
                />
                <EnhancedInput
                  label="Email Address"
                  type="email"
                  placeholder="player@example.com"
                  error={demoStates.error}
                />
                <EnhancedInput
                  label="Password"
                  type="password"
                  placeholder="Enter password..."
                />
                <EnhancedInput
                  label="Team Formation"
                  placeholder="4-4-2"
                  help="Enter your preferred formation"
                />
              </div>
            </div>

            {/* Switches */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: theme.colors.text.primary }}>Switches</h3>
              <div className="space-y-3">
                <EnhancedSwitch
                  checked={demoStates.switch1}
                  onChange={(checked) => setDemoStates(prev => ({ ...prev, switch1: checked }))}
                  label="Enable Notifications"
                />
                <EnhancedSwitch
                  checked={demoStates.switch2}
                  onChange={(checked) => setDemoStates(prev => ({ ...prev, switch2: checked }))}
                  label="Auto-save Changes"
                  color="success"
                />
                <EnhancedSwitch
                  checked={false}
                  onChange={() => {}}
                  label="Disabled Switch"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Animation States */}
          <div className="mt-8 flex items-center justify-center space-x-8">
            <div className="text-center">
              <LoadingAnimation type="spinner" size="lg" />
              <p className="mt-2 text-sm" style={{ color: theme.colors.text.secondary }}>Spinner</p>
            </div>
            <div className="text-center">
              <LoadingAnimation type="dots" size="lg" />
              <p className="mt-2 text-sm" style={{ color: theme.colors.text.secondary }}>Dots</p>
            </div>
            <div className="text-center">
              <LoadingAnimation type="pulse" size="lg" />
              <p className="mt-2 text-sm" style={{ color: theme.colors.text.secondary }}>Pulse</p>
            </div>
            {demoStates.success && (
              <div className="text-center">
                <SuccessAnimation size="lg" />
                <p className="mt-2 text-sm" style={{ color: theme.colors.status.success }}>Success!</p>
              </div>
            )}
          </div>
        </EnhancedCard>
      </AnimatedContainer>

      {/* Data Visualization */}
      <AnimatedContainer variant="scale" className="mb-8">
        <EnhancedCard padding="lg">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: theme.colors.text.primary }}>
            📊 Data Visualization
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnhancedLineChart
              data={lineChartData}
              title="Goals This Season"
              subtitle="Team performance over time"
              height={300}
              showPoints
              smooth
            />
            
            <EnhancedBarChart
              data={barChartData}
              title="Squad Composition"
              subtitle="Players by position"
              height={300}
            />
            
            <EnhancedDoughnutChart
              data={doughnutData}
              title="Season Results"
              subtitle="Match outcomes"
              height={300}
              showPercentage
            />
            
            <EnhancedRadarChart
              data={radarData}
              title="Team Attributes"
              subtitle="Overall team performance"
              height={300}
              scale={{ min: 0, max: 100 }}
            />
          </div>
        </EnhancedCard>
      </AnimatedContainer>

      {/* Gesture Interactions */}
      <AnimatedContainer variant="fade" className="mb-8">
        <EnhancedCard padding="lg">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: theme.colors.text.primary }}>
            👆 Gesture Interactions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Swipe Area */}
            <div>
              <h3 className="text-lg font-medium mb-3" style={{ color: theme.colors.text.primary }}>
                Swipe Area
              </h3>
              <SwipeArea
                config={{ onSwipe: handleSwipe, threshold: 50 }}
                className="p-6 border-2 border-dashed rounded-lg text-center"
                style={{ 
                  borderColor: theme.colors.border.primary,
                  backgroundColor: theme.colors.background.secondary
                }}
              >
                <p style={{ color: theme.colors.text.secondary }}>
                  👆 Swipe in any direction
                </p>
              </SwipeArea>
            </div>

            {/* Draggable */}
            <div>
              <h3 className="text-lg font-medium mb-3" style={{ color: theme.colors.text.primary }}>
                Draggable Element
              </h3>
              <div 
                className="relative h-32 border-2 border-dashed rounded-lg"
                style={{ borderColor: theme.colors.border.primary }}
              >
                <Draggable
                  config={{ onDrag: handleDrag }}
                  className="absolute top-4 left-4"
                >
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl cursor-grab"
                    style={{ backgroundColor: theme.colors.accent.primary }}
                  >
                    ⚽
                  </div>
                </Draggable>
              </div>
            </div>

            {/* Sortable List */}
            <div>
              <h3 className="text-lg font-medium mb-3" style={{ color: theme.colors.text.primary }}>
                Sortable List
              </h3>
              <SortableList
                items={sortableItems}
                onReorder={setSortableItems}
              />
            </div>
          </div>
        </EnhancedCard>
      </AnimatedContainer>

      {/* Card Variants */}
      <AnimatedContainer variant="spring" className="mb-8">
        <EnhancedCard padding="lg">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: theme.colors.text.primary }}>
            🎴 Card Variants
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <EnhancedCard variant="default" padding="md">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>
                Default Card
              </h3>
              <p style={{ color: theme.colors.text.secondary }}>
                Standard card with subtle shadow
              </p>
            </EnhancedCard>

            <EnhancedCard variant="elevated" padding="md">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>
                Elevated Card
              </h3>
              <p style={{ color: theme.colors.text.secondary }}>
                Card with prominent shadow
              </p>
            </EnhancedCard>

            <EnhancedCard variant="outlined" padding="md">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>
                Outlined Card
              </h3>
              <p style={{ color: theme.colors.text.secondary }}>
                Card with border only
              </p>
            </EnhancedCard>

            <EnhancedCard variant="glass" padding="md">
              <h3 className="font-semibold mb-2" style={{ color: theme.colors.text.primary }}>
                Glass Card
              </h3>
              <p style={{ color: theme.colors.text.secondary }}>
                Card with glass morphism effect
              </p>
            </EnhancedCard>
          </div>
        </EnhancedCard>
      </AnimatedContainer>

      {/* Interactive Cards */}
      <AnimatedContainer variant="fade">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EnhancedCard 
            interactive 
            padding="lg"
            onClick={() => alert('Player card clicked!')}
          >
            <div className="text-center">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: theme.colors.accent.primary }}
              >
                👤
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text.primary }}>
                Player Profile
              </h3>
              <p style={{ color: theme.colors.text.secondary }}>
                Click to view player details
              </p>
            </div>
          </EnhancedCard>

          <EnhancedCard 
            interactive 
            padding="lg"
            onClick={() => alert('Match card clicked!')}
          >
            <div className="text-center">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: theme.colors.status.success }}
              >
                ⚽
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text.primary }}>
                Match Results
              </h3>
              <p style={{ color: theme.colors.text.secondary }}>
                View recent match statistics
              </p>
            </div>
          </EnhancedCard>

          <EnhancedCard 
            interactive 
            padding="lg"
            onClick={() => alert('Training card clicked!')}
          >
            <div className="text-center">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: theme.colors.status.warning }}
              >
                🏃
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.text.primary }}>
                Training Sessions
              </h3>
              <p style={{ color: theme.colors.text.secondary }}>
                Manage team training
              </p>
            </div>
          </EnhancedCard>
        </div>
      </AnimatedContainer>

      {/* Personalization Modals */}
      <ThemeCustomizer 
        isOpen={activeModal === 'theme'} 
        onClose={() => setActiveModal(null)} 
      />
      <LayoutPreferences 
        isOpen={activeModal === 'layout'} 
        onClose={() => setActiveModal(null)} 
      />
      <AccessibilityPreferences 
        isOpen={activeModal === 'accessibility'} 
        onClose={() => setActiveModal(null)} 
      />
      <PreferencesBackup 
        isOpen={activeModal === 'backup'} 
        onClose={() => setActiveModal(null)} 
      />
    </div>
  );
};

export default UIDemoPage;