/**
 * Component Documentation System
 *
 * Provides comprehensive documentation for all React components,
 * including props, usage examples, and interactive playground.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Code,
  Play,
  Copy,
  ExternalLink,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Tag,
  Palette,
  Settings,
  Zap,
  Users,
  Layout,
  Globe,
  Shield,
  Database,
  Activity,
} from 'lucide-react';
import { Button } from '../ui/modern/Button';
import { Input } from '../ui/modern/Input';
import { Card } from '../ui/modern/Card';
import { Badge } from '../ui/modern/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// Documentation Types
interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description: string;
  examples?: any[];
}

interface ComponentExample {
  title: string;
  description: string;
  code: string;
  preview?: React.ReactNode;
  editable?: boolean;
}

interface ComponentDocumentation {
  name: string;
  description: string;
  category:
    | 'ui'
    | 'layout'
    | 'form'
    | 'data'
    | 'navigation'
    | 'feedback'
    | 'overlay'
    | 'tactical'
    | 'analytics';
  importPath: string;
  props: ComponentProp[];
  examples: ComponentExample[];
  relatedComponents: string[];
  version: string;
  lastUpdated: string;
  accessibility: {
    keyboard: boolean;
    screenReader: boolean;
    focusManagement: boolean;
    colorContrast: boolean;
  };
  performance: {
    renderingStrategy: string;
    memoryFootprint: 'low' | 'medium' | 'high';
    lazyLoadable: boolean;
  };
}

// Sample Component Documentation Data
const COMPONENT_DOCS: ComponentDocumentation[] = [
  {
    name: 'UnifiedTacticsBoard',
    description:
      'The main tactical board component for creating and editing football formations. Supports drag-and-drop player positioning, real-time chemistry visualization, and AI-powered analysis.',
    category: 'tactical',
    importPath: "import { UnifiedTacticsBoard } from '@/components/tactics/UnifiedTacticsBoard';",
    props: [
      {
        name: 'players',
        type: 'Player[]',
        required: true,
        description: 'Array of player objects to display on the tactical board',
        examples: [
          [
            { id: '1', name: 'Lionel Messi', position: 'RW', team: 'home' },
            { id: '2', name: 'Robert Lewandowski', position: 'ST', team: 'home' },
          ],
        ],
      },
      {
        name: 'formation',
        type: 'Formation',
        required: true,
        description: 'Formation configuration defining player positions and tactical setup',
        examples: [
          {
            id: 'formation-433',
            name: '4-3-3 Attacking',
            positions: [
              { id: 'gk', x: 50, y: 10, position: 'GK' },
              { id: 'lb', x: 20, y: 25, position: 'LB' },
            ],
          },
        ],
      },
      {
        name: 'onPlayerMove',
        type: '(playerId: string, position: { x: number; y: number }) => void',
        required: false,
        description: 'Callback fired when a player is moved to a new position',
        examples: ['(playerId, position) => console.log(`Player ${playerId} moved to`, position)'],
      },
      {
        name: 'showChemistry',
        type: 'boolean',
        required: false,
        defaultValue: false,
        description: 'Whether to display player chemistry connections',
        examples: [true, false],
      },
      {
        name: 'aiAnalysisEnabled',
        type: 'boolean',
        required: false,
        defaultValue: true,
        description: 'Enable real-time AI tactical analysis',
        examples: [true, false],
      },
      {
        name: 'readOnly',
        type: 'boolean',
        required: false,
        defaultValue: false,
        description: 'Disable player movement and editing when true',
        examples: [false, true],
      },
    ],
    examples: [
      {
        title: 'Basic Tactical Board',
        description: 'Simple tactical board with a 4-3-3 formation and basic player setup',
        code: `import { UnifiedTacticsBoard } from '@/components/tactics/UnifiedTacticsBoard';
import { useState } from 'react';

const BasicExample = () => {
  const [players, setPlayers] = useState([
    { id: '1', name: 'Manuel Neuer', position: 'GK', team: 'home' },
    { id: '2', name: 'Virgil van Dijk', position: 'CB', team: 'home' },
    { id: '3', name: 'Kevin De Bruyne', position: 'CM', team: 'home' },
    { id: '4', name: 'Kylian Mbappé', position: 'ST', team: 'home' }
  ]);

  const formation = {
    id: 'basic-433',
    name: '4-3-3 Basic',
    positions: [
      { id: 'gk', x: 50, y: 10, position: 'GK' },
      { id: 'cb1', x: 35, y: 25, position: 'CB' },
      { id: 'cb2', x: 65, y: 25, position: 'CB' },
      { id: 'cm', x: 50, y: 50, position: 'CM' },
      { id: 'st', x: 50, y: 80, position: 'ST' }
    ]
  };

  const handlePlayerMove = (playerId, position) => {
    console.log(\`Player \${playerId} moved to\`, position);
  };

  return (
    <UnifiedTacticsBoard
      players={players}
      formation={formation}
      onPlayerMove={handlePlayerMove}
      showChemistry={false}
      aiAnalysisEnabled={true}
    />
  );
};

export default BasicExample;`,
        editable: true,
      },
      {
        title: 'Advanced with Chemistry',
        description: 'Tactical board with chemistry visualization and AI analysis enabled',
        code: `import { UnifiedTacticsBoard } from '@/components/tactics/UnifiedTacticsBoard';
import { useState, useCallback } from 'react';

const AdvancedExample = () => {
  const [players, setPlayers] = useState([
    { 
      id: '1', 
      name: 'Lionel Messi', 
      position: 'RW', 
      team: 'home',
      attributes: { pace: 85, shooting: 95, passing: 92 },
      chemistry: { '2': 85, '3': 78 }
    },
    { 
      id: '2', 
      name: 'Luis Suárez', 
      position: 'ST', 
      team: 'home',
      attributes: { pace: 77, shooting: 93, passing: 83 },
      chemistry: { '1': 85, '3': 82 }
    },
    { 
      id: '3', 
      name: 'Neymar Jr', 
      position: 'LW', 
      team: 'home',
      attributes: { pace: 91, shooting: 85, passing: 86 },
      chemistry: { '1': 78, '2': 82 }
    }
  ]);

  const formation = {
    id: 'advanced-433',
    name: '4-3-3 False 9',
    positions: [
      { id: 'lw', x: 25, y: 75, position: 'LW' },
      { id: 'st', x: 50, y: 80, position: 'ST' },
      { id: 'rw', x: 75, y: 75, position: 'RW' }
    ]
  };

  const handlePlayerMove = useCallback((playerId, position) => {
    setPlayers(prev => 
      prev.map(player => 
        player.id === playerId 
          ? { ...player, currentPosition: position }
          : player
      )
    );
  }, []);

  return (
    <div className="w-full h-96">
      <UnifiedTacticsBoard
        players={players}
        formation={formation}
        onPlayerMove={handlePlayerMove}
        showChemistry={true}
        aiAnalysisEnabled={true}
        readOnly={false}
      />
    </div>
  );
};

export default AdvancedExample;`,
        editable: true,
      },
      {
        title: 'Read-Only Display',
        description: 'Non-interactive tactical board for displaying formations',
        code: `import { UnifiedTacticsBoard } from '@/components/tactics/UnifiedTacticsBoard';

const ReadOnlyExample = () => {
  const players = [
    { id: '1', name: 'Alisson', position: 'GK', team: 'home' },
    { id: '2', name: 'Mohamed Salah', position: 'RW', team: 'home' },
    { id: '3', name: 'Sadio Mané', position: 'LW', team: 'home' },
    { id: '4', name: 'Roberto Firmino', position: 'ST', team: 'home' }
  ];

  const formation = {
    id: 'liverpool-433',
    name: 'Liverpool 4-3-3',
    positions: [
      { id: 'gk', x: 50, y: 10, position: 'GK' },
      { id: 'lw', x: 25, y: 75, position: 'LW' },
      { id: 'st', x: 50, y: 80, position: 'ST' },
      { id: 'rw', x: 75, y: 75, position: 'RW' }
    ]
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Formation Preview</h3>
      <UnifiedTacticsBoard
        players={players}
        formation={formation}
        readOnly={true}
        showChemistry={false}
        aiAnalysisEnabled={false}
      />
    </div>
  );
};

export default ReadOnlyExample;`,
      },
    ],
    relatedComponents: [
      'PlayerToken',
      'ModernField',
      'ChemistryVisualization',
      'AITacticalIntelligence',
    ],
    version: '2.1.0',
    lastUpdated: '2024-01-15',
    accessibility: {
      keyboard: true,
      screenReader: true,
      focusManagement: true,
      colorContrast: true,
    },
    performance: {
      renderingStrategy: 'Virtual scrolling with RAF optimization',
      memoryFootprint: 'medium',
      lazyLoadable: true,
    },
  },
  {
    name: 'Button',
    description:
      'Versatile button component with multiple variants, sizes, and states. Supports icons, loading states, and full accessibility.',
    category: 'ui',
    importPath: "import { Button } from '@/components/ui/modern/Button';",
    props: [
      {
        name: 'variant',
        type: "'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'",
        required: false,
        defaultValue: 'default',
        description: 'Visual style variant of the button',
        examples: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      },
      {
        name: 'size',
        type: "'default' | 'sm' | 'lg' | 'icon'",
        required: false,
        defaultValue: 'default',
        description: 'Size of the button',
        examples: ['default', 'sm', 'lg', 'icon'],
      },
      {
        name: 'disabled',
        type: 'boolean',
        required: false,
        defaultValue: false,
        description: 'Whether the button is disabled',
        examples: [false, true],
      },
      {
        name: 'loading',
        type: 'boolean',
        required: false,
        defaultValue: false,
        description: 'Show loading spinner and disable interaction',
        examples: [false, true],
      },
      {
        name: 'children',
        type: 'React.ReactNode',
        required: true,
        description: 'Button content (text, icons, etc.)',
        examples: ['Click me', 'Save Formation', '<Icon />'],
      },
    ],
    examples: [
      {
        title: 'Button Variants',
        description: 'Different visual styles for various use cases',
        code: `import { Button } from '@/components/ui/modern/Button';

const VariantExample = () => (
  <div className="space-x-2">
    <Button variant="default">Default</Button>
    <Button variant="destructive">Delete</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
  </div>
);`,
        editable: true,
      },
      {
        title: 'Button Sizes',
        description: 'Different sizes for various contexts',
        code: `import { Button } from '@/components/ui/modern/Button';

const SizeExample = () => (
  <div className="space-x-2 flex items-center">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
  </div>
);`,
        editable: true,
      },
      {
        title: 'Button States',
        description: 'Loading and disabled states',
        code: `import { Button } from '@/components/ui/modern/Button';
import { useState } from 'react';

const StateExample = () => {
  const [loading, setLoading] = useState(false);
  
  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="space-x-2">
      <Button disabled>Disabled</Button>
      <Button loading={loading} onClick={handleClick}>
        {loading ? 'Saving...' : 'Save Formation'}
      </Button>
    </div>
  );
};`,
        editable: true,
      },
    ],
    relatedComponents: ['Input', 'Card', 'Dialog'],
    version: '1.0.0',
    lastUpdated: '2024-01-10',
    accessibility: {
      keyboard: true,
      screenReader: true,
      focusManagement: true,
      colorContrast: true,
    },
    performance: {
      renderingStrategy: 'Optimized with React.memo',
      memoryFootprint: 'low',
      lazyLoadable: false,
    },
  },
];

// Categories for filtering
const CATEGORIES = [
  { id: 'ui', name: 'UI Components', icon: Palette, count: 15 },
  { id: 'layout', name: 'Layout', icon: Layout, count: 8 },
  { id: 'form', name: 'Form Controls', icon: Settings, count: 12 },
  { id: 'data', name: 'Data Display', icon: Database, count: 6 },
  { id: 'navigation', name: 'Navigation', icon: Globe, count: 5 },
  { id: 'feedback', name: 'Feedback', icon: Activity, count: 7 },
  { id: 'overlay', name: 'Overlay', icon: Shield, count: 4 },
  { id: 'tactical', name: 'Tactical', icon: Zap, count: 10 },
  { id: 'analytics', name: 'Analytics', icon: Users, count: 8 },
];

// Main Component Documentation Component
export const ComponentDocumentation: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<ComponentDocumentation | null>(null);

  // Filter components based on search and category
  const filteredComponents = useMemo(() => {
    return COMPONENT_DOCS.filter(component => {
      const matchesSearch =
        !searchQuery ||
        component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || component.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Component Docs</h1>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search components..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2 mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Categories
            </h3>

            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                !selectedCategory
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All Components ({COMPONENT_DOCS.length})
            </button>

            {CATEGORIES.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="w-4 h-4 mr-2" />
                    {category.name}
                  </div>
                  <span className="text-sm text-gray-500">{category.count}</span>
                </button>
              );
            })}
          </div>

          {/* Component List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Components
            </h3>

            {filteredComponents.map(component => (
              <button
                key={component.name}
                onClick={() => setSelectedComponent(component)}
                className={`w-full text-left p-3 rounded-lg transition-colors border ${
                  selectedComponent?.name === component.name
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {component.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {component.category}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {component.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedComponent ? (
          <ComponentDetailView component={selectedComponent} onCopyCode={copyToClipboard} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a Component
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a component from the sidebar to view its documentation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component Detail View
interface ComponentDetailViewProps {
  component: ComponentDocumentation;
  onCopyCode: (code: string) => void;
}

const ComponentDetailView: React.FC<ComponentDetailViewProps> = ({ component, onCopyCode }) => {
  const [activeExample, setActiveExample] = useState(0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {component.name}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">{component.description}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline">v{component.version}</Badge>
            <Badge variant="outline">{component.category}</Badge>
          </div>
        </div>

        {/* Import Statement */}
        <Card className="p-4 bg-gray-900 text-gray-100">
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono">{component.importPath}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyCode(component.importPath)}
              className="text-gray-300 hover:text-white"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="examples" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="props">Props</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Example List */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold mb-3">Examples</h3>
              {component.examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setActiveExample(index)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    activeExample === index
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {example.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{example.description}</p>
                </button>
              ))}
            </div>

            {/* Example Code */}
            <div className="lg:col-span-2 space-y-4">
              {component.examples[activeExample] && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {component.examples[activeExample].title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {component.examples[activeExample].editable && (
                        <Button variant="ghost" size="sm">
                          <Play className="w-4 h-4 mr-2" />
                          Run
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopyCode(component.examples[activeExample].code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Card className="p-0 overflow-hidden">
                    <pre className="p-4 bg-gray-900 text-gray-100 text-sm overflow-x-auto">
                      <code>{component.examples[activeExample].code}</code>
                    </pre>
                  </Card>

                  {component.examples[activeExample].preview && (
                    <Card className="p-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Preview:
                      </h4>
                      <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                        {component.examples[activeExample].preview}
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Props Tab */}
        <TabsContent value="props" className="space-y-4">
          <div className="space-y-4">
            {component.props.map(prop => (
              <Card key={prop.name} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {prop.name}
                    </code>
                    {prop.required && (
                      <Badge variant="error" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {prop.type}
                  </code>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-3">{prop.description}</p>

                {prop.defaultValue !== undefined && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Default:
                    </span>
                    <code className="ml-2 text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {JSON.stringify(prop.defaultValue)}
                    </code>
                  </div>
                )}

                {prop.examples && prop.examples.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                      Examples:
                    </span>
                    <div className="space-y-1">
                      {prop.examples.map((example, index) => (
                        <code
                          key={index}
                          className="block text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                        >
                          {typeof example === 'string' ? example : JSON.stringify(example)}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Accessibility Tab */}
        <TabsContent value="accessibility" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Accessibility Features</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    component.accessibility.keyboard ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span>Keyboard Navigation</span>
              </div>

              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    component.accessibility.screenReader ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span>Screen Reader Support</span>
              </div>

              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    component.accessibility.focusManagement ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span>Focus Management</span>
              </div>

              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    component.accessibility.colorContrast ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span>Color Contrast Compliant</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Characteristics</h3>

            <div className="space-y-4">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Rendering Strategy:
                </span>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {component.performance.renderingStrategy}
                </p>
              </div>

              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Memory Footprint:
                </span>
                <Badge
                  variant={
                    component.performance.memoryFootprint === 'low'
                      ? 'default'
                      : component.performance.memoryFootprint === 'medium'
                        ? 'secondary'
                        : 'error'
                  }
                  className="ml-2"
                >
                  {component.performance.memoryFootprint}
                </Badge>
              </div>

              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Lazy Loadable:</span>
                <Badge
                  variant={component.performance.lazyLoadable ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {component.performance.lazyLoadable ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Related Components */}
      {component.relatedComponents.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Related Components</h3>
          <div className="flex flex-wrap gap-2">
            {component.relatedComponents.map(relatedComponent => (
              <Button
                key={relatedComponent}
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
              >
                {relatedComponent}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentDocumentation;
