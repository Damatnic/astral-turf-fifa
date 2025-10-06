/**
 * Comprehensive REST and GraphQL API Service
 *
 * Provides public and private APIs for third-party integrations, developer access,
 * and external system connectivity with authentication, rate limiting, and monitoring
 */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

type FetchRequestInit = NonNullable<Parameters<typeof fetch>[1]>;
type FetchResponse = Awaited<ReturnType<typeof fetch>>;
type FetchAbortSignal = FetchRequestInit extends { signal?: infer S } ? S : undefined;
type FetchBody = FetchRequestInit extends { body?: infer B } ? B : undefined;
type AbortEventTarget = {
  addEventListener: (type: 'abort', listener: () => void, options?: { once?: boolean }) => void;
  removeEventListener: (type: 'abort', listener: () => void) => void;
  aborted?: boolean;
};
type NormalizedAbortSignal = FetchAbortSignal extends null | undefined
  ? Exclude<FetchAbortSignal, null | undefined>
  : FetchAbortSignal;
type AbortSignalWithTarget = NormalizedAbortSignal & AbortEventTarget;
type AbortControllerLike = {
  new (): {
    signal: FetchAbortSignal;
    abort: (reason?: unknown) => void;
  };
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
  signal?: FetchAbortSignal | null;
  onUploadProgress?: (progress: number) => void;
  onDownloadProgress?: (progress: number) => void;
}

interface RequestConfig {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: FetchBody | null;
  signal?: FetchAbortSignal | null;
}

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (data: unknown) => unknown | Promise<unknown>;

interface InterceptorOptions {
  persistent?: boolean;
}

interface RequestInterceptorEntry {
  handler: RequestInterceptor;
  persistent: boolean;
}

interface ResponseInterceptorEntry {
  handler: ResponseInterceptor;
  persistent: boolean;
}

interface CachedResponse {
  data: unknown;
  expiresAt: number | null;
}

export interface ApiEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  type: 'rest' | 'graphql';
  description: string;
  parameters: ApiParameter[];
  authentication: 'none' | 'api_key' | 'oauth' | 'jwt';
  rateLimitPerHour: number;
  isPublic: boolean;
  version: string;
  deprecated: boolean;
  examples: ApiExample[];
}

export interface ApiParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: unknown;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

export interface ApiExample {
  name: string;
  description: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: unknown;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: unknown;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  userId: string;
  permissions: string[];
  rateLimitPerHour: number;
  isActive: boolean;
  expiresAt?: number;
  createdAt: number;
  lastUsed?: number;
  usageCount: number;
  allowedOrigins: string[];
}

export interface ApiUsage {
  apiKeyId: string;
  endpoint: string;
  method: string;
  timestamp: number;
  responseTime: number;
  statusCode: number;
  ipAddress: string;
  userAgent: string;
  requestSize: number;
  responseSize: number;
}

export interface WebhookSubscription {
  id: string;
  userId: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  retryAttempts: number;
  maxRetries: number;
  lastDelivery?: number;
  successCount: number;
  failureCount: number;
}

export interface GraphQLSchema {
  types: GraphQLType[];
  queries: GraphQLQuery[];
  mutations: GraphQLMutation[];
  subscriptions: GraphQLSubscription[];
}

export interface GraphQLType {
  name: string;
  description: string;
  fields: GraphQLField[];
  interfaces?: string[];
}

export interface GraphQLField {
  name: string;
  type: string;
  description: string;
  args?: GraphQLArgument[];
  deprecated?: boolean;
  deprecationReason?: string;
}

export interface GraphQLQuery {
  name: string;
  description: string;
  type: string;
  args: GraphQLArgument[];
  resolver: string;
}

export interface GraphQLMutation {
  name: string;
  description: string;
  type: string;
  args: GraphQLArgument[];
  resolver: string;
}

export interface GraphQLSubscription {
  name: string;
  description: string;
  type: string;
  args: GraphQLArgument[];
  resolver: string;
}

export interface GraphQLArgument {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: unknown;
}

class ApiService {
  private endpoints: Map<string, ApiEndpoint> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();
  private usageLog: Map<string, ApiUsage[]> = new Map();
  private webhooks: Map<string, WebhookSubscription> = new Map();
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map();
  private apiClients: Map<string, AxiosInstance> = new Map();
  private graphqlSchema: GraphQLSchema;
  private baseURL = '';
  private requestInterceptors: RequestInterceptorEntry[] = [];
  private responseInterceptors: ResponseInterceptorEntry[] = [];
  private responseCache: Map<string, CachedResponse> = new Map();
  private __debugTimeoutCount = 0;
  private __debugTimeoutValues: Array<number | null> = [];

  // Event callbacks
  private onApiCallCallback?: (usage: ApiUsage) => void;
  private onRateLimitExceededCallback?: (apiKey: string, endpoint: string) => void;
  private onWebhookDeliveryCallback?: (
    webhookId: string,
    success: boolean,
    response?: unknown
  ) => void;

  constructor() {
    this.graphqlSchema = this.initializeGraphQLSchema();
    this.initializeEndpoints();
    this.setupRateLimitReset();
  }

  setBaseURL(url: string): void {
    this.baseURL = (url || '').replace(/\/+$/, '');
  }

  addRequestInterceptor(
    interceptor: RequestInterceptor,
    options: InterceptorOptions = {},
  ): () => void {
    const entry: RequestInterceptorEntry = {
      handler: interceptor,
      persistent: options.persistent ?? false,
    };
    this.requestInterceptors.push(entry);

    return () => {
      this.requestInterceptors = this.requestInterceptors.filter(item => item !== entry);
    };
  }

  addResponseInterceptor(
    interceptor: ResponseInterceptor,
    options: InterceptorOptions = {},
  ): () => void {
    const entry: ResponseInterceptorEntry = {
      handler: interceptor,
      persistent: options.persistent ?? false,
    };
    this.responseInterceptors.push(entry);

    return () => {
      this.responseInterceptors = this.responseInterceptors.filter(item => item !== entry);
    };
  }

  clearCache(): void {
    this.responseCache.clear();
  }

  async get<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.performRequest<T>('GET', endpoint, undefined, options);
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    return this.performRequest<T>('POST', endpoint, data, options);
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    return this.performRequest<T>('PUT', endpoint, data, options);
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    return this.performRequest<T>('PATCH', endpoint, data, options);
  }

  async delete<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.performRequest<T>('DELETE', endpoint, undefined, options);
  }

  private isAbsoluteURL(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  private resolveURL(path: string): string {
    if (this.isAbsoluteURL(path)) {
      return path;
    }

    if (!this.baseURL) {
      return path;
    }

    const trimmedBase = this.baseURL.replace(/\/+$/, '');
    const trimmedPath = path.replace(/^\/+/, '');
    return `${trimmedBase}/${trimmedPath}`;
  }

  private serializeParams(params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  }

  private buildURL(endpoint: string, params?: Record<string, unknown>): string {
    const resolved = this.resolveURL(endpoint);
    const queryString = this.serializeParams(params);

    if (!queryString) {
      return resolved;
    }

    const separator = resolved.includes('?') ? '&' : '?';
    return `${resolved}${separator}${queryString}`;
  }

  private getAbortSignalTarget(
    signal: FetchAbortSignal | null | undefined,
  ): AbortSignalWithTarget | null {
    if (!signal) {
      return null;
    }

    const candidate = signal as unknown as AbortEventTarget;
    const hasHandlers =
      typeof candidate.addEventListener === 'function' &&
      typeof candidate.removeEventListener === 'function';

    return hasHandlers ? (signal as unknown as AbortSignalWithTarget) : null;
  }

  private isAbortSignalAborted(signal: FetchAbortSignal | null | undefined): boolean {
    if (!signal) {
      return false;
    }

    const candidate = signal as unknown as { aborted?: boolean };
    return Boolean(candidate.aborted);
  }

  private createCacheKey(method: HttpMethod, url: string): string {
    return `${method}:${url}`;
  }

  private getCachedResponse<T>(key: string): T | undefined {
    const cached = this.responseCache.get(key);
    if (!cached) {
      return undefined;
    }

    if (cached.expiresAt !== null && cached.expiresAt < Date.now()) {
      this.responseCache.delete(key);
      return undefined;
    }

    return cached.data as T;
  }

  private setCachedResponse(key: string, data: unknown, ttl?: number): void {
    const expiresAt = ttl ? Date.now() + ttl : null;
    this.responseCache.set(key, {
      data,
      expiresAt,
    });
  }

  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    const interceptors = [...this.requestInterceptors];
    let currentConfig = { ...config };

    try {
      for (const entry of interceptors) {
        currentConfig = await entry.handler({ ...currentConfig });
      }
      return currentConfig;
    } finally {
      this.requestInterceptors = this.requestInterceptors.filter(entry => entry.persistent);
    }
  }

  private async applyResponseInterceptors(data: unknown): Promise<unknown> {
    const interceptors = [...this.responseInterceptors];
    let currentData = data;

    try {
      for (const entry of interceptors) {
        currentData = await entry.handler(currentData);
      }
      return currentData;
    } finally {
      this.responseInterceptors = this.responseInterceptors.filter(entry => entry.persistent);
    }
  }

  private async fetchWithTimeout(
    url: string,
    init: FetchRequestInit,
    timeout?: number,
    externalSignal?: FetchAbortSignal | null,
    startedAt?: number,
  ): Promise<FetchResponse> {
    if (timeout !== undefined && typeof timeout !== 'number') {
      throw new Error('Invalid timeout value');
    }

    if (!timeout && !externalSignal) {
      if (timeout !== undefined) {
        throw new Error(`Unexpected falsy timeout: ${timeout}`);
      }
      return fetch(url, init);
    }

    const AbortControllerCtor = (globalThis as typeof globalThis & {
      AbortController?: AbortControllerLike;
    }).AbortController;

    return new Promise<FetchResponse>((resolve, reject) => {
  const originalTimeout = timeout ?? null;
  this.__debugTimeoutValues.push(originalTimeout);
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let externalSubscription: { target: AbortSignalWithTarget; handler: () => void } | null =
        null;
      let timeoutFired = false;
      let externalFired = false;

      const supportsAbortController = Boolean(AbortControllerCtor);
      const controller = supportsAbortController ? new AbortControllerCtor() : null;

      const initWithSignal: FetchRequestInit = {
        ...init,
        ...(controller ? { signal: controller.signal } : {}),
      } as FetchRequestInit;

      if (!controller && externalSignal) {
        initWithSignal.signal = externalSignal ?? undefined;
      }

      const cleanup = () => {
        if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }

        if (externalSubscription) {
          externalSubscription.target.removeEventListener('abort', externalSubscription.handler);
          externalSubscription = null;
        }
      };

      const settle = (value: unknown, isError: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();

        if (isError) {
          const error = value instanceof Error ? value : new Error(String(value));
          reject(error);
        } else {
          resolve(value as FetchResponse);
        }
      };

      const rejectWith = (reason: unknown) => settle(reason, true);
      const resolveWith = (response: FetchResponse) => settle(response, false);

      if (externalSignal) {
        if (this.isAbortSignalAborted(externalSignal)) {
          rejectWith(new Error('Request aborted'));
          return;
        }

        const target = this.getAbortSignalTarget(externalSignal);
        const onExternalAbort = () => {
          externalFired = true;
          rejectWith(new Error('Request aborted'));
          if (controller) {
            controller.abort();
          }
        };

        if (target) {
          target.addEventListener('abort', onExternalAbort, { once: true });
          externalSubscription = { target, handler: onExternalAbort };
        } else if (!controller) {
          rejectWith(new Error('Request aborted'));
          return;
        }
      }

      let effectiveTimeout = timeout;

      if (timeout && typeof startedAt === 'number') {
        const elapsed = Date.now() - startedAt;
        effectiveTimeout = timeout - elapsed;

        if (effectiveTimeout <= 0) {
          this.__debugTimeoutCount += 1;
          timeoutFired = true;
          rejectWith(new Error('timeout'));
          if (controller) {
            controller.abort();
          }
          return;
        }
      }

      if (effectiveTimeout && effectiveTimeout > 0) {
        this.__debugTimeoutCount += 1;
        timer = setTimeout(() => {
          timeoutFired = true;
          rejectWith(new Error('timeout'));
          if (controller) {
            controller.abort();
          }
        }, effectiveTimeout);
      }

      fetch(url, initWithSignal)
        .then(response => {
          resolveWith(response as FetchResponse);
        })
        .catch(error => {
          if (settled) {
            return;
          }

          if (error instanceof Error && error.name === 'AbortError') {
            if (timeoutFired) {
              rejectWith(new Error('timeout'));
              return;
            }

            if (externalFired || this.isAbortSignalAborted(externalSignal)) {
              rejectWith(new Error('Request aborted'));
              return;
            }

            rejectWith(new Error('Request aborted'));
            return;
          }

          rejectWith(error);
        });
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async executeWithRetries<T>(
    operation: () => Promise<T>,
    retries: number,
    retryDelay: number,
  ): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= retries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt === retries) {
          throw error;
        }

        const delayDuration = retryDelay * Math.pow(2, attempt);
        await this.delay(delayDuration);
        attempt += 1;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Request failed');
  }

  private async performRequest<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    const { params, headers = {}, timeout, retries = 0, retryDelay = 500, cache, cacheTTL, signal } =
      options;
    if (options.timeout !== undefined && timeout === undefined) {
      throw new Error('Timeout option lost');
    }

    const url = this.buildURL(endpoint, params);
    const headersWithDefaults: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    let body: FetchBody | null = null;
    const FormDataCtor = (globalThis as typeof globalThis & {
      FormData?: new (...args: unknown[]) => unknown;
    }).FormData;
    const isFormData = Boolean(FormDataCtor && data instanceof FormDataCtor);

    if (method !== 'GET' && data !== undefined && data !== null) {
      if (isFormData) {
        body = data as FetchBody;
        delete headersWithDefaults['Content-Type'];
      } else if (data instanceof URLSearchParams || typeof data === 'string') {
        body = data as FetchBody;
      } else {
        body = JSON.stringify(data) as FetchBody;
      }
    }

    const initialConfig: RequestConfig = {
      url,
      method,
      headers: headersWithDefaults,
      body,
      signal,
    };

    const cacheKey = this.createCacheKey(method, url);

    if (method === 'GET' && cache) {
      const cachedResponse = this.getCachedResponse<T>(cacheKey);
      if (cachedResponse !== undefined) {
        return cachedResponse;
      }
    }

    const attemptRequest = async (): Promise<T> => {
      const attemptStartedAt = Date.now();
      const config = await this.applyRequestInterceptors(initialConfig);
      const requestInit: FetchRequestInit = {
        method: config.method,
        headers: config.headers,
        body: (config.body ?? undefined) as FetchRequestInit['body'],
      };

      const uploadCallback = options.onUploadProgress;
      if (uploadCallback && body) {
        uploadCallback(0);
      }

      const downloadCallback = options.onDownloadProgress;
      if (downloadCallback) {
        downloadCallback(0);
      }

      const normalizedSignal = (config.signal ?? null) as FetchAbortSignal | null;
      const response = await this.fetchWithTimeout(
        config.url,
        requestInit,
        timeout,
        normalizedSignal,
        attemptStartedAt,
      );

      if (!response.ok) {
        let errorPayload: unknown = null;
        try {
          errorPayload = await response.json();
        } catch {
          const text = await response.text().catch(() => undefined);
          errorPayload = text ?? null;
        }

        const httpError = new Error(`HTTP ${response.status}`) as Error & {
          status?: number;
          data?: unknown;
        };
        httpError.status = response.status;
        httpError.data = errorPayload;
        throw httpError;
      }

      let responseData: unknown;
      try {
        responseData = await response.json();
      } catch {
        throw new Error('Invalid JSON');
      }

      if (uploadCallback && body) {
        uploadCallback(100);
      }

      if (downloadCallback) {
        downloadCallback(100);
      }

      const transformedData = await this.applyResponseInterceptors(responseData);

      if (method === 'GET' && cache) {
        const ttl = cacheTTL ?? 60000;
        this.setCachedResponse(cacheKey, transformedData, ttl);
      }

      return transformedData as T;
    };

    return this.executeWithRetries(attemptRequest, retries, retryDelay);
  }

  /**
   * Initialize API service
   */
  async initialize(): Promise<void> {
    await this.loadApiKeys();
    await this.loadWebhookSubscriptions();
    this.setupApiClients();
    // // // // console.log('🔌 API service initialized');
  }

  /**
   * Create new API key
   */
  async createApiKey(
    userId: string,
    name: string,
    permissions: string[] = [],
    rateLimitPerHour: number = 1000,
    allowedOrigins: string[] = ['*'],
  ): Promise<ApiKey> {
    const apiKey: ApiKey = {
      id: uuidv4(),
      name,
      key: this.generateApiKey(),
      userId,
      permissions,
      rateLimitPerHour,
      isActive: true,
      createdAt: Date.now(),
      usageCount: 0,
      allowedOrigins,
    };

    this.apiKeys.set(apiKey.key, apiKey);

    // Save to storage
    await this.saveApiKey(apiKey);

    // // // // console.log(`🔑 API key created: ${name}`);
    return apiKey;
  }

  /**
   * Execute REST API call
   */
  async executeRestCall(
    endpoint: string,
    method: string,
    apiKey: string,
    data?: unknown,
    params?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<{ status: number; data: unknown; headers: Record<string, string> }> {
    const startTime = Date.now();

    try {
      // Validate API key
      const keyData = await this.validateApiKey(apiKey);
      if (!keyData) {
        throw new Error('Invalid API key');
      }

      // Check rate limits
      if (!this.checkRateLimit(apiKey, endpoint)) {
        if (this.onRateLimitExceededCallback) {
          this.onRateLimitExceededCallback(apiKey, endpoint);
        }
        throw new Error('Rate limit exceeded');
      }

      // Find endpoint
      const endpointData = this.findEndpoint(endpoint, method);
      if (!endpointData) {
        throw new Error('Endpoint not found');
      }

      // Check permissions
      if (!this.checkPermissions(keyData, endpointData)) {
        throw new Error('Insufficient permissions');
      }

      // Execute the call
      const response = await this.executeEndpoint(endpointData, data, params, headers);

      // Log usage
      this.logApiUsage({
        apiKeyId: keyData.id,
        endpoint,
        method,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        statusCode: response.status,
        ipAddress: 'localhost', // Would be extracted from request
        userAgent: 'api-client',
        requestSize: JSON.stringify(data || {}).length,
        responseSize: JSON.stringify(response.data).length,
      });

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      // Log failed usage
      this.logApiUsage({
        apiKeyId: 'unknown',
        endpoint,
        method,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        statusCode: 500,
        ipAddress: 'localhost',
        userAgent: 'api-client',
        requestSize: JSON.stringify(data || {}).length,
        responseSize: 0,
      });

      throw error;
    }
  }

  /**
   * Execute GraphQL query/mutation
   */
  async executeGraphQL(
    query: string,
    variables: Record<string, unknown> = {},
    apiKey: string,
  ): Promise<{ data: unknown; errors?: unknown[] }> {
    const startTime = Date.now();

    try {
      // Validate API key
      const keyData = await this.validateApiKey(apiKey);
      if (!keyData) {
        throw new Error('Invalid API key');
      }

      // Check rate limits
      if (!this.checkRateLimit(apiKey, 'graphql')) {
        throw new Error('Rate limit exceeded');
      }

      // Parse and validate query
      const parsedQuery = this.parseGraphQLQuery(query);

      // Execute query
      const result = await this.executeGraphQLQuery(parsedQuery, variables);

      // Log usage
      this.logApiUsage({
        apiKeyId: keyData.id,
        endpoint: 'graphql',
        method: 'POST',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        statusCode: 200,
        ipAddress: 'localhost',
        userAgent: 'graphql-client',
        requestSize: query.length,
        responseSize: JSON.stringify(result).length,
      });

      return result as { data: unknown; errors?: unknown[] };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      return {
        data: null,
        errors: [{ message: error.message, timestamp: Date.now() }],
      } as { data: unknown; errors?: unknown[] };
    }
  }

  /**
   * Subscribe to webhook events
   */
  async createWebhookSubscription(
    userId: string,
    url: string,
    events: string[],
    secret?: string,
  ): Promise<WebhookSubscription> {
    const webhook: WebhookSubscription = {
      id: uuidv4(),
      userId,
      url,
      events,
      isActive: true,
      secret: secret || this.generateWebhookSecret(),
      retryAttempts: 0,
      maxRetries: 3,
      successCount: 0,
      failureCount: 0,
    };

    this.webhooks.set(webhook.id, webhook);

    // Test webhook endpoint
    await this.testWebhookEndpoint(webhook);

    // // // // console.log(`🪝 Webhook subscription created: ${url}`);
    return webhook;
  }

  /**
   * Trigger webhook event
   */
  async triggerWebhookEvent(event: string, data: unknown): Promise<void> {
    const relevantWebhooks = Array.from(this.webhooks.values()).filter(
      webhook => webhook.isActive && webhook.events.includes(event),
    );

    for (const webhook of relevantWebhooks) {
      try {
        await this.deliverWebhook(webhook, event, data);
      } catch (_error) {
        // eslint-disable-next-line no-console
        console.error(`❌ Failed to deliver webhook ${webhook.id}:`, _error);
      }
    }
  }

  /**
   * Get API documentation
   */
  getApiDocumentation(): {
    version: string;
    baseUrl: string;
    authentication: string[];
    endpoints: ApiEndpoint[];
    graphqlSchema: GraphQLSchema;
    examples: ApiExample[];
  } {
    return {
      version: '1.0.0',
      baseUrl: 'https://api.astralturf.com/v1',
      authentication: ['api_key', 'oauth', 'jwt'],
      endpoints: Array.from(this.endpoints.values()),
      graphqlSchema: this.graphqlSchema,
      examples: this.getApiExamples(),
    };
  }

  /**
   * Get API usage analytics
   */
  getUsageAnalytics(
    apiKeyId?: string,
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
  ): {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    avgResponseTime: number;
    topEndpoints: { endpoint: string; count: number }[];
    rateLimitHits: number;
  } {
    const now = Date.now();
    const timeframes = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };

    const cutoff = now - timeframes[timeframe];
    const allUsage: ApiUsage[] = [];

    // Collect usage data
    for (const usage of this.usageLog.values()) {
      const filteredUsage = usage.filter(
        u => u.timestamp >= cutoff && (!apiKeyId || u.apiKeyId === apiKeyId),
      );
      allUsage.push(...filteredUsage);
    }

    const totalCalls = allUsage.length;
    const successfulCalls = allUsage.filter(u => u.statusCode < 400).length;
    const failedCalls = totalCalls - successfulCalls;
    const avgResponseTime =
      totalCalls > 0 ? allUsage.reduce((sum, u) => sum + u.responseTime, 0) / totalCalls : 0;

    // Calculate top endpoints
    const endpointCounts = new Map<string, number>();
    allUsage.forEach(u => {
      const count = endpointCounts.get(u.endpoint) || 0;
      endpointCounts.set(u.endpoint, count + 1);
    });

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      avgResponseTime,
      topEndpoints,
      rateLimitHits: 0, // Would track from rate limiter
    };
  }

  /**
   * Generate SDK code for different languages
   */
  generateSDK(language: 'javascript' | 'python' | 'curl' | 'php'): string {
    switch (language) {
      case 'javascript':
        return this.generateJavaScriptSDK();

      case 'python':
        return this.generatePythonSDK();

      case 'curl':
        return this.generateCurlExamples();

      case 'php':
        return this.generatePHPSDK();

      default:
        return '';
    }
  }

  // Event listener setters
  onApiCall(callback: (usage: ApiUsage) => void): void {
    this.onApiCallCallback = callback;
  }

  onRateLimitExceeded(callback: (apiKey: string, endpoint: string) => void): void {
    this.onRateLimitExceededCallback = callback;
  }

  onWebhookDelivery(
    callback: (webhookId: string, success: boolean, response?: unknown) => void,
  ): void {
    this.onWebhookDeliveryCallback = callback;
  }

  // Private methods

  private initializeEndpoints(): void {
    const endpoints: Omit<ApiEndpoint, 'id'>[] = [
      // Player endpoints
      {
        path: '/players',
        method: 'GET',
        type: 'rest',
        description: 'Get list of players',
        parameters: [
          { name: 'team', type: 'string', required: false, description: 'Filter by team' },
          { name: 'position', type: 'string', required: false, description: 'Filter by position' },
          {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Number of results',
            defaultValue: 20,
          },
        ],
        authentication: 'api_key',
        rateLimitPerHour: 1000,
        isPublic: true,
        version: '1.0',
        deprecated: false,
        examples: [],
      },
      {
        path: '/players/{id}',
        method: 'GET',
        type: 'rest',
        description: 'Get player by ID',
        parameters: [{ name: 'id', type: 'string', required: true, description: 'Player ID' }],
        authentication: 'api_key',
        rateLimitPerHour: 2000,
        isPublic: true,
        version: '1.0',
        deprecated: false,
        examples: [],
      },
      {
        path: '/players',
        method: 'POST',
        type: 'rest',
        description: 'Create new player',
        parameters: [
          { name: 'name', type: 'string', required: true, description: 'Player name' },
          { name: 'age', type: 'number', required: true, description: 'Player age' },
          { name: 'position', type: 'string', required: true, description: 'Player position' },
        ],
        authentication: 'jwt',
        rateLimitPerHour: 100,
        isPublic: false,
        version: '1.0',
        deprecated: false,
        examples: [],
      },

      // Formation endpoints
      {
        path: '/formations',
        method: 'GET',
        type: 'rest',
        description: 'Get list of formations',
        parameters: [
          { name: 'type', type: 'string', required: false, description: 'Formation type' },
        ],
        authentication: 'api_key',
        rateLimitPerHour: 1000,
        isPublic: true,
        version: '1.0',
        deprecated: false,
        examples: [],
      },
      {
        path: '/formations',
        method: 'POST',
        type: 'rest',
        description: 'Create custom formation',
        parameters: [
          { name: 'name', type: 'string', required: true, description: 'Formation name' },
          { name: 'slots', type: 'array', required: true, description: 'Formation slots' },
        ],
        authentication: 'jwt',
        rateLimitPerHour: 50,
        isPublic: false,
        version: '1.0',
        deprecated: false,
        examples: [],
      },

      // Match endpoints
      {
        path: '/matches',
        method: 'GET',
        type: 'rest',
        description: 'Get match history',
        parameters: [
          { name: 'team', type: 'string', required: false, description: 'Filter by team' },
          { name: 'season', type: 'string', required: false, description: 'Filter by season' },
        ],
        authentication: 'api_key',
        rateLimitPerHour: 500,
        isPublic: true,
        version: '1.0',
        deprecated: false,
        examples: [],
      },

      // Statistics endpoints
      {
        path: '/statistics/players/{id}',
        method: 'GET',
        type: 'rest',
        description: 'Get player statistics',
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Player ID' },
          {
            name: 'period',
            type: 'string',
            required: false,
            description: 'Time period',
            defaultValue: 'season',
          },
        ],
        authentication: 'api_key',
        rateLimitPerHour: 2000,
        isPublic: true,
        version: '1.0',
        deprecated: false,
        examples: [],
      },

      // GraphQL endpoint
      {
        path: '/graphql',
        method: 'POST',
        type: 'graphql',
        description: 'GraphQL endpoint for complex queries',
        parameters: [
          { name: 'query', type: 'string', required: true, description: 'GraphQL query' },
          { name: 'variables', type: 'object', required: false, description: 'Query variables' },
        ],
        authentication: 'api_key',
        rateLimitPerHour: 1000,
        isPublic: true,
        version: '1.0',
        deprecated: false,
        examples: [],
      },
    ];

    endpoints.forEach(endpoint => {
      const fullEndpoint: ApiEndpoint = {
        id: uuidv4(),
        ...endpoint,
        examples: this.generateEndpointExamples(endpoint),
      };

      this.endpoints.set(`${endpoint.method}:${endpoint.path}`, fullEndpoint);
    });
  }

  private initializeGraphQLSchema(): GraphQLSchema {
    return {
      types: [
        {
          name: 'Player',
          description: 'Soccer player entity',
          fields: [
            { name: 'id', type: 'ID!', description: 'Unique player identifier' },
            { name: 'name', type: 'String!', description: 'Player full name' },
            { name: 'age', type: 'Int!', description: 'Player age' },
            { name: 'position', type: 'String!', description: 'Player position' },
            { name: 'nationality', type: 'String', description: 'Player nationality' },
            { name: 'attributes', type: 'PlayerAttributes', description: 'Player attributes' },
            { name: 'stats', type: 'PlayerStats', description: 'Player statistics' },
          ],
        },
        {
          name: 'PlayerAttributes',
          description: 'Player skill attributes',
          fields: [
            { name: 'speed', type: 'Int!', description: 'Speed rating' },
            { name: 'passing', type: 'Int!', description: 'Passing rating' },
            { name: 'tackling', type: 'Int!', description: 'Tackling rating' },
            { name: 'shooting', type: 'Int!', description: 'Shooting rating' },
          ],
        },
        {
          name: 'Formation',
          description: 'Team formation',
          fields: [
            { name: 'id', type: 'ID!', description: 'Formation identifier' },
            { name: 'name', type: 'String!', description: 'Formation name' },
            { name: 'slots', type: '[FormationSlot]!', description: 'Formation slots' },
          ],
        },
      ],
      queries: [
        {
          name: 'players',
          description: 'Get list of players',
          type: '[Player]',
          args: [
            { name: 'team', type: 'String', description: 'Filter by team', required: false },
            {
              name: 'position',
              type: 'String',
              description: 'Filter by position',
              required: false,
            },
          ],
          resolver: 'Query.players',
        },
        {
          name: 'player',
          description: 'Get player by ID',
          type: 'Player',
          args: [{ name: 'id', type: 'ID!', description: 'Player ID', required: true }],
          resolver: 'Query.player',
        },
        {
          name: 'formations',
          description: 'Get list of formations',
          type: '[Formation]',
          args: [],
          resolver: 'Query.formations',
        },
      ],
      mutations: [
        {
          name: 'createPlayer',
          description: 'Create new player',
          type: 'Player',
          args: [
            {
              name: 'input',
              type: 'CreatePlayerInput!',
              description: 'Player data',
              required: true,
            },
          ],
          resolver: 'Mutation.createPlayer',
        },
        {
          name: 'updatePlayer',
          description: 'Update existing player',
          type: 'Player',
          args: [
            { name: 'id', type: 'ID!', description: 'Player ID', required: true },
            {
              name: 'input',
              type: 'UpdatePlayerInput!',
              description: 'Updated data',
              required: true,
            },
          ],
          resolver: 'Mutation.updatePlayer',
        },
      ],
      subscriptions: [
        {
          name: 'playerUpdated',
          description: 'Subscribe to player updates',
          type: 'Player',
          args: [
            { name: 'playerId', type: 'ID', description: 'Specific player ID', required: false },
          ],
          resolver: 'Subscription.playerUpdated',
        },
        {
          name: 'matchEvents',
          description: 'Subscribe to live match events',
          type: 'MatchEvent',
          args: [{ name: 'matchId', type: 'ID!', description: 'Match ID', required: true }],
          resolver: 'Subscription.matchEvents',
        },
      ],
    };
  }

  private async executeEndpoint(
    endpoint: ApiEndpoint,
    _data?: unknown,
    _params?: Record<string, unknown>,
    _headers?: Record<string, string>,
  ): Promise<{ status: number; data: unknown; headers: Record<string, string> }> {
    // Simulate endpoint execution
    // In real implementation, this would route to actual handlers

    const mockData = this.generateMockResponse(endpoint);

    return {
      status: 200,
      data: mockData,
      headers: {
        'content-type': 'application/json',
        'x-rate-limit-remaining': '999',
        'x-response-time': '45ms',
      },
    };
  }

  private generateMockResponse(endpoint: ApiEndpoint): unknown {
    switch (endpoint.path) {
      case '/players':
        return {
          players: [
            {
              id: '1',
              name: 'John Smith',
              age: 25,
              position: 'MF',
              nationality: 'England',
              attributes: { speed: 80, passing: 85, tackling: 70, shooting: 75 },
            },
          ],
          pagination: { total: 1, page: 1, limit: 20 },
        };

      case '/players/{id}':
        return {
          id: '1',
          name: 'John Smith',
          age: 25,
          position: 'MF',
          nationality: 'England',
          attributes: { speed: 80, passing: 85, tackling: 70, shooting: 75 },
          stats: { goals: 12, assists: 8, matches: 25 },
        };

      case '/formations':
        return {
          formations: [
            {
              id: '1',
              name: '4-4-2',
              slots: [
                { id: '1', role: 'GK', position: { x: 50, y: 5 } },
                { id: '2', role: 'DF', position: { x: 20, y: 25 } },
              ],
            },
          ],
        };

      default:
        return { message: 'Success', data: {} };
    }
  }

  private generateEndpointExamples(endpoint: Omit<ApiEndpoint, 'id' | 'examples'>): ApiExample[] {
    return [
      {
        name: `${endpoint.method} ${endpoint.path} Example`,
        description: `Example usage of ${endpoint.description}`,
        request: {
          url: `https://api.astralturf.com/v1${endpoint.path}`,
          method: endpoint.method,
          headers: {
            Authorization: 'Bearer your-api-key',
            'Content-Type': 'application/json',
          },
          body: endpoint.method !== 'GET' ? { example: 'data' } : undefined,
        },
        response: {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
          body: this.generateMockResponse({ ...endpoint, id: '', examples: [] }),
        },
      },
    ];
  }

  private validateApiKey(apiKey: string): Promise<ApiKey | null> {
    const keyData = this.apiKeys.get(apiKey);

    if (!keyData || !keyData.isActive) {
      return Promise.resolve(null);
    }

    if (keyData.expiresAt && keyData.expiresAt < Date.now()) {
      keyData.isActive = false;
      return Promise.resolve(null);
    }

    keyData.lastUsed = Date.now();
    keyData.usageCount++;

    return Promise.resolve(keyData);
  }

  private checkRateLimit(apiKey: string, endpoint: string): boolean {
    const key = `${apiKey}:${endpoint}`;
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    let limiter = this.rateLimiter.get(key);

    if (!limiter || limiter.resetTime < hourAgo) {
      limiter = { count: 0, resetTime: now };
      this.rateLimiter.set(key, limiter);
    }

    const apiKeyData = this.apiKeys.get(apiKey);
    const limit = apiKeyData?.rateLimitPerHour || 1000;

    if (limiter.count >= limit) {
      return false;
    }

    limiter.count++;
    return true;
  }

  private checkPermissions(apiKey: ApiKey, endpoint: ApiEndpoint): boolean {
    if (endpoint.isPublic && apiKey.permissions.includes('read')) {
      return true;
    }

    if (!endpoint.isPublic && apiKey.permissions.includes('write')) {
      return true;
    }

    // Check specific endpoint permissions
    const requiredPermission = `${endpoint.method.toLowerCase()}:${endpoint.path}`;
    return apiKey.permissions.includes(requiredPermission) || apiKey.permissions.includes('admin');
  }

  private findEndpoint(path: string, method: string): ApiEndpoint | null {
    return this.endpoints.get(`${method}:${path}`) || null;
  }

  private logApiUsage(usage: ApiUsage): void {
    if (!this.usageLog.has(usage.apiKeyId)) {
      this.usageLog.set(usage.apiKeyId, []);
    }

    this.usageLog.get(usage.apiKeyId)!.push(usage);

    // Keep only last 10,000 entries per API key
    const logs = this.usageLog.get(usage.apiKeyId)!;
    if (logs.length > 10000) {
      this.usageLog.set(usage.apiKeyId, logs.slice(-5000));
    }

    if (this.onApiCallCallback) {
      this.onApiCallCallback(usage);
    }
  }

  private parseGraphQLQuery(query: string): unknown {
    // Simplified GraphQL parsing
    return { query, parsed: true };
  }

  private async executeGraphQLQuery(
    _parsedQuery: unknown,
    _variables: Record<string, unknown>,
  ): Promise<unknown> {
    // Simulate GraphQL execution
    return {
      data: {
        players: [
          {
            id: '1',
            name: 'John Smith',
            age: 25,
            position: 'MF',
          },
        ],
      },
    };
  }

  private async deliverWebhook(
    webhook: WebhookSubscription,
    event: string,
    data: unknown,
  ): Promise<void> {
    const payload = {
      event,
      data,
      timestamp: Date.now(),
      webhook_id: webhook.id,
    };

    const signature = this.generateWebhookSignature(payload, webhook.secret);

    try {
      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'User-Agent': 'AstralTurf-Webhooks/1.0',
        },
        timeout: 10000,
      });

      webhook.successCount++;
      webhook.lastDelivery = Date.now();
      webhook.retryAttempts = 0;

      if (this.onWebhookDeliveryCallback) {
        this.onWebhookDeliveryCallback(webhook.id, true, response.data);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      webhook.failureCount++;
      webhook.retryAttempts++;

      if (webhook.retryAttempts < webhook.maxRetries) {
        // Schedule retry with exponential backoff
        setTimeout(
          () => {
            this.deliverWebhook(webhook, event, data);
          },
          Math.pow(2, webhook.retryAttempts) * 1000,
        );
      } else {
        webhook.isActive = false;
      }

      if (this.onWebhookDeliveryCallback) {
        this.onWebhookDeliveryCallback(webhook.id, false, error.message);
      }
    }
  }

  private async testWebhookEndpoint(webhook: WebhookSubscription): Promise<void> {
    const testPayload = {
      event: 'webhook.test',
      data: { message: 'This is a test webhook delivery' },
      timestamp: Date.now(),
      webhook_id: webhook.id,
    };

    try {
      await axios.post(webhook.url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': this.generateWebhookSignature(testPayload, webhook.secret),
          'User-Agent': 'AstralTurf-Webhooks/1.0',
        },
        timeout: 5000,
      });

      // // // // console.log(`✅ Webhook endpoint test successful: ${webhook.url}`);
  } catch {
      // // // // console.warn(`⚠️ Webhook endpoint test failed: ${webhook.url}`);
      // Don't disable webhook, just log the warning
    }
  }

  private generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'at_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateWebhookSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateWebhookSignature(payload: unknown, secret: string): string {
    // In real implementation, would use HMAC-SHA256
    return `sha256=${Buffer.from(JSON.stringify(payload) + secret).toString('base64')}`;
  }

  private getApiExamples(): ApiExample[] {
    const examples: ApiExample[] = [];

    for (const endpoint of this.endpoints.values()) {
      examples.push(...endpoint.examples);
    }

    return examples;
  }

  private generateJavaScriptSDK(): string {
    return `
// Astral Turf API JavaScript SDK
class AstralTurfAPI {
  constructor(apiKey, baseUrl = 'https://api.astralturf.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    const headers = {
      'Authorization': \`Bearer \${this.apiKey}\`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    return response.json();
  }

  // Players
  async getPlayers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(\`/players?\${params}\`);
  }

  async getPlayer(id) {
    return this.request(\`/players/\${id}\`);
  }

  async createPlayer(playerData) {
    return this.request('/players', {
      method: 'POST',
      body: playerData
    });
  }

  // Formations
  async getFormations() {
    return this.request('/formations');
  }

  // GraphQL
  async graphql(query, variables = {}) {
    return this.request('/graphql', {
      method: 'POST',
      body: { query, variables }
    });
  }
}

// Usage
const api = new AstralTurfAPI('your-api-key');
const players = await api.getPlayers({ team: 'home' });
`;
  }

  private generatePythonSDK(): string {
    return `
# Astral Turf API Python SDK
import requests
import json

class AstralTurfAPI:
    def __init__(self, api_key, base_url='https://api.astralturf.com/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })

    def request(self, endpoint, method='GET', data=None):
        url = f'{self.base_url}{endpoint}'
        response = self.session.request(method, url, json=data)
        response.raise_for_status()
        return response.json()

    # Players
    def get_players(self, **filters):
        params = '&'.join([f'{k}={v}' for k, v in filters.items()])
        return self.request(f'/players?{params}')

    def get_player(self, player_id):
        return self.request(f'/players/{player_id}')

    def create_player(self, player_data):
        return self.request('/players', method='POST', data=player_data)

    # Formations
    def get_formations(self):
        return self.request('/formations')

    # GraphQL
    def graphql(self, query, variables=None):
        return self.request('/graphql', method='POST', data={
            'query': query,
            'variables': variables or {}
        })

# Usage
api = AstralTurfAPI('your-api-key')
players = api.get_players(team='home')
`;
  }

  private generateCurlExamples(): string {
    return `
# Astral Turf API cURL Examples

# Get players
curl -X GET "https://api.astralturf.com/v1/players" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json"

# Get specific player
curl -X GET "https://api.astralturf.com/v1/players/1" \\
  -H "Authorization: Bearer your-api-key"

# Create player
curl -X POST "https://api.astralturf.com/v1/players" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Smith",
    "age": 25,
    "position": "MF"
  }'

# GraphQL query
curl -X POST "https://api.astralturf.com/v1/graphql" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "query { players { id name age position } }"
  }'
`;
  }

  private generatePHPSDK(): string {
    return `
<?php
// Astral Turf API PHP SDK
class AstralTurfAPI {
    private $apiKey;
    private $baseUrl;

    public function __construct($apiKey, $baseUrl = 'https://api.astralturf.com/v1') {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }

    private function request($endpoint, $method = 'GET', $data = null) {
        $url = $this->baseUrl . $endpoint;
        
        $headers = [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }

    // Players
    public function getPlayers($filters = []) {
        $params = http_build_query($filters);
        return $this->request("/players?$params");
    }

    public function getPlayer($id) {
        return $this->request("/players/$id");
    }

    public function createPlayer($playerData) {
        return $this->request('/players', 'POST', $playerData);
    }

    // Formations
    public function getFormations() {
        return $this->request('/formations');
    }

    // GraphQL
    public function graphql($query, $variables = []) {
        return $this->request('/graphql', 'POST', [
            'query' => $query,
            'variables' => $variables
        ]);
    }
}

// Usage
$api = new AstralTurfAPI('your-api-key');
$players = $api->getPlayers(['team' => 'home']);
?>
`;
  }

  private setupApiClients(): void {
    // Setup internal API clients for different services
    const services = ['auth', 'players', 'formations', 'matches'];

    services.forEach(service => {
      const client = axios.create({
        baseURL: `http://localhost:3000/api/${service}`,
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.apiClients.set(service, client);
    });
  }

  private setupRateLimitReset(): void {
    // Reset rate limits every hour
    setInterval(
      () => {
        const now = Date.now();
        const hourAgo = now - 60 * 60 * 1000;

  for (const [, limiter] of this.rateLimiter.entries()) {
          if (limiter.resetTime < hourAgo) {
            limiter.count = 0;
            limiter.resetTime = now;
          }
        }
      },
      60 * 60 * 1000,
    );
  }

  private async loadApiKeys(): Promise<void> {
    // Load API keys from storage
    // // // // console.log('🔑 Loading API keys');
  }

  private async saveApiKey(_apiKey: ApiKey): Promise<void> {
    // Save API key to storage
    // // // // console.log(`💾 API key saved: ${apiKey.name}`);
  }

  private async loadWebhookSubscriptions(): Promise<void> {
    // Load webhook subscriptions from storage
    // // // // console.log('🪝 Loading webhook subscriptions');
  }
}

// Singleton instance
export const apiService = new ApiService();
