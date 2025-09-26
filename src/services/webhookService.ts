/**
 * Webhook System for Real-Time Notifications
 *
 * Provides comprehensive webhook infrastructure for real-time event notifications,
 * external system integration, and automated workflow triggers
 */

import axios, { type AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto-js';

export interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  timestamp: number;
  data: Record<string, unknown>;
  metadata: {
    version: string;
    retry_count: number;
    correlation_id?: string;
    user_id?: string;
    team_id?: string;
  };
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  userId: string;
  events: string[];
  isActive: boolean;
  retryPolicy: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
  filterRules?: WebhookFilter[];
  transformRules?: WebhookTransform[];
  rateLimit: {
    requestsPerMinute: number;
    burstLimit: number;
  };
  headers: Record<string, string>;
  createdAt: number;
  lastDelivery?: number;
  stats: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    avgResponseTime: number;
  };
}

export interface WebhookFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: unknown;
}

export interface WebhookTransform {
  type: 'rename_field' | 'add_field' | 'remove_field' | 'format_value' | 'custom_script';
  config: Record<string, unknown>;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  url: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  httpStatus?: number;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  requestHeaders: Record<string, string>;
  requestBody: string;
  sentAt: number;
  responseTime?: number;
  error?: string;
  retryCount: number;
  nextRetryAt?: number;
}

export interface WebhookReceiver {
  id: string;
  name: string;
  path: string;
  secret: string;
  allowedSources: string[];
  isActive: boolean;
  handler: (event: WebhookEvent) => Promise<void>;
  validation: {
    requireSignature: boolean;
    allowedEventTypes: string[];
    requiredFields: string[];
  };
  stats: {
    totalReceived: number;
    successfulProcessed: number;
    failedProcessed: number;
  };
}

class WebhookService {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private receivers: Map<string, WebhookReceiver> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private rateLimiters: Map<string, { count: number; resetTime: number; burst: number }> = new Map();
  private httpClient: AxiosInstance;

  // Event callbacks
  private onWebhookDeliveredCallback?: (delivery: WebhookDelivery) => void;
  private onWebhookFailedCallback?: (delivery: WebhookDelivery, error: string) => void;
  private onWebhookReceivedCallback?: (event: WebhookEvent) => void;

  constructor() {
    this.httpClient = axios.create({
      timeout: 30000,
      maxRedirects: 3,
      validateStatus: (status) => status < 500, // Retry on 5xx errors
    });

    this.setupHttpClientInterceptors();
    this.startEventProcessor();
    this.startRetryProcessor();
  }

  /**
   * Initialize webhook service
   */
  async initialize(): Promise<void> {
    await this.loadWebhookEndpoints();
    await this.loadWebhookReceivers();
    this.setupEventHandlers();
    // // console.log('🪝 Webhook service initialized');
  }

  /**
   * Create new webhook endpoint
   */
  async createWebhookEndpoint(config: {
    name: string;
    url: string;
    userId: string;
    events: string[];
    secret?: string;
    retryPolicy?: Partial<WebhookEndpoint['retryPolicy']>;
    filterRules?: WebhookFilter[];
    transformRules?: WebhookTransform[];
    headers?: Record<string, string>;
  }): Promise<WebhookEndpoint> {
    const endpoint: WebhookEndpoint = {
      id: uuidv4(),
      name: config.name,
      url: config.url,
      secret: config.secret || this.generateWebhookSecret(),
      userId: config.userId,
      events: config.events,
      isActive: true,
      retryPolicy: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        ...config.retryPolicy,
      },
      filterRules: config.filterRules || [],
      transformRules: config.transformRules || [],
      rateLimit: {
        requestsPerMinute: 60,
        burstLimit: 10,
      },
      headers: {
        'User-Agent': 'AstralTurf-Webhooks/1.0',
        'Content-Type': 'application/json',
        ...config.headers,
      },
      createdAt: Date.now(),
      stats: {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        avgResponseTime: 0,
      },
    };

    this.endpoints.set(endpoint.id, endpoint);

    // Test the endpoint
    await this.testWebhookEndpoint(endpoint);

    // Save to storage
    await this.saveWebhookEndpoint(endpoint);

    // // console.log(`🆕 Webhook endpoint created: ${config.name}`);
    return endpoint;
  }

  /**
   * Create webhook receiver for incoming webhooks
   */
  async createWebhookReceiver(config: {
    name: string;
    path: string;
    secret?: string;
    allowedSources?: string[];
    handler: (event: WebhookEvent) => Promise<void>;
    validation?: Partial<WebhookReceiver['validation']>;
  }): Promise<WebhookReceiver> {
    const receiver: WebhookReceiver = {
      id: uuidv4(),
      name: config.name,
      path: config.path,
      secret: config.secret || this.generateWebhookSecret(),
      allowedSources: config.allowedSources || ['*'],
      isActive: true,
      handler: config.handler,
      validation: {
        requireSignature: true,
        allowedEventTypes: ['*'],
        requiredFields: ['type', 'data'],
        ...config.validation,
      },
      stats: {
        totalReceived: 0,
        successfulProcessed: 0,
        failedProcessed: 0,
      },
    };

    this.receivers.set(receiver.id, receiver);
    await this.saveWebhookReceiver(receiver);

    // // console.log(`📥 Webhook receiver created: ${config.name}`);
    return receiver;
  }

  /**
   * Emit webhook event to all subscribed endpoints
   */
  async emitEvent(
    type: string,
    data: Record<string, unknown>,
    options: {
      source?: string;
      userId?: string;
      teamId?: string;
      correlationId?: string;
      priority?: 'low' | 'normal' | 'high';
    } = {},
  ): Promise<void> {
    const event: WebhookEvent = {
      id: uuidv4(),
      type,
      source: options.source || 'astral_turf',
      timestamp: Date.now(),
      data,
      metadata: {
        version: '1.0',
        retry_count: 0,
        correlation_id: options.correlationId,
        user_id: options.userId,
        team_id: options.teamId,
      },
    };

    // Add to event queue
    if (options.priority === 'high') {
      this.eventQueue.unshift(event);
    } else {
      this.eventQueue.push(event);
    }

    // // console.log(`📡 Webhook event emitted: ${type}`);
  }

  /**
   * Process incoming webhook from external source
   */
  async processIncomingWebhook(
    path: string,
    headers: Record<string, string>,
    body: string,
    signature?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find matching receiver
      const receiver = Array.from(this.receivers.values())
        .find(r => r.isActive && r.path === path);

      if (!receiver) {
        return { success: false, message: 'Webhook receiver not found' };
      }

      // Validate signature if required
      if (receiver.validation.requireSignature && signature) {
        if (!this.validateWebhookSignature(body, signature, receiver.secret)) {
          receiver.stats.failedProcessed++;
          return { success: false, message: 'Invalid signature' };
        }
      }

      // Parse event data
      const eventData = JSON.parse(body);

      // Validate event structure
      if (!this.validateEventStructure(eventData, receiver.validation)) {
        receiver.stats.failedProcessed++;
        return { success: false, message: 'Invalid event structure' };
      }

      // Create webhook event
      const event: WebhookEvent = {
        id: eventData.id || uuidv4(),
        type: eventData.type,
        source: eventData.source || 'external',
        timestamp: eventData.timestamp || Date.now(),
        data: eventData.data,
        metadata: {
          version: eventData.metadata?.version || '1.0',
          retry_count: 0,
          ...eventData.metadata,
        },
      };

      // Process the event
      await receiver.handler(event);

      // Update stats
      receiver.stats.totalReceived++;
      receiver.stats.successfulProcessed++;

      if (this.onWebhookReceivedCallback) {
        this.onWebhookReceivedCallback(event);
      }

      // // console.log(`📨 Incoming webhook processed: ${event.type}`);
      return { success: true, message: 'Webhook processed successfully' };

    } catch (_error) {
      console.error('❌ Failed to process incoming webhook:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get webhook endpoint statistics
   */
  getEndpointStats(endpointId: string): WebhookEndpoint['stats'] | null {
    const endpoint = this.endpoints.get(endpointId);
    return endpoint?.stats || null;
  }

  /**
   * Get webhook delivery history
   */
  getDeliveryHistory(
    endpointId?: string,
    limit: number = 100,
  ): WebhookDelivery[] {
    let deliveries = Array.from(this.deliveries.values());

    if (endpointId) {
      deliveries = deliveries.filter(d => d.webhookId === endpointId);
    }

    return deliveries
      .sort((a, b) => b.sentAt - a.sentAt)
      .slice(0, limit);
  }

  /**
   * Retry failed webhook delivery
   */
  async retryDelivery(deliveryId: string): Promise<void> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery || delivery.status === 'success') {
      return;
    }

    const endpoint = this.endpoints.get(delivery.webhookId);
    if (!endpoint) {
      return;
    }

    delivery.status = 'retrying';
    delivery.retryCount++;

    try {
      const response = await this.deliverWebhook(endpoint, JSON.parse(delivery.requestBody));

      delivery.status = 'success';
      delivery.httpStatus = response.status;
      delivery.responseBody = JSON.stringify(response.data);
      delivery.responseTime = Date.now() - delivery.sentAt;

      endpoint.stats.successfulDeliveries++;

      // // console.log(`✅ Webhook delivery retry successful: ${deliveryId}`);

    } catch (_error) {
      delivery.status = 'failed';
      delivery.error = error.message;
      delivery.nextRetryAt = Date.now() + (delivery.retryCount * 60000); // 1 minute intervals

      endpoint.stats.failedDeliveries++;

      console.error(`❌ Webhook delivery retry failed: ${deliveryId}`);
    }
  }

  /**
   * Pause webhook endpoint
   */
  async pauseEndpoint(endpointId: string): Promise<void> {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      endpoint.isActive = false;
      await this.saveWebhookEndpoint(endpoint);
      // // console.log(`⏸️ Webhook endpoint paused: ${endpoint.name}`);
    }
  }

  /**
   * Resume webhook endpoint
   */
  async resumeEndpoint(endpointId: string): Promise<void> {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      endpoint.isActive = true;
      await this.saveWebhookEndpoint(endpoint);
      // // console.log(`▶️ Webhook endpoint resumed: ${endpoint.name}`);
    }
  }

  // Event listener setters
  onWebhookDelivered(callback: (delivery: WebhookDelivery) => void): void {
    this.onWebhookDeliveredCallback = callback;
  }

  onWebhookFailed(callback: (delivery: WebhookDelivery, error: string) => void): void {
    this.onWebhookFailedCallback = callback;
  }

  onWebhookReceived(callback: (event: WebhookEvent) => void): void {
    this.onWebhookReceivedCallback = callback;
  }

  // Private methods

  private startEventProcessor(): void {
    // Process webhook events every second
    setInterval(() => {
      this.processEventQueue();
    }, 1000);
  }

  private startRetryProcessor(): void {
    // Process retries every 30 seconds
    setInterval(() => {
      this.processRetries();
    }, 30000);
  }

  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) {return;}

    const event = this.eventQueue.shift()!;

    // Find matching endpoints
    const matchingEndpoints = Array.from(this.endpoints.values())
      .filter(endpoint =>
        endpoint.isActive &&
        endpoint.events.includes(event.type) &&
        this.passesFilters(event, endpoint.filterRules || []),
      );

    // Deliver to each matching endpoint
    for (const endpoint of matchingEndpoints) {
      try {
        await this.deliverToEndpoint(endpoint, event);
      } catch (_error) {
        console.error(`❌ Failed to deliver to endpoint ${endpoint.id}:`, error);
      }
    }
  }

  private async processRetries(): Promise<void> {
    const now = Date.now();

    const retriableDeliveries = Array.from(this.deliveries.values())
      .filter(d =>
        d.status === 'failed' &&
        d.nextRetryAt &&
        d.nextRetryAt <= now &&
        d.retryCount < 5, // Max retry limit
      );

    for (const delivery of retriableDeliveries) {
      await this.retryDelivery(delivery.id);
    }
  }

  private async deliverToEndpoint(endpoint: WebhookEndpoint, event: WebhookEvent): Promise<void> {
    // Check rate limits
    if (!this.checkRateLimit(endpoint)) {
      // // console.warn(`⚠️ Rate limit exceeded for endpoint: ${endpoint.name}`);
      return;
    }

    // Apply transforms
    const transformedEvent = this.applyTransforms(event, endpoint.transformRules || []);

    // Create delivery record
    const delivery: WebhookDelivery = {
      id: uuidv4(),
      webhookId: endpoint.id,
      eventId: event.id,
      url: endpoint.url,
      status: 'pending',
      requestHeaders: {
        ...endpoint.headers,
        'X-Webhook-Signature': this.generateSignature(transformedEvent, endpoint.secret),
        'X-Webhook-ID': event.id,
        'X-Webhook-Timestamp': event.timestamp.toString(),
      },
      requestBody: JSON.stringify(transformedEvent),
      sentAt: Date.now(),
      retryCount: 0,
    };

    this.deliveries.set(delivery.id, delivery);
    endpoint.stats.totalDeliveries++;

    try {
      const response = await this.deliverWebhook(endpoint, transformedEvent);

      delivery.status = 'success';
      delivery.httpStatus = response.status;
      delivery.responseBody = JSON.stringify(response.data);
      delivery.responseHeaders = response.headers;
      delivery.responseTime = Date.now() - delivery.sentAt;

      endpoint.stats.successfulDeliveries++;
      endpoint.stats.avgResponseTime = this.updateAvgResponseTime(endpoint, delivery.responseTime);
      endpoint.lastDelivery = Date.now();

      if (this.onWebhookDeliveredCallback) {
        this.onWebhookDeliveredCallback(delivery);
      }

      // // console.log(`✅ Webhook delivered successfully: ${endpoint.name}`);

    } catch (_error) {
      delivery.status = 'failed';
      delivery.error = error.message;
      delivery.httpStatus = error.response?.status;
      delivery.responseBody = error.response?.data ? JSON.stringify(error.response.data) : undefined;

      // Schedule retry
      if (delivery.retryCount < endpoint.retryPolicy.maxAttempts) {
        const delay = Math.min(
          endpoint.retryPolicy.initialDelay * Math.pow(endpoint.retryPolicy.backoffMultiplier, delivery.retryCount),
          endpoint.retryPolicy.maxDelay,
        );
        delivery.nextRetryAt = Date.now() + delay;
      }

      endpoint.stats.failedDeliveries++;

      if (this.onWebhookFailedCallback) {
        this.onWebhookFailedCallback(delivery, error.message);
      }

      console.error(`❌ Webhook delivery failed: ${endpoint.name}`, error.message);
    }
  }

  private async deliverWebhook(endpoint: WebhookEndpoint, event: WebhookEvent): Promise<unknown> {
    const signature = this.generateSignature(event, endpoint.secret);

    return this.httpClient.post(endpoint.url, event, {
      headers: {
        ...endpoint.headers,
        'X-Webhook-Signature': signature,
        'X-Webhook-ID': event.id,
        'X-Webhook-Timestamp': event.timestamp.toString(),
      },
    });
  }

  private async testWebhookEndpoint(endpoint: WebhookEndpoint): Promise<void> {
    const testEvent: WebhookEvent = {
      id: uuidv4(),
      type: 'webhook.test',
      source: 'astral_turf_test',
      timestamp: Date.now(),
      data: {
        message: 'This is a test webhook from Astral Turf',
        endpoint_id: endpoint.id,
        endpoint_name: endpoint.name,
      },
      metadata: {
        version: '1.0',
        retry_count: 0,
        test: true,
      },
    };

    try {
      await this.deliverWebhook(endpoint, testEvent);
      // // console.log(`✅ Webhook endpoint test successful: ${endpoint.name}`);
    } catch (_error) {
      // // console.warn(`⚠️ Webhook endpoint test failed: ${endpoint.name}`, error.message);
      // Don't disable the endpoint, just warn
    }
  }

  private passesFilters(event: WebhookEvent, filters: WebhookFilter[]): boolean {
    return filters.every(filter => {
      const value = this.getNestedValue(event, filter.field);

      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'not_equals':
          return value !== filter.value;
        case 'contains':
          return String(value).includes(String(filter.value));
        case 'starts_with':
          return String(value).startsWith(String(filter.value));
        case 'ends_with':
          return String(value).endsWith(String(filter.value));
        case 'greater_than':
          return Number(value) > Number(filter.value);
        case 'less_than':
          return Number(value) < Number(filter.value);
        default:
          return true;
      }
    });
  }

  private applyTransforms(event: WebhookEvent, transforms: WebhookTransform[]): WebhookEvent {
    const transformedEvent = JSON.parse(JSON.stringify(event));

    transforms.forEach(transform => {
      switch (transform.type) {
        case 'rename_field':
          this.renameField(transformedEvent, transform.config.from, transform.config.to);
          break;

        case 'add_field':
          this.setNestedValue(transformedEvent, transform.config.field, transform.config.value);
          break;

        case 'remove_field':
          this.removeField(transformedEvent, transform.config.field);
          break;

        case 'format_value': {
          const currentValue = this.getNestedValue(transformedEvent, transform.config.field);
          const formattedValue = this.formatValue(currentValue, transform.config.format);
          this.setNestedValue(transformedEvent, transform.config.field, formattedValue);
          break;
        }
      }
    });

    return transformedEvent;
  }

  private checkRateLimit(endpoint: WebhookEndpoint): boolean {
    const key = endpoint.id;
    const now = Date.now();
    const minuteAgo = now - 60000;

    let limiter = this.rateLimiters.get(key);

    if (!limiter || limiter.resetTime < minuteAgo) {
      limiter = {
        count: 0,
        resetTime: now,
        burst: 0,
      };
      this.rateLimiters.set(key, limiter);
    }

    // Check burst limit (short-term)
    if (limiter.burst >= endpoint.rateLimit.burstLimit) {
      return false;
    }

    // Check rate limit (per minute)
    if (limiter.count >= endpoint.rateLimit.requestsPerMinute) {
      return false;
    }

    limiter.count++;
    limiter.burst++;

    // Reset burst counter after 10 seconds
    setTimeout(() => {
      if (limiter) {limiter.burst = Math.max(0, limiter.burst - 1);}
    }, 10000);

    return true;
  }

  private generateSignature(event: WebhookEvent, secret: string): string {
    const payload = JSON.stringify(event);
    if (typeof crypto !== 'undefined') {
      return crypto.HmacSHA256(payload, secret).toString(crypto.enc.Hex);
    }
    return 'signature-unavailable';
  }

  private validateWebhookSignature(body: string, signature: string, secret: string): boolean {
    if (typeof crypto === 'undefined') {
      return false;
    }
    const expectedSignature = crypto.HmacSHA256(body, secret).toString(crypto.enc.Hex);
    return signature === expectedSignature || signature === `sha256=${expectedSignature}`;
  }

  private validateEventStructure(event: unknown, validation: WebhookReceiver['validation']): boolean {
    // Check required fields
    for (const field of validation.requiredFields) {
      if (!this.hasNestedField(event, field)) {
        return false;
      }
    }

    // Check allowed event types
    if (validation.allowedEventTypes.length > 0 && !validation.allowedEventTypes.includes('*')) {
      if (!validation.allowedEventTypes.includes(event.type)) {
        return false;
      }
    }

    return true;
  }

  private generateWebhookSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private updateAvgResponseTime(endpoint: WebhookEndpoint, newResponseTime: number): number {
    const totalSuccessful = endpoint.stats.successfulDeliveries;
    if (totalSuccessful === 1) {
      return newResponseTime;
    }

    const currentAvg = endpoint.stats.avgResponseTime;
    return ((currentAvg * (totalSuccessful - 1)) + newResponseTime) / totalSuccessful;
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: unknown, path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) {current[key] = {};}
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private hasNestedField(obj: unknown, path: string): boolean {
    return this.getNestedValue(obj, path) !== undefined;
  }

  private removeField(obj: unknown, path: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => current?.[key], obj);
    if (target) {delete target[lastKey];}
  }

  private renameField(obj: unknown, fromPath: string, toPath: string): void {
    const value = this.getNestedValue(obj, fromPath);
    if (value !== undefined) {
      this.setNestedValue(obj, toPath, value);
      this.removeField(obj, fromPath);
    }
  }

  private formatValue(value: unknown, format: string): unknown {
    switch (format) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'iso_date':
        return new Date(value).toISOString();
      case 'unix_timestamp':
        return Math.floor(new Date(value).getTime() / 1000);
      default:
        return value;
    }
  }

  private setupHttpClientInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata?.startTime;
        // // console.log(`📈 Webhook request completed in ${duration}ms`);
        return response;
      },
      (error) => {
        const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
        // // console.log(`📉 Webhook request failed after ${duration}ms`);
        return Promise.reject(error);
      },
    );
  }

  private setupEventHandlers(): void {
    // Setup common webhook event handlers
    this.createWebhookReceiver({
      name: 'Player Update Handler',
      path: '/webhooks/player-update',
      handler: async (event) => {
        // // console.log(`👤 Player update received: ${JSON.stringify(event.data)}`);
        // Handle player updates from external systems
      },
      validation: {
        allowedEventTypes: ['player.created', 'player.updated', 'player.deleted'],
        requiredFields: ['data.player_id', 'data.changes'],
      },
    });

    this.createWebhookReceiver({
      name: 'Match Result Handler',
      path: '/webhooks/match-result',
      handler: async (event) => {
        // // console.log(`⚽ Match result received: ${JSON.stringify(event.data)}`);
        // Handle match results from external systems
      },
      validation: {
        allowedEventTypes: ['match.completed', 'match.updated'],
        requiredFields: ['data.match_id', 'data.score'],
      },
    });
  }

  private async loadWebhookEndpoints(): Promise<void> {
    // Load webhook endpoints from storage
    // // console.log('📂 Loading webhook endpoints');
  }

  private async saveWebhookEndpoint(endpoint: WebhookEndpoint): Promise<void> {
    // Save webhook endpoint to storage
    // // console.log(`💾 Webhook endpoint saved: ${endpoint.name}`);
  }

  private async loadWebhookReceivers(): Promise<void> {
    // Load webhook receivers from storage
    // // console.log('📂 Loading webhook receivers');
  }

  private async saveWebhookReceiver(receiver: WebhookReceiver): Promise<void> {
    // Save webhook receiver to storage
    // // console.log(`💾 Webhook receiver saved: ${receiver.name}`);
  }
}

// Singleton instance
export const webhookService = new WebhookService();