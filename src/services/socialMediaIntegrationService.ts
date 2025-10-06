/**
 * Social Media Integration Service
 *
 * Provides comprehensive social media connectivity for sharing achievements, updates,
 * and team content across platforms with privacy controls and engagement tracking
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface SocialMediaPlatform {
  id: string;
  name: string;
  type: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok';
  isConnected: boolean;
  accountHandle: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  permissions: string[];
  isEnabled: boolean;
}

export interface SocialMediaPost {
  id: string;
  platformId: string;
  content: string;
  media?: {
    type: 'image' | 'video' | 'gif';
    url: string;
    alt?: string;
  }[];
  hashtags: string[];
  mentions: string[];
  scheduledTime?: number;
  publishedTime?: number;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
    lastUpdated: number;
  };
  metadata: Record<string, unknown>;
}

export interface ContentTemplate {
  id: string;
  name: string;
  type:
    | 'match_result'
    | 'player_achievement'
    | 'training_update'
    | 'team_announcement'
    | 'recruitment'
    | 'custom';
  platforms: string[];
  content: string;
  hashtags: string[];
  media?: string[];
  variables: string[];
  isActive: boolean;
  privacyLevel: 'public' | 'followers' | 'private';
}

export interface EngagementMetrics {
  platformId: string;
  period: 'day' | 'week' | 'month';
  totalPosts: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  totalViews: number;
  avgEngagementRate: number;
  topPerformingPosts: SocialMediaPost[];
  demographics: {
    ageGroups: Record<string, number>;
    locations: Record<string, number>;
    interests: string[];
  };
}

export interface PrivacySettings {
  userId: string;
  parentalConsent: boolean; // For youth players
  sharePlayerStats: boolean;
  shareMatchResults: boolean;
  shareTrainingUpdates: boolean;
  sharePersonalAchievements: boolean;
  allowMentions: boolean;
  allowTagging: boolean;
  restrictedPlatforms: string[];
}

class SocialMediaIntegrationService {
  private platforms: Map<string, SocialMediaPlatform> = new Map();
  private posts: Map<string, SocialMediaPost> = new Map();
  private templates: Map<string, ContentTemplate> = new Map();
  private privacySettings: Map<string, PrivacySettings> = new Map();
  private scheduledPosts: Map<string, any> = new Map();

  // Event callbacks
  private onPostPublishedCallback?: (post: SocialMediaPost) => void;
  private onEngagementUpdateCallback?: (metrics: EngagementMetrics) => void;
  private onConnectionStatusCallback?: (platform: SocialMediaPlatform) => void;

  constructor() {
    this.initializePlatforms();
    this.initializeTemplates();
    this.setupScheduler();
  }

  /**
   * Initialize social media integration service
   */
  async initialize(): Promise<void> {
    await this.loadConnections();
    await this.loadPrivacySettings();
    // // // // console.log('📱 Social media integration service initialized');
  }

  /**
   * Connect to social media platform
   */
  async connectPlatform(
    platformType: SocialMediaPlatform['type'],
    credentials: {
      clientId: string;
      clientSecret: string;
      redirectUri?: string;
    }
  ): Promise<string> {
    const platform = Array.from(this.platforms.values()).find(p => p.type === platformType);

    if (!platform) {
      throw new Error(`Platform not supported: ${platformType}`);
    }

    try {
      const authUrl = await this.generateAuthUrl(platform, credentials);
      // // // // console.log(`🔐 ${platform.name} auth URL generated:`, authUrl);

      // In a real implementation, this would open OAuth flow
      // For demonstration, we'll simulate the connection
      await this.simulateOAuthConnection(platform.id, credentials);

      return authUrl;
    } catch (_error) {
      console.error(`❌ Failed to connect ${platform.name}:`, _error);
      throw _error;
    }
  }

  /**
   * Post match results across platforms
   */
  async shareMatchResult(
    matchResult: {
      opponent: string;
      homeScore: number;
      awayScore: number;
      isHome: boolean;
      venue: string;
      date: string;
      highlights?: string[];
      playerOfTheMatch?: string;
    },
    platforms: string[] = []
  ): Promise<string[]> {
    const template = this.templates.get('match_result');
    if (!template) {
      throw new Error('Match result template not found');
    }

    const targetPlatforms = platforms.length > 0 ? platforms : template.platforms;
    const postIds: string[] = [];

    const content = this.processTemplate(template.content, {
      opponent: matchResult.opponent,
      homeScore: String(matchResult.homeScore),
      awayScore: String(matchResult.awayScore),
      result:
        matchResult.homeScore > matchResult.awayScore
          ? 'WIN'
          : matchResult.homeScore < matchResult.awayScore
            ? 'LOSS'
            : 'DRAW',
      venue: matchResult.venue,
      date: matchResult.date,
      playerOfTheMatch: matchResult.playerOfTheMatch || '',
    });

    for (const platformId of targetPlatforms) {
      const platform = this.platforms.get(platformId);
      if (!platform?.isConnected || !platform.isEnabled) {
        continue;
      }

      try {
        const postId = await this.createPost({
          platformId,
          content,
          hashtags: [...template.hashtags, '#MatchResult', '#Soccer'],
          media: matchResult.highlights?.map(url => ({ type: 'image' as const, url })),
          metadata: { type: 'match_result', matchData: matchResult },
        });

        postIds.push(postId);
      } catch (_error) {
        console.error(`❌ Failed to post to ${platform.name}:`, _error);
      }
    }

    // // // // console.log(`⚽ Match result shared to ${postIds.length} platforms`);
    return postIds;
  }

  /**
   * Share player achievements
   */
  async sharePlayerAchievement(
    playerId: string,
    achievement: {
      type: 'goal' | 'assist' | 'clean_sheet' | 'player_of_match' | 'milestone' | 'award';
      description: string;
      match?: string;
      statistic?: number;
      image?: string;
    },
    platforms: string[] = []
  ): Promise<string[]> {
    // Check privacy settings first
    const privacy = this.privacySettings.get(playerId);
    if (privacy && !privacy.sharePersonalAchievements) {
      // // // // console.log('🔒 Player achievement sharing disabled by privacy settings');
      return [];
    }

    const template = this.templates.get('player_achievement');
    if (!template) {
      throw new Error('Player achievement template not found');
    }

    const targetPlatforms =
      platforms.length > 0
        ? platforms
        : template.platforms.filter(p => !privacy?.restrictedPlatforms.includes(p));

    const postIds: string[] = [];

    const content = this.processTemplate(template.content, {
      playerName: 'Player Name', // Would be fetched from player data
      achievementType: achievement.type,
      description: achievement.description,
      match: achievement.match || '',
      statistic: achievement.statistic?.toString() || '',
    });

    for (const platformId of targetPlatforms) {
      const platform = this.platforms.get(platformId);
      if (!platform?.isConnected || !platform.isEnabled) {
        continue;
      }

      try {
        const postId = await this.createPost({
          platformId,
          content,
          hashtags: [...template.hashtags, `#${achievement.type}`, '#PlayerAchievement'],
          media: achievement.image ? [{ type: 'image', url: achievement.image }] : undefined,
          metadata: { type: 'player_achievement', playerId, achievementData: achievement },
        });

        postIds.push(postId);
      } catch (_error) {
        console.error(`❌ Failed to post achievement to ${platform.name}:`, _error);
      }
    }

    // // // // console.log(`🏆 Player achievement shared to ${postIds.length} platforms`);
    return postIds;
  }

  /**
   * Share training updates
   */
  async shareTrainingUpdate(
    teamId: string,
    trainingInfo: {
      type: string;
      focus: string[];
      highlights: string[];
      images?: string[];
      playerSpotlight?: string;
    },
    platforms: string[] = []
  ): Promise<string[]> {
    const template = this.templates.get('training_update');
    if (!template) {
      throw new Error('Training update template not found');
    }

    const targetPlatforms = platforms.length > 0 ? platforms : template.platforms;
    const postIds: string[] = [];

    const content = this.processTemplate(template.content, {
      trainingType: trainingInfo.type,
      focus: trainingInfo.focus.join(', '),
      highlights: trainingInfo.highlights.join('. '),
      playerSpotlight: trainingInfo.playerSpotlight || '',
    });

    for (const platformId of targetPlatforms) {
      const platform = this.platforms.get(platformId);
      if (!platform?.isConnected || !platform.isEnabled) {
        continue;
      }

      try {
        const postId = await this.createPost({
          platformId,
          content,
          hashtags: [...template.hashtags, '#Training', '#TeamWork'],
          media: trainingInfo.images?.map(url => ({ type: 'image' as const, url })),
          metadata: { type: 'training_update', teamId, trainingData: trainingInfo },
        });

        postIds.push(postId);
      } catch (_error) {
        console.error(`❌ Failed to post training update to ${platform.name}:`, _error);
      }
    }

    // // // // console.log(`⚽ Training update shared to ${postIds.length} platforms`);
    return postIds;
  }

  /**
   * Share recruitment posts
   */
  async shareRecruitmentPost(
    teamId: string,
    recruitmentInfo: {
      positions: string[];
      requirements: string[];
      contactInfo: string;
      deadline?: string;
      tryoutInfo?: string;
    },
    platforms: string[] = []
  ): Promise<string[]> {
    const template = this.templates.get('recruitment');
    if (!template) {
      throw new Error('Recruitment template not found');
    }

    const targetPlatforms = platforms.length > 0 ? platforms : template.platforms;
    const postIds: string[] = [];

    const content = this.processTemplate(template.content, {
      positions: recruitmentInfo.positions.join(', '),
      requirements: recruitmentInfo.requirements.join(', '),
      contactInfo: recruitmentInfo.contactInfo,
      deadline: recruitmentInfo.deadline || '',
      tryoutInfo: recruitmentInfo.tryoutInfo || '',
    });

    for (const platformId of targetPlatforms) {
      const platform = this.platforms.get(platformId);
      if (!platform?.isConnected || !platform.isEnabled) {
        continue;
      }

      try {
        const postId = await this.createPost({
          platformId,
          content,
          hashtags: [...template.hashtags, '#Recruitment', '#JoinOurTeam'],
          metadata: { type: 'recruitment', teamId, recruitmentData: recruitmentInfo },
        });

        postIds.push(postId);
      } catch (_error) {
        console.error(`❌ Failed to post recruitment to ${platform.name}:`, _error);
      }
    }

    // // // // console.log(`👥 Recruitment post shared to ${postIds.length} platforms`);
    return postIds;
  }

  /**
   * Schedule posts for optimal engagement times
   */
  async schedulePost(
    platformId: string,
    content: string,
    scheduledTime: Date,
    options: {
      hashtags?: string[];
      mentions?: string[];
      media?: { type: 'image' | 'video'; url: string }[];
    } = {}
  ): Promise<string> {
    const postId = uuidv4();

    const post: SocialMediaPost = {
      id: postId,
      platformId,
      content,
      hashtags: options.hashtags || [],
      mentions: options.mentions || [],
      media: options.media,
      scheduledTime: scheduledTime.getTime(),
      status: 'scheduled',
      engagement: {
        likes: 0,
        shares: 0,
        comments: 0,
        views: 0,
        lastUpdated: Date.now(),
      },
      metadata: {},
    };

    this.posts.set(postId, post);
    this.scheduledPosts.set(postId, {
      postId,
      scheduledTime: scheduledTime.getTime(),
      processed: false,
    });

    // // // // console.log(`⏰ Post scheduled for ${scheduledTime.toISOString()}`);
    return postId;
  }

  /**
   * Get engagement analytics
   */
  async getEngagementMetrics(
    platformId: string,
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<EngagementMetrics> {
    const platform = this.platforms.get(platformId);
    if (!platform?.isConnected) {
      throw new Error(`Platform not connected: ${platformId}`);
    }

    // Calculate time range
    const now = Date.now();
    const periods = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };

    const cutoff = now - periods[period];

    const periodPosts = Array.from(this.posts.values()).filter(
      post => post.platformId === platformId && post.publishedTime && post.publishedTime >= cutoff
    );

    const totalPosts = periodPosts.length;
    const totalLikes = periodPosts.reduce((sum, post) => sum + post.engagement.likes, 0);
    const totalShares = periodPosts.reduce((sum, post) => sum + post.engagement.shares, 0);
    const totalComments = periodPosts.reduce((sum, post) => sum + post.engagement.comments, 0);
    const totalViews = periodPosts.reduce((sum, post) => sum + post.engagement.views, 0);

    const avgEngagementRate =
      totalPosts > 0 ? ((totalLikes + totalShares + totalComments) / totalViews) * 100 : 0;

    const topPerformingPosts = periodPosts
      .sort(
        (a, b) =>
          b.engagement.likes +
          b.engagement.shares +
          b.engagement.comments -
          (a.engagement.likes + a.engagement.shares + a.engagement.comments)
      )
      .slice(0, 5);

    return {
      platformId,
      period,
      totalPosts,
      totalLikes,
      totalShares,
      totalComments,
      totalViews,
      avgEngagementRate,
      topPerformingPosts,
      demographics: {
        ageGroups: { '18-24': 25, '25-34': 35, '35-44': 20, '45+': 20 },
        locations: { Local: 60, Regional: 25, National: 15 },
        interests: ['Soccer', 'Sports', 'Fitness'],
      },
    };
  }

  /**
   * Set privacy settings for a user/player
   */
  async setPrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    const currentSettings = this.privacySettings.get(userId) || {
      userId,
      parentalConsent: false,
      sharePlayerStats: true,
      shareMatchResults: true,
      shareTrainingUpdates: true,
      sharePersonalAchievements: true,
      allowMentions: true,
      allowTagging: true,
      restrictedPlatforms: [],
    };

    const updatedSettings = { ...currentSettings, ...settings };
    this.privacySettings.set(userId, updatedSettings);

    // Save to localStorage
    localStorage.setItem(`social_privacy_${userId}`, JSON.stringify(updatedSettings));

    // // // // console.log(`🔒 Privacy settings updated for user: ${userId}`);
  }

  /**
   * Get connected platforms
   */
  getConnectedPlatforms(): SocialMediaPlatform[] {
    return Array.from(this.platforms.values()).filter(p => p.isConnected);
  }

  /**
   * Get recent posts
   */
  getRecentPosts(limit: number = 10): SocialMediaPost[] {
    return Array.from(this.posts.values())
      .filter(post => post.status === 'published')
      .sort((a, b) => (b.publishedTime || 0) - (a.publishedTime || 0))
      .slice(0, limit);
  }

  // Event listener setters
  onPostPublished(callback: (post: SocialMediaPost) => void): void {
    this.onPostPublishedCallback = callback;
  }

  onEngagementUpdate(callback: (metrics: EngagementMetrics) => void): void {
    this.onEngagementUpdateCallback = callback;
  }

  onConnectionStatus(callback: (platform: SocialMediaPlatform) => void): void {
    this.onConnectionStatusCallback = callback;
  }

  // Private methods

  private async createPost(options: {
    platformId: string;
    content: string;
    hashtags?: string[];
    mentions?: string[];
    media?: { type: 'image' | 'video'; url: string; alt?: string }[];
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const postId = uuidv4();

    const post: SocialMediaPost = {
      id: postId,
      platformId: options.platformId,
      content: options.content,
      hashtags: options.hashtags || [],
      mentions: options.mentions || [],
      media: options.media,
      status: 'published',
      publishedTime: Date.now(),
      engagement: {
        likes: 0,
        shares: 0,
        comments: 0,
        views: 0,
        lastUpdated: Date.now(),
      },
      metadata: options.metadata || {},
    };

    this.posts.set(postId, post);

    // Actually post to the platform
    await this.publishToPlatform(post);

    if (this.onPostPublishedCallback) {
      this.onPostPublishedCallback(post);
    }

    return postId;
  }

  private async publishToPlatform(post: SocialMediaPost): Promise<void> {
    const platform = this.platforms.get(post.platformId);
    if (!platform?.isConnected) {
      throw new Error(`Platform not connected: ${post.platformId}`);
    }

    try {
      switch (platform.type) {
        case 'twitter':
          await this.publishToTwitter(platform, post);
          break;

        case 'facebook':
          await this.publishToFacebook(platform, post);
          break;

        case 'instagram':
          await this.publishToInstagram(platform, post);
          break;

        case 'linkedin':
          await this.publishToLinkedIn(platform, post);
          break;

        default:
        // // // // console.log(`📱 Publishing to ${platform.name} (simulated)`);
      }

      // Simulate some engagement
      setTimeout(() => {
        this.simulateEngagement(post.id);
      }, 60000); // After 1 minute
    } catch (_error) {
      post.status = 'failed';
      throw _error;
    }
  }

  private async publishToTwitter(
    platform: SocialMediaPlatform,
    post: SocialMediaPost
  ): Promise<void> {
    // Twitter API implementation
    // // // // console.log('🐦 Publishing to Twitter:', post.content.substring(0, 50) + '...');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async publishToFacebook(
    platform: SocialMediaPlatform,
    post: SocialMediaPost
  ): Promise<void> {
    // Facebook API implementation
    // // // // console.log('📘 Publishing to Facebook:', post.content.substring(0, 50) + '...');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async publishToInstagram(
    platform: SocialMediaPlatform,
    post: SocialMediaPost
  ): Promise<void> {
    // Instagram API implementation
    // // // // console.log('📷 Publishing to Instagram:', post.content.substring(0, 50) + '...');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async publishToLinkedIn(
    platform: SocialMediaPlatform,
    post: SocialMediaPost
  ): Promise<void> {
    // LinkedIn API implementation
    // // // // console.log('💼 Publishing to LinkedIn:', post.content.substring(0, 50) + '...');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(placeholder, value);
    });

    return processed;
  }

  private async generateAuthUrl(
    platform: SocialMediaPlatform,
    credentials: unknown
  ): Promise<string> {
    // Generate OAuth URLs for different platforms
    const creds = credentials as { clientId?: string };
    switch (platform.type) {
      case 'twitter':
        return `https://api.twitter.com/oauth/authorize?client_id=${creds.clientId}`;

      case 'facebook':
        return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${creds.clientId}`;

      case 'instagram':
        return `https://api.instagram.com/oauth/authorize?client_id=${creds.clientId}`;

      case 'linkedin':
        return `https://www.linkedin.com/oauth/v2/authorization?client_id=${creds.clientId}`;

      default:
        return 'https://example.com/oauth/authorize';
    }
  }

  private async simulateOAuthConnection(platformId: string, credentials: unknown): Promise<void> {
    setTimeout(() => {
      const platform = this.platforms.get(platformId);
      if (platform) {
        platform.isConnected = true;
        platform.accountHandle = `@${platform.name.toLowerCase()}_user`;
        platform.accessToken = `token_${Date.now()}`;
        platform.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
        platform.permissions = ['read', 'write', 'publish'];
        platform.isEnabled = true;

        if (this.onConnectionStatusCallback) {
          this.onConnectionStatusCallback(platform);
        }

        // // // // console.log(`✅ ${platform.name} connected successfully`);
      }
    }, 1000);
  }

  private simulateEngagement(postId: string): void {
    const post = this.posts.get(postId);
    if (!post) {
      return;
    }

    // Simulate random engagement
    post.engagement.likes += Math.floor(Math.random() * 50) + 1;
    post.engagement.shares += Math.floor(Math.random() * 10);
    post.engagement.comments += Math.floor(Math.random() * 20);
    post.engagement.views += Math.floor(Math.random() * 200) + 50;
    post.engagement.lastUpdated = Date.now();

    // // // // console.log(`📊 Engagement update for post ${postId}: ${post.engagement.likes} likes, ${post.engagement.shares} shares`);
  }

  private initializePlatforms(): void {
    const platforms = [
      { id: 'twitter', name: 'Twitter', type: 'twitter' as const },
      { id: 'facebook', name: 'Facebook', type: 'facebook' as const },
      { id: 'instagram', name: 'Instagram', type: 'instagram' as const },
      { id: 'linkedin', name: 'LinkedIn', type: 'linkedin' as const },
      { id: 'youtube', name: 'YouTube', type: 'youtube' as const },
      { id: 'tiktok', name: 'TikTok', type: 'tiktok' as const },
    ];

    platforms.forEach(platform => {
      this.platforms.set(platform.id, {
        ...platform,
        isConnected: false,
        accountHandle: '',
        permissions: [],
        isEnabled: false,
      });
    });
  }

  private initializeTemplates(): void {
    const templates: ContentTemplate[] = [
      {
        id: 'match-result-1',
        name: 'Match Result',
        type: 'match_result' as const,
        platforms: ['twitter', 'facebook', 'instagram'],
        content:
          '{{result}}! Final score: {{homeScore}}-{{awayScore}} vs {{opponent}} at {{venue}} 🏟️ {{#playerOfTheMatch}}Player of the Match: {{playerOfTheMatch}} ⭐{{/playerOfTheMatch}}',
        hashtags: ['#MatchResult', '#Soccer', '#TeamWork'],
        variables: ['result', 'homeScore', 'awayScore', 'opponent', 'venue', 'playerOfTheMatch'],
        isActive: true,
        privacyLevel: 'public' as const,
      },
      {
        id: 'player-achievement-1',
        name: 'Player Achievement',
        type: 'player_achievement' as const,
        platforms: ['twitter', 'facebook', 'instagram'],
        content:
          '🎉 Congratulations to {{playerName}} for {{description}}! {{#match}}in our match {{match}}{{/match}} Keep up the great work! 💪',
        hashtags: ['#PlayerAchievement', '#TeamPride', '#Soccer'],
        variables: ['playerName', 'description', 'match'],
        isActive: true,
        privacyLevel: 'public' as const,
      },
      {
        id: 'training-update-1',
        name: 'Training Update',
        type: 'training_update' as const,
        platforms: ['twitter', 'facebook'],
        content:
          '⚽ Great {{trainingType}} training session today! Focus areas: {{focus}}. {{highlights}} {{#playerSpotlight}}Special shoutout to {{playerSpotlight}}! 👏{{/playerSpotlight}}',
        hashtags: ['#Training', '#HardWork', '#TeamDevelopment'],
        variables: ['trainingType', 'focus', 'highlights', 'playerSpotlight'],
        isActive: true,
        privacyLevel: 'public' as const,
      },
      {
        id: 'recruitment-1',
        name: 'Recruitment',
        type: 'recruitment' as const,
        platforms: ['facebook', 'linkedin'],
        content:
          "🔍 We're looking for talented players! Positions available: {{positions}}. Requirements: {{requirements}}. Contact: {{contactInfo}} {{#deadline}}Deadline: {{deadline}}{{/deadline}}",
        hashtags: ['#Recruitment', '#JoinOurTeam', '#SoccerOpportunity'],
        variables: ['positions', 'requirements', 'contactInfo', 'deadline'],
        isActive: true,
        privacyLevel: 'public' as const,
      },
    ];

    templates.forEach(template => {
      this.templates.set(template.type, template);
    });
  }

  private setupScheduler(): void {
    // Process scheduled posts every minute
    setInterval(() => {
      this.processScheduledPosts();
    }, 60000);

    // Update engagement metrics every 30 minutes
    setInterval(() => {
      this.updateEngagementMetrics();
    }, 30 * 60000);
  }

  private processScheduledPosts(): void {
    const now = Date.now();

    for (const [scheduledId, scheduledPost] of this.scheduledPosts.entries()) {
      if (!scheduledPost.processed && scheduledPost.scheduledTime <= now) {
        const post = this.posts.get(scheduledPost.postId);
        if (post && post.status === 'scheduled') {
          this.publishToPlatform(post)
            .then(() => {
              post.status = 'published';
              post.publishedTime = Date.now();
              scheduledPost.processed = true;

              if (this.onPostPublishedCallback) {
                this.onPostPublishedCallback(post);
              }
            })
            .catch(() => {
              post.status = 'failed';
            });
        }
      }
    }
  }

  private updateEngagementMetrics(): void {
    // Simulate engagement updates for published posts
    for (const post of this.posts.values()) {
      if (post.status === 'published' && post.publishedTime) {
        const timeSincePublished = Date.now() - post.publishedTime;

        // Simulate engagement decay over time
        if (timeSincePublished < 24 * 60 * 60 * 1000) {
          // First 24 hours
          this.simulateEngagement(post.id);
        }
      }
    }
  }

  private async loadConnections(): Promise<void> {
    // Load saved platform connections
    const saved = localStorage.getItem('social_media_platforms');
    if (saved) {
      const platforms = JSON.parse(saved);
      platforms.forEach((platform: SocialMediaPlatform) => {
        this.platforms.set(platform.id, platform);
      });
    }
  }

  private async loadPrivacySettings(): Promise<void> {
    // Load privacy settings for all users
    // // // // console.log('🔒 Loading privacy settings');
  }
}

// Singleton instance
export const socialMediaIntegrationService = new SocialMediaIntegrationService();
