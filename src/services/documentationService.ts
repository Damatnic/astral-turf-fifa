/**
 * Documentation Service
 * 
 * Provides searchable documentation system with version control,
 * content management, and analytics for the Astral Turf application.
 */

import { z } from 'zod';

// Documentation Schema Definitions
export const DocumentationSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  category: z.enum(['guide', 'api', 'component', 'tutorial', 'faq', 'changelog']),
  tags: z.array(z.string()),
  version: z.string(),
  lastUpdated: z.string(),
  author: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  searchTerms: z.array(z.string()),
  relatedDocs: z.array(z.string()),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedReadTime: z.number(), // minutes
  popularity: z.number(),
  rating: z.number(),
  metadata: z.object({
    views: z.number(),
    helpful: z.number(),
    comments: z.number(),
    lastViewed: z.string().optional(),
    bookmarked: z.boolean().optional()
  })
});

export const SearchResultSchema = z.object({
  document: DocumentationSchema,
  relevance: z.number(),
  matchedTerms: z.array(z.string()),
  excerpt: z.string()
});

export const VersionSchema = z.object({
  version: z.string(),
  timestamp: z.string(),
  author: z.string(),
  changes: z.array(z.string()),
  content: z.string()
});

export const AnalyticsSchema = z.object({
  documentId: z.string(),
  event: z.enum(['view', 'search', 'helpful', 'bookmark', 'share', 'comment']),
  timestamp: z.string(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export type Documentation = z.infer<typeof DocumentationSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type Version = z.infer<typeof VersionSchema>;
export type Analytics = z.infer<typeof AnalyticsSchema>;

// Search Configuration
interface SearchOptions {
  query: string;
  categories?: string[];
  tags?: string[];
  difficulty?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'popularity' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

interface SearchFilters {
  category?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  difficulty?: string;
  minRating?: number;
}

/**
 * Documentation Service Class
 * Handles all documentation-related operations including search, versioning, and analytics
 */
export class DocumentationService {
  private static instance: DocumentationService;
  private documents: Map<string, Documentation> = new Map();
  private versions: Map<string, Version[]> = new Map(); // docId -> versions
  private analytics: Analytics[] = [];
  private searchIndex: Map<string, Set<string>> = new Map(); // term -> docIds
  private bookmarks: Set<string> = new Set();

  private constructor() {
    this.initializeDocuments();
    this.buildSearchIndex();
  }

  static getInstance(): DocumentationService {
    if (!DocumentationService.instance) {
      DocumentationService.instance = new DocumentationService();
    }
    return DocumentationService.instance;
  }

  /**
   * Initialize with sample documentation
   */
  private initializeDocuments(): void {
    const sampleDocs: Documentation[] = [
      {
        id: 'getting-started',
        title: 'Getting Started with Astral Turf',
        content: `# Getting Started with Astral Turf

Welcome to Astral Turf, your AI-powered soccer tactical planning companion!

## Quick Start

1. **Create Your Account** - Sign up and verify your email
2. **Complete Onboarding** - Follow our interactive tutorial
3. **Build Your Squad** - Add players with detailed attributes
4. **Design Formations** - Use the tactical board to create strategies
5. **Analyze with AI** - Get intelligent insights and recommendations

## Core Concepts

### Players
Individual team members with unique attributes including pace, shooting, passing, dribbling, defending, and physical stats. Each player has a position preference and chemistry with teammates.

### Formations
Tactical layouts that define where players are positioned on the field. Choose from professional templates like 4-3-3, 4-4-2, or create custom formations.

### Chemistry
The compatibility between players based on their positions, playing styles, and relationships. Good chemistry improves team performance.

### AI Analysis
Our intelligent system analyzes your formations and provides recommendations for improvements, tactical adjustments, and player positioning.

## First Steps

### Creating Your First Team
1. Navigate to Team Management
2. Click "Add Player"
3. Enter player details and attributes
4. Assign team (Home or Away)
5. Repeat for all players

### Building Your First Formation
1. Go to Tactical Board
2. Select a formation template
3. Drag players to positions
4. Adjust positioning as needed
5. Save your formation

### Getting AI Insights
1. Ensure players are positioned
2. Click "AI Analysis" button
3. Review recommendations
4. Apply suggested improvements
5. Re-analyze for optimization

## Tips for Success

- Start with simple formations before attempting complex tactics
- Pay attention to player chemistry when positioning
- Use AI analysis regularly to optimize your setup
- Experiment with different playing styles
- Save multiple formation variants for different situations

Ready to begin your tactical journey? Let's create something amazing!`,
        category: 'guide',
        tags: ['basics', 'introduction', 'tutorial', 'quickstart'],
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        author: 'Astral Turf Team',
        status: 'published',
        searchTerms: ['getting started', 'introduction', 'basics', 'tutorial', 'quickstart', 'first time'],
        relatedDocs: ['tactical-board-guide', 'player-management', 'ai-analysis'],
        difficulty: 'beginner',
        estimatedReadTime: 8,
        popularity: 95,
        rating: 4.8,
        metadata: {
          views: 15420,
          helpful: 1231,
          comments: 45,
          lastViewed: new Date().toISOString(),
          bookmarked: false
        }
      },
      {
        id: 'tactical-board-guide',
        title: 'Tactical Board Complete Guide',
        content: `# Tactical Board Complete Guide

Master the art of tactical planning with our comprehensive tactical board guide.

## Interface Overview

The tactical board is your primary workspace for creating and analyzing formations. It features:

### Field Layout
- **3D Perspective**: Realistic field view with proper proportions
- **Grid System**: Optional overlay for precise positioning
- **Zoom Controls**: Detailed view for fine-tuning
- **Field Markings**: Authentic football field lines and areas

### Player Management
- **Drag & Drop**: Intuitive player positioning
- **Color Coding**: Team differentiation
- **Position Labels**: Clear role indicators
- **Chemistry Visualization**: Relationship mapping

### Toolbar Functions
- **Formation Templates**: Quick access to professional setups
- **Drawing Tools**: Tactical annotations and movements
- **Save/Load**: Formation management
- **Export Options**: Share and present your tactics

## Advanced Features

### Formation Creation
1. **Choose Base Formation**: Start with a template or blank field
2. **Position Players**: Drag to optimal locations
3. **Adjust Roles**: Set specific player instructions
4. **Fine-tune Spacing**: Optimize player distances
5. **Validate Setup**: Ensure tactical soundness

### Chemistry System
Understanding player chemistry is crucial for team success:

- **Green Lines**: Excellent chemistry (80-100)
- **Yellow Lines**: Good chemistry (60-79)
- **Red Lines**: Poor chemistry (below 60)
- **No Lines**: Neutral chemistry (no significant impact)

### AI Integration
The tactical board works seamlessly with AI analysis:

- **Real-time Feedback**: Instant formation evaluation
- **Weakness Detection**: Identify tactical vulnerabilities
- **Optimization Suggestions**: AI-recommended improvements
- **Opponent Analysis**: Counter-tactical planning

## Best Practices

### Formation Principles
1. **Defensive Stability**: Ensure solid defensive shape
2. **Midfield Balance**: Control the center of the park
3. **Attacking Threat**: Create goal-scoring opportunities
4. **Width Utilization**: Use the full width of the field
5. **Transition Planning**: Consider both phases of play

### Player Positioning
- **Natural Positions**: Place players in familiar roles
- **Chemistry Optimization**: Position compatible players nearby
- **Tactical Flexibility**: Allow for in-game adjustments
- **Individual Strengths**: Maximize each player's abilities

### Common Mistakes to Avoid
- Overcrowding the midfield
- Leaving defensive gaps
- Ignoring player chemistry
- Rigid positioning without flexibility
- Neglecting set-piece assignments

## Keyboard Shortcuts

Essential shortcuts for efficient tactical planning:

\`\`\`
Formation Management:
- Ctrl + N: New formation
- Ctrl + S: Save current formation
- Ctrl + O: Open formation
- Space: Toggle between formations
- Delete: Remove selected element

Player Control:
- Click + Drag: Move player
- Shift + Drag: Precise positioning
- Ctrl + Click: Multi-select
- R: Rotate player
- Tab: Cycle selection

View Controls:
- Mouse Wheel: Zoom in/out
- Middle Click + Drag: Pan view
- F: Focus on selected player
- G: Toggle grid overlay
- C: Toggle chemistry view
\`\`\`

## Troubleshooting

### Performance Issues
- Reduce animation quality in settings
- Close unnecessary browser tabs
- Clear cache if formation loading is slow
- Update graphics drivers for better performance

### Save/Load Problems
- Check browser storage permissions
- Verify internet connection for cloud saves
- Try exporting formation as backup
- Clear browser cache and reload

Master these concepts and you'll be creating professional-level tactics in no time!`,
        category: 'guide',
        tags: ['tactical-board', 'formation', 'strategy', 'advanced'],
        version: '2.1.0',
        lastUpdated: new Date().toISOString(),
        author: 'Coach Martinez',
        status: 'published',
        searchTerms: ['tactical board', 'formation', 'strategy', 'positioning', 'tactics'],
        relatedDocs: ['getting-started', 'formation-templates', 'ai-analysis'],
        difficulty: 'intermediate',
        estimatedReadTime: 15,
        popularity: 87,
        rating: 4.9,
        metadata: {
          views: 12890,
          helpful: 1089,
          comments: 67,
          lastViewed: new Date().toISOString(),
          bookmarked: false
        }
      },
      {
        id: 'api-reference',
        title: 'API Reference Guide',
        content: `# API Reference Guide

Complete reference for Astral Turf's API endpoints and services.

## Authentication

All API requests require authentication via JWT tokens:

\`\`\`javascript
// Include token in headers
headers: {
  'Authorization': 'Bearer your-jwt-token',
  'Content-Type': 'application/json'
}
\`\`\`

## Player Management API

### Create Player
\`\`\`
POST /api/players
Content-Type: application/json

{
  "name": "Lionel Messi",
  "position": "RW",
  "team": "home",
  "attributes": {
    "pace": 85,
    "shooting": 95,
    "passing": 92,
    "dribbling": 97,
    "defending": 35,
    "physical": 68
  }
}
\`\`\`

### Update Player
\`\`\`
PUT /api/players/:id
Content-Type: application/json

{
  "attributes": {
    "pace": 86,
    "shooting": 96
  }
}
\`\`\`

### Get Player
\`\`\`
GET /api/players/:id
\`\`\`

## Formation API

### Create Formation
\`\`\`
POST /api/formations
Content-Type: application/json

{
  "name": "4-3-3 Attacking",
  "positions": [
    { "id": "gk", "x": 50, "y": 10, "position": "GK" },
    { "id": "lb", "x": 20, "y": 25, "position": "LB" }
  ],
  "tactics": {
    "pressure": 75,
    "width": 80,
    "tempo": 85
  }
}
\`\`\`

### Get Formations
\`\`\`
GET /api/formations?limit=10&offset=0
\`\`\`

## AI Analysis API

### Analyze Formation
\`\`\`
POST /api/ai/analyze
Content-Type: application/json

{
  "formationId": "formation-123",
  "playerIds": ["player-1", "player-2"],
  "analysisType": "tactical"
}
\`\`\`

### Get Recommendations
\`\`\`
GET /api/ai/recommendations/:formationId
\`\`\`

## Match Simulation API

### Simulate Match
\`\`\`
POST /api/match/simulate
Content-Type: application/json

{
  "homeTeam": {
    "formationId": "formation-433",
    "tactics": { "pressure": 75, "tempo": 80 }
  },
  "awayTeam": {
    "formationId": "formation-442",
    "tactics": { "pressure": 60, "tempo": 65 }
  }
}
\`\`\`

## Error Handling

All API endpoints return consistent error responses:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid player attributes",
    "details": {
      "field": "pace",
      "issue": "Must be between 1 and 99"
    }
  }
}
\`\`\`

## Rate Limiting

API requests are limited to:
- 100 requests per minute for standard endpoints
- 10 requests per minute for AI analysis
- 5 requests per minute for match simulation

## Webhooks

Register webhooks to receive real-time updates:

\`\`\`
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["player.created", "formation.updated"]
}
\`\`\`

## SDK Libraries

Official SDKs available for:
- JavaScript/TypeScript
- Python
- React Native
- Unity (C#)

## Code Examples

Check our [GitHub repository](https://github.com/astral-turf/examples) for complete examples and integration guides.`,
        category: 'api',
        tags: ['api', 'reference', 'endpoints', 'development'],
        version: '3.0.0',
        lastUpdated: new Date().toISOString(),
        author: 'Dev Team',
        status: 'published',
        searchTerms: ['api', 'endpoints', 'development', 'integration', 'sdk'],
        relatedDocs: ['component-docs', 'getting-started'],
        difficulty: 'advanced',
        estimatedReadTime: 20,
        popularity: 76,
        rating: 4.6,
        metadata: {
          views: 8765,
          helpful: 654,
          comments: 23,
          lastViewed: new Date().toISOString(),
          bookmarked: false
        }
      }
    ];

    sampleDocs.forEach(doc => {
      this.documents.set(doc.id, doc);
      // Initialize version history
      this.versions.set(doc.id, [{
        version: doc.version,
        timestamp: doc.lastUpdated,
        author: doc.author,
        changes: ['Initial version'],
        content: doc.content
      }]);
    });
  }

  /**
   * Build search index for fast text search
   */
  private buildSearchIndex(): void {
    this.searchIndex.clear();
    
    this.documents.forEach((doc) => {
      // Index title, content, and search terms
      const allText = [
        doc.title,
        doc.content,
        ...doc.searchTerms,
        ...doc.tags
      ].join(' ').toLowerCase();

      // Extract words and create index
      const words = allText.match(/\w+/g) || [];
      words.forEach(word => {
        if (word.length > 2) { // Ignore very short words
          if (!this.searchIndex.has(word)) {
            this.searchIndex.set(word, new Set());
          }
          this.searchIndex.get(word)!.add(doc.id);
        }
      });
    });
  }

  /**
   * Search documentation with advanced filtering and ranking
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const {
      query,
      categories = [],
      tags = [],
      difficulty = [],
      limit = 20,
      offset = 0,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = options;

    // Track search analytics
    this.trackEvent({
      documentId: '',
      event: 'search',
      timestamp: new Date().toISOString(),
      metadata: { query, categories, tags, difficulty }
    });

    let candidateIds = new Set<string>();

    if (query.trim()) {
      // Text search
      const queryWords = query.toLowerCase().match(/\w+/g) || [];
      
      queryWords.forEach(word => {
        if (this.searchIndex.has(word)) {
          this.searchIndex.get(word)!.forEach(id => candidateIds.add(id));
        }
      });
    } else {
      // No query - include all documents
      this.documents.forEach((_, id) => candidateIds.add(id));
    }

    // Filter by categories, tags, difficulty
    const filteredDocs = Array.from(candidateIds)
      .map(id => this.documents.get(id)!)
      .filter(doc => {
        if (categories.length > 0 && !categories.includes(doc.category)) return false;
        if (tags.length > 0 && !tags.some(tag => doc.tags.includes(tag))) return false;
        if (difficulty.length > 0 && !difficulty.includes(doc.difficulty)) return false;
        return doc.status === 'published';
      });

    // Calculate relevance scores
    const results: SearchResult[] = filteredDocs.map(doc => {
      const relevance = this.calculateRelevance(doc, query);
      const excerpt = this.generateExcerpt(doc.content, query);
      const matchedTerms = this.findMatchedTerms(doc, query);

      return {
        document: doc,
        relevance,
        matchedTerms,
        excerpt
      };
    });

    // Sort results
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'relevance':
          comparison = b.relevance - a.relevance;
          break;
        case 'date':
          comparison = new Date(b.document.lastUpdated).getTime() - 
                      new Date(a.document.lastUpdated).getTime();
          break;
        case 'popularity':
          comparison = b.document.popularity - a.document.popularity;
          break;
        case 'rating':
          comparison = b.document.rating - a.document.rating;
          break;
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    // Apply pagination
    return results.slice(offset, offset + limit);
  }

  /**
   * Calculate relevance score for search ranking
   */
  private calculateRelevance(doc: Documentation, query: string): number {
    if (!query.trim()) return doc.popularity / 100;

    const queryWords = query.toLowerCase().match(/\w+/g) || [];
    let score = 0;

    queryWords.forEach(word => {
      // Title matches (highest weight)
      if (doc.title.toLowerCase().includes(word)) {
        score += 10;
      }
      
      // Search terms matches
      if (doc.searchTerms.some(term => term.toLowerCase().includes(word))) {
        score += 8;
      }
      
      // Tags matches
      if (doc.tags.some(tag => tag.toLowerCase().includes(word))) {
        score += 6;
      }
      
      // Content matches
      const contentMatches = (doc.content.toLowerCase().match(new RegExp(word, 'g')) || []).length;
      score += Math.min(contentMatches * 0.5, 5); // Cap content score
    });

    // Boost by popularity and rating
    score *= (1 + doc.popularity / 100);
    score *= (1 + doc.rating / 5);

    return score;
  }

  /**
   * Generate excerpt with highlighted search terms
   */
  private generateExcerpt(content: string, query: string, maxLength: number = 200): string {
    if (!query.trim()) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    const queryWords = query.toLowerCase().match(/\w+/g) || [];
    const sentences = content.split(/[.!?]+/);
    
    // Find sentence with most query word matches
    let bestSentence = sentences[0] || '';
    let maxMatches = 0;

    sentences.forEach(sentence => {
      const matches = queryWords.filter(word => 
        sentence.toLowerCase().includes(word)
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    });

    // Trim to max length
    if (bestSentence.length > maxLength) {
      bestSentence = bestSentence.substring(0, maxLength) + '...';
    }

    return bestSentence.trim();
  }

  /**
   * Find matched terms in document
   */
  private findMatchedTerms(doc: Documentation, query: string): string[] {
    const queryWords = query.toLowerCase().match(/\w+/g) || [];
    const matched: string[] = [];

    queryWords.forEach(word => {
      if (doc.title.toLowerCase().includes(word)) matched.push(word);
      if (doc.searchTerms.some(term => term.toLowerCase().includes(word))) matched.push(word);
      if (doc.tags.some(tag => tag.toLowerCase().includes(word))) matched.push(word);
    });

    return [...new Set(matched)]; // Remove duplicates
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<Documentation | null> {
    const doc = this.documents.get(id);
    if (doc) {
      // Track view
      this.trackEvent({
        documentId: id,
        event: 'view',
        timestamp: new Date().toISOString()
      });
      
      // Update view count
      doc.metadata.views++;
      doc.metadata.lastViewed = new Date().toISOString();
    }
    return doc || null;
  }

  /**
   * Get multiple documents by IDs
   */
  async getDocuments(ids: string[]): Promise<Documentation[]> {
    return ids.map(id => this.documents.get(id)).filter(Boolean) as Documentation[];
  }

  /**
   * Get related documents
   */
  async getRelatedDocuments(id: string, limit: number = 5): Promise<Documentation[]> {
    const doc = this.documents.get(id);
    if (!doc) return [];

    const related = doc.relatedDocs
      .map(relatedId => this.documents.get(relatedId))
      .filter(Boolean) as Documentation[];

    // If not enough related docs, find similar by tags
    if (related.length < limit) {
      const similarDocs = Array.from(this.documents.values())
        .filter(d => d.id !== id && !doc.relatedDocs.includes(d.id))
        .filter(d => d.tags.some(tag => doc.tags.includes(tag)))
        .sort((a, b) => {
          const aMatches = a.tags.filter(tag => doc.tags.includes(tag)).length;
          const bMatches = b.tags.filter(tag => doc.tags.includes(tag)).length;
          return bMatches - aMatches;
        });

      related.push(...similarDocs.slice(0, limit - related.length));
    }

    return related.slice(0, limit);
  }

  /**
   * Get document version history
   */
  async getVersionHistory(id: string): Promise<Version[]> {
    return this.versions.get(id) || [];
  }

  /**
   * Get specific version of document
   */
  async getDocumentVersion(id: string, version: string): Promise<Documentation | null> {
    const versions = this.versions.get(id) || [];
    const versionData = versions.find(v => v.version === version);
    
    if (!versionData) return null;

    const doc = this.documents.get(id);
    if (!doc) return null;

    return {
      ...doc,
      content: versionData.content,
      version: versionData.version,
      lastUpdated: versionData.timestamp
    };
  }

  /**
   * Update document
   */
  async updateDocument(id: string, updates: Partial<Documentation>): Promise<boolean> {
    const doc = this.documents.get(id);
    if (!doc) return false;

    // Create new version if content changed
    if (updates.content && updates.content !== doc.content) {
      const versions = this.versions.get(id) || [];
      const newVersion: Version = {
        version: updates.version || `${doc.version}.1`,
        timestamp: new Date().toISOString(),
        author: updates.author || 'System',
        changes: ['Content updated'],
        content: updates.content
      };
      versions.push(newVersion);
      this.versions.set(id, versions);
    }

    // Update document
    const updatedDoc = { ...doc, ...updates, lastUpdated: new Date().toISOString() };
    this.documents.set(id, updatedDoc);

    // Rebuild search index
    this.buildSearchIndex();

    return true;
  }

  /**
   * Track analytics event
   */
  trackEvent(event: Analytics): void {
    this.analytics.push(event);
  }

  /**
   * Mark document as helpful
   */
  async markHelpful(id: string, helpful: boolean): Promise<boolean> {
    const doc = this.documents.get(id);
    if (!doc) return false;

    if (helpful) {
      doc.metadata.helpful++;
    }

    this.trackEvent({
      documentId: id,
      event: 'helpful',
      timestamp: new Date().toISOString(),
      metadata: { helpful }
    });

    return true;
  }

  /**
   * Bookmark document
   */
  async bookmarkDocument(id: string): Promise<boolean> {
    const doc = this.documents.get(id);
    if (!doc) return false;

    this.bookmarks.add(id);
    doc.metadata.bookmarked = true;

    this.trackEvent({
      documentId: id,
      event: 'bookmark',
      timestamp: new Date().toISOString()
    });

    return true;
  }

  /**
   * Get bookmarked documents
   */
  async getBookmarks(): Promise<Documentation[]> {
    return Array.from(this.bookmarks)
      .map(id => this.documents.get(id))
      .filter(Boolean) as Documentation[];
  }

  /**
   * Get analytics data
   */
  async getAnalytics(filters?: { 
    documentId?: string; 
    event?: string; 
    dateRange?: { start: string; end: string } 
  }): Promise<Analytics[]> {
    let results = this.analytics;

    if (filters) {
      if (filters.documentId) {
        results = results.filter(a => a.documentId === filters.documentId);
      }
      if (filters.event) {
        results = results.filter(a => a.event === filters.event);
      }
      if (filters.dateRange) {
        results = results.filter(a => 
          a.timestamp >= filters.dateRange!.start && 
          a.timestamp <= filters.dateRange!.end
        );
      }
    }

    return results;
  }

  /**
   * Get popular documents
   */
  async getPopularDocuments(limit: number = 10): Promise<Documentation[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.status === 'published')
      .sort((a, b) => b.metadata.views - a.metadata.views)
      .slice(0, limit);
  }

  /**
   * Get recent documents
   */
  async getRecentDocuments(limit: number = 10): Promise<Documentation[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.status === 'published')
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, limit);
  }

  /**
   * Get categories with document counts
   */
  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    const categories = new Map<string, number>();
    
    this.documents.forEach(doc => {
      if (doc.status === 'published') {
        categories.set(doc.category, (categories.get(doc.category) || 0) + 1);
      }
    });

    return Array.from(categories.entries()).map(([category, count]) => ({
      category,
      count
    }));
  }

  /**
   * Export documentation data
   */
  async exportDocumentation(format: 'json' | 'markdown' = 'json'): Promise<string> {
    const docs = Array.from(this.documents.values());
    
    if (format === 'json') {
      return JSON.stringify(docs, null, 2);
    } else {
      // Generate markdown
      return docs.map(doc => `# ${doc.title}\n\n${doc.content}\n\n---\n`).join('\n');
    }
  }
}

// Create singleton instance
export const documentationService = DocumentationService.getInstance();

export default documentationService;