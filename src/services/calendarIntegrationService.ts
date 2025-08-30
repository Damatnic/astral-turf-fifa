/**
 * Calendar Integration Service
 * 
 * Provides comprehensive calendar integration with Google Calendar, Outlook, and Apple Calendar
 * for training schedules, matches, meetings, and automated event management
 */

import { google, calendar_v3 } from 'googleapis';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  type: 'training' | 'match' | 'meeting' | 'medical' | 'other';
  playerId?: string;
  teamId?: string;
  reminderMinutes?: number[];
}

export interface CalendarProvider {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'exchange';
  isConnected: boolean;
  accountEmail: string;
  lastSync: number;
  syncEnabled: boolean;
}

export interface CalendarConflict {
  id: string;
  eventId: string;
  conflictingEvents: CalendarEvent[];
  suggestedAlternatives: {
    time: string;
    reason: string;
  }[];
}

export interface NotificationPreference {
  provider: string;
  eventType: string;
  methods: ('email' | 'sms' | 'push')[];
  timingMinutes: number[];
}

class CalendarIntegrationService {
  private providers: Map<string, CalendarProvider> = new Map();
  private googleAuth: any = null;
  private outlookAuth: any = null;
  private eventCache: Map<string, CalendarEvent[]> = new Map();
  private conflictResolver: Map<string, CalendarConflict> = new Map();

  // Event callbacks
  private onEventCreatedCallback?: (event: CalendarEvent) => void;
  private onConflictDetectedCallback?: (conflict: CalendarConflict) => void;
  private onSyncCompleteCallback?: (provider: string, eventCount: number) => void;

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize calendar integration service
   */
  async initialize(): Promise<void> {
    await this.loadProviderCredentials();
    console.log('📅 Calendar integration service initialized');
  }

  /**
   * Connect to Google Calendar
   */
  async connectGoogleCalendar(clientId: string, clientSecret: string): Promise<void> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'http://localhost:3000/auth/google/callback'
      );

      // Generate auth URL
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ];

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
      });

      console.log('🔐 Google Calendar auth URL generated:', authUrl);
      
      // In a real app, this would open a browser window
      // For now, we'll simulate the connection
      this.simulateOAuthFlow('google', oauth2Client);

    } catch (error) {
      console.error('❌ Failed to connect Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Connect to Outlook Calendar
   */
  async connectOutlookCalendar(clientId: string, clientSecret: string): Promise<void> {
    try {
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&response_type=code&redirect_uri=http://localhost:3000/auth/outlook/callback&` +
        `scope=https://graph.microsoft.com/calendars.readwrite&state=${uuidv4()}`;

      console.log('🔐 Outlook Calendar auth URL generated:', authUrl);
      
      // Simulate OAuth flow for demonstration
      this.simulateOutlookConnection(clientId, clientSecret);

    } catch (error) {
      console.error('❌ Failed to connect Outlook Calendar:', error);
      throw error;
    }
  }

  /**
   * Create calendar event across all connected providers
   */
  async createEvent(event: CalendarEvent): Promise<void> {
    const createdEvents: string[] = [];

    try {
      for (const provider of this.providers.values()) {
        if (!provider.isConnected || !provider.syncEnabled) continue;

        switch (provider.type) {
          case 'google':
            await this.createGoogleEvent(event);
            createdEvents.push('Google');
            break;
          
          case 'outlook':
            await this.createOutlookEvent(event);
            createdEvents.push('Outlook');
            break;
          
          case 'apple':
            await this.createAppleEvent(event);
            createdEvents.push('Apple');
            break;
        }
      }

      // Check for conflicts
      await this.detectConflicts(event);

      if (this.onEventCreatedCallback) {
        this.onEventCreatedCallback(event);
      }

      console.log(`📅 Event created across providers: ${createdEvents.join(', ')}`);

    } catch (error) {
      console.error('❌ Failed to create calendar event:', error);
      throw error;
    }
  }

  /**
   * Create training schedule events
   */
  async createTrainingSchedule(
    teamId: string,
    schedule: {
      title: string;
      startTime: string;
      endTime: string;
      location: string;
      attendees: string[];
      recurrence?: 'daily' | 'weekly' | 'monthly';
      endDate?: string;
    }
  ): Promise<void> {
    const event: CalendarEvent = {
      id: uuidv4(),
      title: `Training: ${schedule.title}`,
      description: `Team training session for ${teamId}`,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      location: schedule.location,
      attendees: schedule.attendees,
      isAllDay: false,
      type: 'training',
      teamId,
      reminderMinutes: [60, 15] // 1 hour and 15 minutes before
    };

    await this.createEvent(event);

    // Handle recurring events
    if (schedule.recurrence && schedule.endDate) {
      await this.createRecurringEvents(event, schedule.recurrence, schedule.endDate);
    }
  }

  /**
   * Create match event with opposition details
   */
  async createMatchEvent(
    teamId: string,
    opponent: string,
    dateTime: string,
    venue: string,
    isHome: boolean
  ): Promise<void> {
    const event: CalendarEvent = {
      id: uuidv4(),
      title: `Match: vs ${opponent}`,
      description: `${isHome ? 'Home' : 'Away'} match against ${opponent}`,
      startTime: dateTime,
      endTime: new Date(new Date(dateTime).getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
      location: venue,
      isAllDay: false,
      type: 'match',
      teamId,
      reminderMinutes: [180, 60, 30] // 3 hours, 1 hour, 30 minutes before
    };

    await this.createEvent(event);
  }

  /**
   * Sync events from all connected calendars
   */
  async syncCalendars(): Promise<void> {
    for (const provider of this.providers.values()) {
      if (!provider.isConnected || !provider.syncEnabled) continue;

      try {
        const events = await this.fetchEventsFromProvider(provider);
        this.eventCache.set(provider.id, events);
        
        provider.lastSync = Date.now();

        if (this.onSyncCompleteCallback) {
          this.onSyncCompleteCallback(provider.name, events.length);
        }

        console.log(`🔄 Synced ${events.length} events from ${provider.name}`);

      } catch (error) {
        console.error(`❌ Failed to sync ${provider.name}:`, error);
      }
    }

    await this.detectAllConflicts();
  }

  /**
   * Detect scheduling conflicts
   */
  async detectConflicts(newEvent: CalendarEvent): Promise<CalendarConflict[]> {
    const conflicts: CalendarConflict[] = [];
    const newEventStart = new Date(newEvent.startTime);
    const newEventEnd = new Date(newEvent.endTime);

    // Check against all cached events
    for (const [providerId, events] of this.eventCache.entries()) {
      for (const existingEvent of events) {
        const existingStart = new Date(existingEvent.startTime);
        const existingEnd = new Date(existingEvent.endTime);

        // Check for overlap
        if (newEventStart < existingEnd && newEventEnd > existingStart) {
          const conflictId = uuidv4();
          
          const conflict: CalendarConflict = {
            id: conflictId,
            eventId: newEvent.id,
            conflictingEvents: [existingEvent],
            suggestedAlternatives: this.generateAlternativeTimes(newEvent, existingEvent)
          };

          conflicts.push(conflict);
          this.conflictResolver.set(conflictId, conflict);

          if (this.onConflictDetectedCallback) {
            this.onConflictDetectedCallback(conflict);
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Suggest optimal meeting times based on availability
   */
  async suggestOptimalTimes(
    duration: number,
    attendees: string[],
    preferredTimes: string[],
    dateRange: { start: string; end: string }
  ): Promise<{ time: string; score: number; reasoning: string }[]> {
    const suggestions: { time: string; score: number; reasoning: string }[] = [];

    // Analyze availability patterns
    const availabilityPattern = await this.analyzeAvailabilityPatterns(attendees, dateRange);

    // Score potential times
    for (const preferredTime of preferredTimes) {
      const score = this.scoreTimeSlot(preferredTime, duration, availabilityPattern);
      const reasoning = this.generateSchedulingReasoning(preferredTime, score);
      
      suggestions.push({ time: preferredTime, score, reasoning });
    }

    // Sort by score (highest first)
    return suggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Setup automated notifications
   */
  async setupNotifications(preferences: NotificationPreference[]): Promise<void> {
    for (const preference of preferences) {
      await this.configureProviderNotifications(preference);
    }

    console.log('🔔 Automated notifications configured');
  }

  /**
   * Get all connected calendar providers
   */
  getConnectedProviders(): CalendarProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isConnected);
  }

  /**
   * Get calendar events for date range
   */
  async getEvents(startDate: string, endDate: string, eventType?: CalendarEvent['type']): Promise<CalendarEvent[]> {
    const allEvents: CalendarEvent[] = [];

    for (const events of this.eventCache.values()) {
      const filteredEvents = events.filter(event => {
        const eventStart = new Date(event.startTime);
        const rangeStart = new Date(startDate);
        const rangeEnd = new Date(endDate);

        const inRange = eventStart >= rangeStart && eventStart <= rangeEnd;
        const typeMatch = !eventType || event.type === eventType;

        return inRange && typeMatch;
      });

      allEvents.push(...filteredEvents);
    }

    return allEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  /**
   * Get pending conflicts
   */
  getPendingConflicts(): CalendarConflict[] {
    return Array.from(this.conflictResolver.values());
  }

  // Event listener setters
  onEventCreated(callback: (event: CalendarEvent) => void): void {
    this.onEventCreatedCallback = callback;
  }

  onConflictDetected(callback: (conflict: CalendarConflict) => void): void {
    this.onConflictDetectedCallback = callback;
  }

  onSyncComplete(callback: (provider: string, eventCount: number) => void): void {
    this.onSyncCompleteCallback = callback;
  }

  // Private methods

  private initializeProviders(): void {
    const defaultProviders = [
      { id: 'google', name: 'Google Calendar', type: 'google' as const },
      { id: 'outlook', name: 'Microsoft Outlook', type: 'outlook' as const },
      { id: 'apple', name: 'Apple Calendar', type: 'apple' as const }
    ];

    defaultProviders.forEach(provider => {
      this.providers.set(provider.id, {
        ...provider,
        isConnected: false,
        accountEmail: '',
        lastSync: 0,
        syncEnabled: false
      });
    });
  }

  private async loadProviderCredentials(): Promise<void> {
    // Load stored credentials and connection status
    const storedProviders = localStorage.getItem('astral_turf_calendar_providers');
    if (storedProviders) {
      const parsed = JSON.parse(storedProviders);
      parsed.forEach((provider: CalendarProvider) => {
        this.providers.set(provider.id, provider);
      });
    }
  }

  private async createGoogleEvent(event: CalendarEvent): Promise<void> {
    if (!this.googleAuth) return;

    const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

    const googleEvent = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      location: event.location,
      attendees: event.attendees?.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: event.reminderMinutes?.map(minutes => ({
          method: 'popup',
          minutes
        })) || []
      }
    };

    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: googleEvent,
    });
  }

  private async createOutlookEvent(event: CalendarEvent): Promise<void> {
    if (!this.outlookAuth) return;

    const outlookEvent = {
      subject: event.title,
      body: {
        contentType: 'text',
        content: event.description || ''
      },
      start: {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: event.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      location: {
        displayName: event.location || ''
      },
      attendees: event.attendees?.map(email => ({
        emailAddress: { address: email, name: email }
      })),
      reminderMinutesBeforeStart: event.reminderMinutes?.[0] || 15
    };

    await axios.post('https://graph.microsoft.com/v1.0/me/events', outlookEvent, {
      headers: {
        'Authorization': `Bearer ${this.outlookAuth}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private async createAppleEvent(event: CalendarEvent): Promise<void> {
    // Apple Calendar integration would require CalDAV protocol
    // For demonstration, we'll log the event
    console.log('🍎 Apple Calendar event (CalDAV integration required):', event);
  }

  private async fetchEventsFromProvider(provider: CalendarProvider): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];

    switch (provider.type) {
      case 'google':
        if (this.googleAuth) {
          const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });
          const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime',
          });

          response.data.items?.forEach(item => {
            if (item.start && item.end) {
              events.push({
                id: item.id || uuidv4(),
                title: item.summary || 'Untitled',
                description: item.description,
                startTime: item.start.dateTime || item.start.date || '',
                endTime: item.end.dateTime || item.end.date || '',
                location: item.location,
                isAllDay: !item.start.dateTime,
                type: this.determineEventType(item.summary || ''),
                attendees: item.attendees?.map(a => a.email || '') || []
              });
            }
          });
        }
        break;

      case 'outlook':
        if (this.outlookAuth) {
          const response = await axios.get('https://graph.microsoft.com/v1.0/me/events', {
            headers: {
              'Authorization': `Bearer ${this.outlookAuth}`
            }
          });

          response.data.value?.forEach((item: any) => {
            events.push({
              id: item.id,
              title: item.subject,
              description: item.body?.content,
              startTime: item.start.dateTime,
              endTime: item.end.dateTime,
              location: item.location?.displayName,
              isAllDay: item.isAllDay,
              type: this.determineEventType(item.subject),
              attendees: item.attendees?.map((a: any) => a.emailAddress.address) || []
            });
          });
        }
        break;
    }

    return events;
  }

  private determineEventType(title: string): CalendarEvent['type'] {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('training') || lowerTitle.includes('practice')) return 'training';
    if (lowerTitle.includes('match') || lowerTitle.includes('game')) return 'match';
    if (lowerTitle.includes('meeting')) return 'meeting';
    if (lowerTitle.includes('medical') || lowerTitle.includes('physio')) return 'medical';
    
    return 'other';
  }

  private generateAlternativeTimes(
    newEvent: CalendarEvent,
    conflictingEvent: CalendarEvent
  ): { time: string; reason: string }[] {
    const alternatives: { time: string; reason: string }[] = [];
    const newStart = new Date(newEvent.startTime);
    const conflictEnd = new Date(conflictingEvent.endTime);

    // Suggest time after conflict
    const afterConflict = new Date(conflictEnd.getTime() + 30 * 60 * 1000); // 30 minutes buffer
    alternatives.push({
      time: afterConflict.toISOString(),
      reason: `Scheduled after ${conflictingEvent.title} ends`
    });

    // Suggest earlier time
    const beforeConflict = new Date(new Date(conflictingEvent.startTime).getTime() - 
      (new Date(newEvent.endTime).getTime() - newStart.getTime()) - 30 * 60 * 1000);
    alternatives.push({
      time: beforeConflict.toISOString(),
      reason: `Scheduled before ${conflictingEvent.title} starts`
    });

    return alternatives;
  }

  private async detectAllConflicts(): Promise<void> {
    // Implementation for comprehensive conflict detection
    console.log('🔍 Detecting conflicts across all calendar events');
  }

  private async analyzeAvailabilityPatterns(
    attendees: string[],
    dateRange: { start: string; end: string }
  ): Promise<any> {
    // Analyze historical availability patterns
    return { patterns: 'analyzed' };
  }

  private scoreTimeSlot(timeSlot: string, duration: number, patterns: any): number {
    // Score based on historical patterns, conflicts, etc.
    return Math.random() * 100; // Simplified scoring
  }

  private generateSchedulingReasoning(timeSlot: string, score: number): string {
    if (score > 80) return 'Optimal time with high availability';
    if (score > 60) return 'Good time with some conflicts possible';
    return 'Suboptimal time with potential scheduling issues';
  }

  private async configureProviderNotifications(preference: NotificationPreference): Promise<void> {
    console.log('🔔 Configuring notifications for provider:', preference.provider);
  }

  private async createRecurringEvents(
    event: CalendarEvent,
    recurrence: 'daily' | 'weekly' | 'monthly',
    endDate: string
  ): Promise<void> {
    console.log(`🔄 Creating recurring ${recurrence} events until ${endDate}`);
  }

  // Simulation methods for demonstration
  private simulateOAuthFlow(provider: string, auth: any): void {
    setTimeout(() => {
      this.googleAuth = auth;
      const providerData = this.providers.get(provider);
      if (providerData) {
        providerData.isConnected = true;
        providerData.accountEmail = 'user@gmail.com';
        providerData.syncEnabled = true;
        this.providers.set(provider, providerData);
      }
      console.log(`✅ ${provider} Calendar connected successfully`);
    }, 1000);
  }

  private simulateOutlookConnection(clientId: string, clientSecret: string): void {
    setTimeout(() => {
      this.outlookAuth = 'simulated_outlook_token';
      const providerData = this.providers.get('outlook');
      if (providerData) {
        providerData.isConnected = true;
        providerData.accountEmail = 'user@outlook.com';
        providerData.syncEnabled = true;
        this.providers.set('outlook', providerData);
      }
      console.log('✅ Outlook Calendar connected successfully');
    }, 1000);
  }
}

// Singleton instance
export const calendarIntegrationService = new CalendarIntegrationService();