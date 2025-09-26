/**
 * Automated Notification Service
 *
 * Provides comprehensive multi-channel notifications including email, SMS, push notifications,
 * and smart scheduling with user preference management
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';

export interface NotificationChannel {
  id: string;
  type: 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
  name: string;
  isEnabled: boolean;
  config: Record<string, unknown>;
  priority: number;
  rateLimitPerHour: number;
  currentUsage: number;
  lastReset: number;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'training_reminder' | 'match_notification' | 'injury_update' | 'contract_expiry' | 'performance_summary' | 'custom';
  subject: string;
  content: string;
  channels: string[];
  variables: string[];
  isActive: boolean;
}

export interface NotificationPreference {
  userId: string;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  timing: {
    quietHours: { start: string; end: string };
    timezone: string;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  };
  categories: Record<string, boolean>;
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  templateId: string;
  scheduledTime: number;
  data: Record<string, unknown>;
  channels: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  timestamp: number;
  errorMessage?: string;
  metadata: Record<string, unknown>;
}

class NotificationService {
  private channels: Map<string, NotificationChannel> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private preferences: Map<string, NotificationPreference> = new Map();
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private deliveryLog: Map<string, NotificationDelivery[]> = new Map();
  private cronJobs: Map<string, any> = new Map();

  // Event callbacks
  private onNotificationSentCallback?: (notification: ScheduledNotification, success: boolean) => void;
  private onDeliveryStatusCallback?: (delivery: NotificationDelivery) => void;

  constructor() {
    this.initializeChannels();
    this.initializeTemplates();
    this.setupScheduler();
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    await this.loadUserPreferences();
    await this.startScheduledNotifications();
    // // console.log('🔔 Notification service initialized');
  }

  /**
   * Configure notification channel
   */
  async configureChannel(channelConfig: Partial<NotificationChannel>): Promise<void> {
    const channel: NotificationChannel = {
      id: channelConfig.id || uuidv4(),
      type: channelConfig.type || 'email',
      name: channelConfig.name || '',
      isEnabled: channelConfig.isEnabled || false,
      config: channelConfig.config || {},
      priority: channelConfig.priority || 1,
      rateLimitPerHour: channelConfig.rateLimitPerHour || 60,
      currentUsage: 0,
      lastReset: Date.now(),
    };

    this.channels.set(channel.id, channel);
    // // console.log(`📱 Notification channel configured: ${channel.name}`);
  }

  /**
   * Create notification template
   */
  async createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<string> {
    const templateId = uuidv4();

    const fullTemplate: NotificationTemplate = {
      id: templateId,
      ...template,
    };

    this.templates.set(templateId, fullTemplate);
    // // console.log(`📝 Notification template created: ${template.name}`);

    return templateId;
  }

  /**
   * Set user notification preferences
   */
  async setUserPreferences(userId: string, preferences: Partial<NotificationPreference>): Promise<void> {
    const currentPrefs = this.preferences.get(userId) || {
      userId,
      channels: {
        email: true,
        sms: false,
        push: true,
        inApp: true,
      },
      timing: {
        quietHours: { start: '22:00', end: '07:00' },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        frequency: 'immediate' as const,
      },
      categories: {},
    };

    const updatedPrefs = { ...currentPrefs, ...preferences };
    this.preferences.set(userId, updatedPrefs);

    // Save to localStorage for persistence
    localStorage.setItem(`notification_prefs_${userId}`, JSON.stringify(updatedPrefs));

    // // console.log(`⚙️ Notification preferences updated for user: ${userId}`);
  }

  /**
   * Send immediate notification
   */
  async sendNotification(
    userId: string,
    templateId: string,
    data: Record<string, unknown>,
    priority: ScheduledNotification['priority'] = 'medium',
    customChannels?: string[],
  ): Promise<string> {
    const notificationId = uuidv4();
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const userPrefs = this.preferences.get(userId);
    const channels = customChannels || this.determineChannels(userId, template.channels);

    const notification: ScheduledNotification = {
      id: notificationId,
      userId,
      templateId,
      scheduledTime: Date.now(),
      data,
      channels,
      priority,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
    };

    this.scheduledNotifications.set(notificationId, notification);

    // Send immediately if not in quiet hours
    if (this.canSendNow(userId)) {
      await this.processNotification(notification);
    }

    return notificationId;
  }

  /**
   * Schedule notification for future delivery
   */
  async scheduleNotification(
    userId: string,
    templateId: string,
    scheduledTime: Date,
    data: Record<string, unknown>,
    priority: ScheduledNotification['priority'] = 'medium',
  ): Promise<string> {
    const notificationId = uuidv4();
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const channels = this.determineChannels(userId, template.channels);

    const notification: ScheduledNotification = {
      id: notificationId,
      userId,
      templateId,
      scheduledTime: scheduledTime.getTime(),
      data,
      channels,
      priority,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
    };

    this.scheduledNotifications.set(notificationId, notification);
    // // console.log(`⏰ Notification scheduled for ${scheduledTime.toISOString()}`);

    return notificationId;
  }

  /**
   * Send training reminders
   */
  async sendTrainingReminder(
    playerId: string,
    trainingDetails: {
      date: string;
      time: string;
      location: string;
      type: string;
    },
    reminderMinutes: number = 60,
  ): Promise<void> {
    const scheduledTime = new Date(
      new Date(`${trainingDetails.date} ${trainingDetails.time}`).getTime() -
      (reminderMinutes * 60 * 1000),
    );

    await this.scheduleNotification(
      playerId,
      'training_reminder',
      scheduledTime,
      {
        playerName: 'Player', // Would be fetched from player data
        trainingType: trainingDetails.type,
        trainingDate: trainingDetails.date,
        trainingTime: trainingDetails.time,
        trainingLocation: trainingDetails.location,
        minutesUntil: reminderMinutes,
      },
      'medium',
    );
  }

  /**
   * Send match notifications
   */
  async sendMatchNotification(
    teamId: string,
    matchDetails: {
      opponent: string;
      date: string;
      time: string;
      venue: string;
      isHome: boolean;
    },
    playerIds: string[],
    notificationTimes: number[] = [180, 60, 30], // 3 hours, 1 hour, 30 minutes
  ): Promise<void> {
    const matchDateTime = new Date(`${matchDetails.date} ${matchDetails.time}`);

    for (const minutes of notificationTimes) {
      const scheduledTime = new Date(matchDateTime.getTime() - (minutes * 60 * 1000));

      for (const playerId of playerIds) {
        await this.scheduleNotification(
          playerId,
          'match_notification',
          scheduledTime,
          {
            opponent: matchDetails.opponent,
            matchDate: matchDetails.date,
            matchTime: matchDetails.time,
            venue: matchDetails.venue,
            homeAway: matchDetails.isHome ? 'Home' : 'Away',
            minutesUntil: minutes,
          },
          'high',
        );
      }
    }
  }

  /**
   * Send injury status updates
   */
  async sendInjuryUpdate(
    playerId: string,
    injuryUpdate: {
      type: string;
      severity: string;
      expectedReturn?: string;
      treatment: string;
    },
  ): Promise<void> {
    await this.sendNotification(
      playerId,
      'injury_update',
      {
        injuryType: injuryUpdate.type,
        severity: injuryUpdate.severity,
        expectedReturn: injuryUpdate.expectedReturn,
        treatment: injuryUpdate.treatment,
      },
      'high',
    );

    // Also notify coaches and medical staff
    // Implementation would fetch relevant staff IDs
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotification(
    userIds: string[],
    templateId: string,
    data: Record<string, unknown>,
    staggerMinutes: number = 0,
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const delay = staggerMinutes * i * 60 * 1000;
      const scheduledTime = new Date(Date.now() + delay);

      const notificationId = await this.scheduleNotification(
        userId,
        templateId,
        scheduledTime,
        data,
        'medium',
      );

      notificationIds.push(notificationId);
    }

    // // console.log(`📢 Bulk notification scheduled for ${userIds.length} users`);
    return notificationIds;
  }

  /**
   * Get notification delivery statistics
   */
  getDeliveryStats(timeframe: 'day' | 'week' | 'month' = 'day') {
    const now = Date.now();
    const timeframes = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };

    const cutoff = now - timeframes[timeframe];
    let totalSent = 0;
    let totalDelivered = 0;
    let totalOpened = 0;
    let totalFailed = 0;

    for (const deliveries of this.deliveryLog.values()) {
      for (const delivery of deliveries) {
        if (delivery.timestamp >= cutoff) {
          totalSent++;

          switch (delivery.status) {
            case 'delivered':
            case 'opened':
            case 'clicked':
              totalDelivered++;
              break;
            case 'failed':
              totalFailed++;
              break;
          }

          if (delivery.status === 'opened' || delivery.status === 'clicked') {
            totalOpened++;
          }
        }
      }
    }

    return {
      sent: totalSent,
      delivered: totalDelivered,
      opened: totalOpened,
      failed: totalFailed,
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
    };
  }

  // Event listener setters
  onNotificationSent(callback: (notification: ScheduledNotification, success: boolean) => void): void {
    this.onNotificationSentCallback = callback;
  }

  onDeliveryStatus(callback: (delivery: NotificationDelivery) => void): void {
    this.onDeliveryStatusCallback = callback;
  }

  // Private methods

  private async processNotification(notification: ScheduledNotification): Promise<void> {
    notification.attempts++;

    try {
      const template = this.templates.get(notification.templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const processedContent = this.processTemplate(template, notification.data);

      for (const channelId of notification.channels) {
        await this.sendToChannel(channelId, notification.userId, processedContent);
      }

      notification.status = 'sent';

      if (this.onNotificationSentCallback) {
        this.onNotificationSentCallback(notification, true);
      }

      // // console.log(`✅ Notification sent: ${notification.id}`);

    } catch (_error) {
      console.error(`❌ Failed to send notification ${notification.id}:`, error);

      if (notification.attempts < notification.maxAttempts) {
        // Retry with exponential backoff
        setTimeout(() => {
          this.processNotification(notification);
        }, Math.pow(2, notification.attempts) * 1000);
      } else {
        notification.status = 'failed';

        if (this.onNotificationSentCallback) {
          this.onNotificationSentCallback(notification, false);
        }
      }
    }
  }

  private async sendToChannel(
    channelId: string,
    userId: string,
    content: { subject: string; content: string },
  ): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel || !channel.isEnabled) {
      throw new Error(`Channel not available: ${channelId}`);
    }

    // Check rate limits
    if (!this.checkRateLimit(channel)) {
      throw new Error(`Rate limit exceeded for channel: ${channelId}`);
    }

    const deliveryId = uuidv4();

    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmail(channel, userId, content);
          break;

        case 'sms':
          await this.sendSMS(channel, userId, content);
          break;

        case 'push':
          await this.sendPushNotification(channel, userId, content);
          break;

        case 'webhook':
          await this.sendWebhook(channel, userId, content);
          break;
      }

      this.recordDelivery(deliveryId, channelId, 'sent', {});
      channel.currentUsage++;

    } catch (_error) {
      this.recordDelivery(deliveryId, channelId, 'failed', { error: error.message });
      throw error;
    }
  }

  private async sendEmail(
    channel: NotificationChannel,
    userId: string,
    content: { subject: string; content: string },
  ): Promise<void> {
    // Implementation would use actual email service (SendGrid, AWS SES, etc.)
    // // console.log(`📧 Sending email to ${userId}: ${content.subject}`);

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendSMS(
    channel: NotificationChannel,
    userId: string,
    content: { subject: string; content: string },
  ): Promise<void> {
    // Implementation would use SMS service (Twilio, AWS SNS, etc.)
    // // console.log(`📱 Sending SMS to ${userId}: ${content.content}`);

    // Simulate SMS sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendPushNotification(
    channel: NotificationChannel,
    userId: string,
    content: { subject: string; content: string },
  ): Promise<void> {
    // Implementation would use push service (FCM, APNs, etc.)
    // // console.log(`🔔 Sending push notification to ${userId}: ${content.subject}`);

    // Simulate push notification
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async sendWebhook(
    channel: NotificationChannel,
    userId: string,
    content: { subject: string; content: string },
  ): Promise<void> {
    await axios.post(channel.config.url, {
      userId,
      subject: content.subject,
      content: content.content,
      timestamp: Date.now(),
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(channel.config.headers || {}),
      },
    });
  }

  private processTemplate(template: NotificationTemplate, data: Record<string, unknown>): { subject: string; content: string } {
    let subject = template.subject;
    let content = template.content;

    // Replace template variables
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return { subject, content };
  }

  private determineChannels(userId: string, templateChannels: string[]): string[] {
    const userPrefs = this.preferences.get(userId);
    if (!userPrefs) {return templateChannels;}

    return templateChannels.filter(channelId => {
      const channel = this.channels.get(channelId);
      if (!channel) {return false;}

      switch (channel.type) {
        case 'email':
          return userPrefs.channels.email;
        case 'sms':
          return userPrefs.channels.sms;
        case 'push':
          return userPrefs.channels.push;
        case 'in_app':
          return userPrefs.channels.inApp;
        default:
          return true;
      }
    });
  }

  private canSendNow(userId: string): boolean {
    const userPrefs = this.preferences.get(userId);
    if (!userPrefs || userPrefs.timing.frequency !== 'immediate') {return false;}

    // Check quiet hours
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const quietStart = parseInt(userPrefs.timing.quietHours.start.replace(':', ''));
    const quietEnd = parseInt(userPrefs.timing.quietHours.end.replace(':', ''));

    if (quietStart > quietEnd) {
      // Quiet hours span midnight
      return !(currentTime >= quietStart || currentTime <= quietEnd);
    } else {
      // Normal quiet hours
      return !(currentTime >= quietStart && currentTime <= quietEnd);
    }
  }

  private checkRateLimit(channel: NotificationChannel): boolean {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    if (channel.lastReset < hourAgo) {
      channel.currentUsage = 0;
      channel.lastReset = now;
    }

    return channel.currentUsage < channel.rateLimitPerHour;
  }

  private recordDelivery(
    deliveryId: string,
    channelId: string,
    status: NotificationDelivery['status'],
    metadata: Record<string, unknown>,
  ): void {
    const delivery: NotificationDelivery = {
      id: deliveryId,
      notificationId: '',
      channel: channelId,
      status,
      timestamp: Date.now(),
      metadata,
    };

    if (!this.deliveryLog.has(channelId)) {
      this.deliveryLog.set(channelId, []);
    }

    this.deliveryLog.get(channelId)!.push(delivery);

    if (this.onDeliveryStatusCallback) {
      this.onDeliveryStatusCallback(delivery);
    }
  }

  private initializeChannels(): void {
    // Default channels
    const defaultChannels = [
      { id: 'email_primary', type: 'email' as const, name: 'Email' },
      { id: 'sms_primary', type: 'sms' as const, name: 'SMS' },
      { id: 'push_primary', type: 'push' as const, name: 'Push Notifications' },
      { id: 'webhook_primary', type: 'webhook' as const, name: 'Webhook' },
    ];

    defaultChannels.forEach(channel => {
      this.configureChannel({
        ...channel,
        isEnabled: true,
        priority: 1,
        config: {},
      });
    });
  }

  private initializeTemplates(): void {
    // Default templates
    const defaultTemplates = [
      {
        name: 'Training Reminder',
        type: 'training_reminder' as const,
        subject: 'Training Reminder - {{trainingType}}',
        content: 'Hi {{playerName}}, you have {{trainingType}} training in {{minutesUntil}} minutes at {{trainingLocation}}.',
        channels: ['email_primary', 'push_primary'],
        variables: ['playerName', 'trainingType', 'minutesUntil', 'trainingLocation'],
        isActive: true,
      },
      {
        name: 'Match Notification',
        type: 'match_notification' as const,
        subject: 'Match Alert - vs {{opponent}}',
        content: '{{homeAway}} match against {{opponent}} in {{minutesUntil}} minutes at {{venue}}.',
        channels: ['email_primary', 'sms_primary', 'push_primary'],
        variables: ['opponent', 'homeAway', 'minutesUntil', 'venue'],
        isActive: true,
      },
      {
        name: 'Injury Update',
        type: 'injury_update' as const,
        subject: 'Injury Status Update',
        content: 'Update on your {{injuryType}} injury: {{severity}}. Treatment: {{treatment}}. Expected return: {{expectedReturn}}',
        channels: ['email_primary', 'push_primary'],
        variables: ['injuryType', 'severity', 'treatment', 'expectedReturn'],
        isActive: true,
      },
    ];

    defaultTemplates.forEach(template => {
      this.createTemplate(template);
    });
  }

  private setupScheduler(): void {
    // Check for scheduled notifications every minute
    cron.schedule('* * * * *', () => {
      this.processScheduledNotifications();
    });

    // Reset rate limits every hour
    cron.schedule('0 * * * *', () => {
      this.resetRateLimits();
    });
  }

  private processScheduledNotifications(): void {
    const now = Date.now();

    for (const [id, notification] of this.scheduledNotifications.entries()) {
      if (notification.status === 'pending' && notification.scheduledTime <= now) {
        if (this.canSendNow(notification.userId)) {
          this.processNotification(notification);
        }
      }
    }
  }

  private resetRateLimits(): void {
    const now = Date.now();

    for (const channel of this.channels.values()) {
      channel.currentUsage = 0;
      channel.lastReset = now;
    }
  }

  private async loadUserPreferences(): Promise<void> {
    // Load preferences from localStorage or API
    // // console.log('📋 Loading user notification preferences');
  }

  private async startScheduledNotifications(): Promise<void> {
    // // console.log('⏰ Starting scheduled notification processor');
  }
}

// Singleton instance
export const notificationService = new NotificationService();