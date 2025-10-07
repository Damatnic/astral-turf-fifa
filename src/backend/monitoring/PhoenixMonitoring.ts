/**
 * Phoenix Monitoring & Observability System - Enterprise-grade monitoring suite
 *
 * Features:
 * - Real-time application performance monitoring (APM)
 * - Distributed tracing with correlation IDs
 * - Custom metrics collection and aggregation
 * - Structured logging with multiple outputs
 * - Health checks and uptime monitoring
 * - Error tracking and alerting
 * - Performance benchmarking
 * - Resource usage monitoring
 * - SLA and SLO tracking
 * - Business metrics dashboards
 */

import { EventEmitter } from 'events';
import os from 'os';
import process from 'process';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { phoenixPool } from '../database/PhoenixDatabasePool';

export interface MetricPoint {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, string>;
  logs: TraceLog[];
  status: 'ok' | 'error' | 'timeout';
  error?: Error;
}

export interface TraceLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  fields?: Record<string, any>;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
}

export interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  condition: string;
  threshold: number;
  currentValue: number;
  status: 'firing' | 'resolved';
  triggerTime: Date;
  resolveTime?: Date;
  description: string;
  runbook?: string;
  labels: Record<string, string>;
}

export interface PerformanceBenchmark {
  id: string;
  name: string;
  category: 'database' | 'api' | 'computation' | 'memory' | 'disk';
  baseline: number;
  current: number;
  threshold: number;
  unit: string;
  passed: boolean;
  timestamp: Date;
  details: Record<string, any>;
}

export interface SLAMetric {
  name: string;
  target: number; // Target percentage (e.g., 99.9)
  current: number; // Current percentage
  window: 'hour' | 'day' | 'week' | 'month';
  successCount: number;
  totalCount: number;
  errorBudget: number; // Remaining error budget
  status: 'healthy' | 'at_risk' | 'breached';
}

export interface BusinessMetric {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  unit: string;
  category: string;
  timestamp: Date;
  dimensions: Record<string, string>;
}

/**
 * Phoenix Monitoring System
 */
export class PhoenixMonitoring extends EventEmitter {
  private metrics: Map<string, MetricPoint[]> = new Map();
  private traces: Map<string, TraceSpan[]> = new Map();
  private activeSpans: Map<string, TraceSpan> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private benchmarks: Map<string, PerformanceBenchmark> = new Map();
  private slaMetrics: Map<string, SLAMetric> = new Map();
  private businessMetrics: Map<string, BusinessMetric[]> = new Map();

  private logger!: winston.Logger;
  private startTime: number;
  private cleanupIntervals: NodeJS.Timeout[] = [];

  // Configuration
  private config = {
    metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
    tracesRetention: 1 * 60 * 60 * 1000, // 1 hour
    healthCheckInterval: 30 * 1000, // 30 seconds
    alertingEnabled: true,
    exportInterval: 60 * 1000, // 1 minute
    maxMetricsPerName: 1000,
    maxTraceSpans: 100,
  };

  constructor() {
    super();
    this.startTime = Date.now();
    this.setupLogger();
    this.initializeSystemMetrics();
    this.startHealthChecks();
    this.startCleanupTasks();
    this.setupDefaultAlerts();
  }

  private setupLogger(): void {
    // Create multiple transport targets
    const transports: winston.transport[] = [
      // Console output for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
          }),
        ),
      }),

      // Application logs
      new DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),

      // Error logs
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '30d',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),

      // Performance logs
      new DailyRotateFile({
        filename: 'logs/performance-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),

      // Security logs
      new DailyRotateFile({
        filename: 'logs/security-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '90d',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),

      // Audit logs
      new DailyRotateFile({
        filename: 'logs/audit-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '365d',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
    ];

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      transports,
      exceptionHandlers: [
        new DailyRotateFile({
          filename: 'logs/exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
      rejectionHandlers: [
        new DailyRotateFile({
          filename: 'logs/rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
    });
  }

  private initializeSystemMetrics(): void {
    // Collect system metrics every 15 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 15 * 1000);

    // Collect process metrics every 30 seconds
    setInterval(() => {
      this.collectProcessMetrics();
    }, 30 * 1000);

    // Collect database metrics every 60 seconds
    setInterval(() => {
      this.collectDatabaseMetrics();
    }, 60 * 1000);
  }

  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  private startCleanupTasks(): void {
    // Cleanup old metrics every hour
    const metricsCleanup = setInterval(
      () => {
        this.cleanupOldMetrics();
      },
      60 * 60 * 1000,
    );

    // Cleanup old traces every 15 minutes
    const tracesCleanup = setInterval(
      () => {
        this.cleanupOldTraces();
      },
      15 * 60 * 1000,
    );

    // Export metrics every minute
    const metricsExport = setInterval(() => {
      this.exportMetrics();
    }, this.config.exportInterval);

    this.cleanupIntervals.push(metricsCleanup, tracesCleanup, metricsExport);
  }

  private setupDefaultAlerts(): void {
    // High response time alert
    this.createAlert('high_response_time', {
      name: 'High API Response Time',
      severity: 'high',
      condition: 'avg(api_response_time) > 1000',
      threshold: 1000,
      description: 'API response time is above 1 second',
      runbook: 'Check database performance and connection pool usage',
    });

    // High error rate alert
    this.createAlert('high_error_rate', {
      name: 'High Error Rate',
      severity: 'critical',
      condition: 'rate(errors) > 0.05',
      threshold: 0.05,
      description: 'Error rate is above 5%',
      runbook: 'Check application logs and recent deployments',
    });

    // Database connection pool alert
    this.createAlert('db_pool_exhaustion', {
      name: 'Database Pool Near Exhaustion',
      severity: 'high',
      condition: 'db_pool_usage > 0.8',
      threshold: 0.8,
      description: 'Database connection pool usage is above 80%',
      runbook: 'Review slow queries and connection leaks',
    });

    // Memory usage alert
    this.createAlert('high_memory_usage', {
      name: 'High Memory Usage',
      severity: 'medium',
      condition: 'memory_usage > 0.85',
      threshold: 0.85,
      description: 'Memory usage is above 85%',
      runbook: 'Check for memory leaks and optimize data structures',
    });
  }

  // Metrics Collection

  recordMetric(
    name: string,
    value: number,
    tags: Record<string, string> = {},
    type: MetricPoint['type'] = 'gauge',
  ): void {
    const metric: MetricPoint = {
      name,
      value,
      tags,
      timestamp: new Date(),
      type,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Keep only recent metrics
    if (metrics.length > this.config.maxMetricsPerName) {
      metrics.splice(0, metrics.length - this.config.maxMetricsPerName);
    }

    // Check for alerts
    this.checkAlerts(name, value);

    this.emit('metric', metric);
  }

  incrementCounter(name: string, value: number = 1, tags: Record<string, string> = {}): void {
    this.recordMetric(name, value, tags, 'counter');
  }

  recordGauge(name: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric(name, value, tags, 'gauge');
  }

  recordTimer(name: string, startTime: number, tags: Record<string, string> = {}): void {
    const duration = performance.now() - startTime;
    this.recordMetric(name, duration, tags, 'timer');
  }

  recordHistogram(name: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric(name, value, tags, 'histogram');
  }

  // Distributed Tracing

  startTrace(operationName: string, parentSpanId?: string): TraceSpan {
    const traceId = parentSpanId ? this.getTraceIdFromSpan(parentSpanId) : uuidv4();

    const span: TraceSpan = {
      traceId,
      spanId: uuidv4(),
      parentSpanId,
      operationName,
      startTime: performance.now(),
      tags: {},
      logs: [],
      status: 'ok',
    };

    this.activeSpans.set(span.spanId, span);

    // Store in traces collection
    if (!this.traces.has(traceId)) {
      this.traces.set(traceId, []);
    }
    this.traces.get(traceId)!.push(span);

    this.emit('span_start', span);
    return span;
  }

  finishTrace(spanId: string, error?: Error): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      return;
    }

    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;

    if (error) {
      span.status = 'error';
      span.error = error;
      span.logs.push({
        timestamp: performance.now(),
        level: 'error',
        message: error.message,
        fields: { stack: error.stack },
      });
    }

    this.activeSpans.delete(spanId);
    this.emit('span_finish', span);

    // Record trace duration metric
    this.recordTimer('trace_duration', span.startTime, {
      operation: span.operationName,
      status: span.status,
    });
  }

  addTraceTag(spanId: string, key: string, value: string): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags[key] = value;
    }
  }

  addTraceLog(
    spanId: string,
    level: TraceLog['level'],
    message: string,
    fields?: Record<string, any>,
  ): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: performance.now(),
        level,
        message,
        fields,
      });
    }
  }

  // Logging

  log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    meta?: Record<string, any>,
  ): void {
    this.logger.log(level, message, {
      ...meta,
      timestamp: new Date().toISOString(),
      correlationId: meta?.correlationId || uuidv4(),
    });

    // Record log metrics
    this.incrementCounter('log_messages', 1, { level });

    if (level === 'error') {
      this.incrementCounter('errors', 1, meta?.tags || {});
    }
  }

  logPerformance(operation: string, duration: number, meta?: Record<string, any>): void {
    this.logger.info('Performance Log', {
      type: 'performance',
      operation,
      duration,
      ...meta,
    });

    this.recordTimer('operation_duration', performance.now() - duration, {
      operation,
      ...meta?.tags,
    });
  }

  logSecurity(event: string, userId?: string, meta?: Record<string, any>): void {
    this.logger.warn('Security Event', {
      type: 'security',
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...meta,
    });

    this.incrementCounter('security_events', 1, { event });
  }

  logAudit(action: string, userId: string, resource: string, meta?: Record<string, any>): void {
    this.logger.info('Audit Log', {
      type: 'audit',
      action,
      userId,
      resource,
      timestamp: new Date().toISOString(),
      ...meta,
    });

    this.incrementCounter('audit_events', 1, { action, resource });
  }

  // Health Checks

  addHealthCheck(
    name: string,
    checkFn: () => Promise<{
      status: HealthCheck['status'];
      message?: string;
      details?: Record<string, any>;
    }>,
  ): void {
    // Store health check function for periodic execution
    setInterval(async () => {
      const startTime = performance.now();
      try {
        const result = await checkFn();
        const responseTime = performance.now() - startTime;

        const healthCheck: HealthCheck = {
          name,
          status: result.status,
          timestamp: new Date(),
          responseTime,
          message: result.message,
          details: result.details,
        };

        this.healthChecks.set(name, healthCheck);

        // Record health check metrics
        this.recordGauge('health_check_status', result.status === 'healthy' ? 1 : 0, { name });
        this.recordTimer('health_check_duration', startTime, { name });

        this.emit('health_check', healthCheck);
      } catch (error) {
        const responseTime = performance.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const healthCheck: HealthCheck = {
          name,
          status: 'unhealthy',
          timestamp: new Date(),
          responseTime,
          message: errorMessage,
        };

        this.healthChecks.set(name, healthCheck);
        this.emit('health_check', healthCheck);
      }
    }, this.config.healthCheckInterval);
  }

  getHealthStatus(): { status: 'healthy' | 'degraded' | 'unhealthy'; checks: HealthCheck[] } {
    const checks = Array.from(this.healthChecks.values());

    const unhealthyChecks = checks.filter(c => c.status === 'unhealthy').length;
    const degradedChecks = checks.filter(c => c.status === 'degraded').length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (unhealthyChecks > 0) {
      status = 'unhealthy';
    } else if (degradedChecks > 0) {
      status = 'degraded';
    }

    return { status, checks };
  }

  // Alerting

  createAlert(
    id: string,
    config: {
      name: string;
      severity: Alert['severity'];
      condition: string;
      threshold: number;
      description: string;
      runbook?: string;
      labels?: Record<string, string>;
    },
  ): void {
    // Store alert configuration for evaluation
    this.alerts.set(id, {
      id,
      name: config.name,
      severity: config.severity,
      condition: config.condition,
      threshold: config.threshold,
      currentValue: 0,
      status: 'resolved',
      triggerTime: new Date(),
      description: config.description,
      runbook: config.runbook,
      labels: config.labels || {},
    });
  }

  private checkAlerts(metricName: string, value: number): void {
    if (!this.config.alertingEnabled) {
      return;
    }

    for (const alert of this.alerts.values()) {
      // Simple condition evaluation (would be more sophisticated in production)
      if (this.evaluateAlertCondition(alert, metricName, value)) {
        if (alert.status === 'resolved') {
          alert.status = 'firing';
          alert.triggerTime = new Date();
          alert.currentValue = value;

          this.emit('alert_fired', alert);
          this.logSecurity('alert_fired', undefined, { alert: alert.name, value });
        }
      } else if (alert.status === 'firing') {
        alert.status = 'resolved';
        alert.resolveTime = new Date();

        this.emit('alert_resolved', alert);
        this.logSecurity('alert_resolved', undefined, { alert: alert.name });
      }
    }
  }

  private evaluateAlertCondition(alert: Alert, metricName: string, value: number): boolean {
    // Simplified condition evaluation
    if (alert.condition.includes(metricName)) {
      if (alert.condition.includes('>')) {
        return value > alert.threshold;
      } else if (alert.condition.includes('<')) {
        return value < alert.threshold;
      }
    }
    return false;
  }

  // Performance Benchmarking

  addBenchmark(
    name: string,
    category: PerformanceBenchmark['category'],
    baseline: number,
    threshold: number,
    unit: string,
  ): void {
    const benchmark: PerformanceBenchmark = {
      id: uuidv4(),
      name,
      category,
      baseline,
      current: 0,
      threshold,
      unit,
      passed: true,
      timestamp: new Date(),
      details: {},
    };

    this.benchmarks.set(name, benchmark);
  }

  recordBenchmark(name: string, value: number, details?: Record<string, any>): void {
    const benchmark = this.benchmarks.get(name);
    if (benchmark) {
      benchmark.current = value;
      benchmark.passed = value <= benchmark.threshold;
      benchmark.timestamp = new Date();
      benchmark.details = details || {};

      this.recordGauge('benchmark_value', value, {
        name,
        category: benchmark.category,
        passed: benchmark.passed.toString(),
      });

      this.emit('benchmark', benchmark);
    }
  }

  // SLA/SLO Tracking

  recordSLAEvent(name: string, success: boolean, window: SLAMetric['window'] = 'day'): void {
    if (!this.slaMetrics.has(name)) {
      this.slaMetrics.set(name, {
        name,
        target: 99.9,
        current: 100,
        window,
        successCount: 0,
        totalCount: 0,
        errorBudget: 0.1,
        status: 'healthy',
      });
    }

    const sla = this.slaMetrics.get(name)!;
    sla.totalCount++;

    if (success) {
      sla.successCount++;
    }

    sla.current = (sla.successCount / sla.totalCount) * 100;
    sla.errorBudget = sla.target - sla.current;

    if (sla.current < sla.target * 0.95) {
      sla.status = 'breached';
    } else if (sla.current < sla.target) {
      sla.status = 'at_risk';
    } else {
      sla.status = 'healthy';
    }

    this.recordGauge('sla_current', sla.current, { name, window });
    this.recordGauge('sla_error_budget', sla.errorBudget, { name, window });
  }

  // Business Metrics

  recordBusinessMetric(
    name: string,
    value: number,
    category: string,
    unit: string,
    dimensions: Record<string, string> = {},
  ): void {
    if (!this.businessMetrics.has(name)) {
      this.businessMetrics.set(name, []);
    }

    const metrics = this.businessMetrics.get(name)!;
    const previousMetric = metrics[metrics.length - 1];

    const metric: BusinessMetric = {
      name,
      value,
      previousValue: previousMetric?.value,
      change: previousMetric ? value - previousMetric.value : 0,
      changePercent:
        previousMetric && previousMetric.value > 0
          ? ((value - previousMetric.value) / previousMetric.value) * 100
          : 0,
      unit,
      category,
      timestamp: new Date(),
      dimensions,
    };

    metrics.push(metric);

    // Keep only last 100 metrics per name
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }

    this.recordGauge('business_metric', value, {
      name,
      category,
      unit,
      ...dimensions,
    });

    this.emit('business_metric', metric);
  }

  // System Metrics Collection

  private collectSystemMetrics(): void {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    const systemLoad = os.loadavg();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
    };

    // CPU metrics
    this.recordGauge('system_cpu_user', cpuUsage.user);
    this.recordGauge('system_cpu_system', cpuUsage.system);

    // Memory metrics
    this.recordGauge('process_memory_rss', memoryUsage.rss);
    this.recordGauge('process_memory_heap_total', memoryUsage.heapTotal);
    this.recordGauge('process_memory_heap_used', memoryUsage.heapUsed);
    this.recordGauge('process_memory_external', memoryUsage.external);

    this.recordGauge('system_memory_total', systemMemory.total);
    this.recordGauge('system_memory_free', systemMemory.free);
    this.recordGauge(
      'system_memory_usage',
      (systemMemory.total - systemMemory.free) / systemMemory.total,
    );

    // Load average
    this.recordGauge('system_load_1m', systemLoad[0]);
    this.recordGauge('system_load_5m', systemLoad[1]);
    this.recordGauge('system_load_15m', systemLoad[2]);

    // Uptime
    this.recordGauge('process_uptime', (Date.now() - this.startTime) / 1000);
    this.recordGauge('system_uptime', os.uptime());
  }

  private collectProcessMetrics(): void {
    // Node.js specific metrics
    this.recordGauge('process_pid', process.pid);
    this.recordGauge('node_version', parseInt(process.version.substring(1).split('.')[0]));

    // Event loop lag
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds
      this.recordGauge('event_loop_lag', lag);
    });

    // Garbage collection
    if (global.gc) {
      const before = process.memoryUsage();
      global.gc();
      const after = process.memoryUsage();

      this.recordGauge('gc_memory_freed', before.heapUsed - after.heapUsed);
    }
  }

  private async collectDatabaseMetrics(): Promise<void> {
    try {
      const health = await phoenixPool.getHealthMetrics();

      this.recordGauge('db_total_connections', health.totalConnections);
      this.recordGauge('db_active_connections', health.activeConnections);
      this.recordGauge('db_idle_connections', health.idleConnections);
      this.recordGauge('db_waiting_clients', health.waitingClients);
      this.recordGauge('db_avg_query_time', health.avgQueryTime);
      this.recordGauge('db_error_rate', health.errorRate);
      this.recordGauge('db_status', health.status === 'healthy' ? 1 : 0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', 'Failed to collect database metrics', { error: errorMessage });
    }
  }

  private async performHealthChecks(): Promise<void> {
    // Built-in health checks
    this.addHealthCheck('database', async () => {
      try {
        const health = await phoenixPool.getHealthMetrics();
        return {
          status:
            health.status === 'healthy'
              ? 'healthy'
              : health.status === 'degraded'
                ? 'degraded'
                : 'unhealthy',
          details: health,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          status: 'unhealthy',
          message: errorMessage,
        };
      }
    });

    this.addHealthCheck('memory', async () => {
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usage = (totalMemory - freeMemory) / totalMemory;

      return {
        status: usage > 0.9 ? 'unhealthy' : usage > 0.8 ? 'degraded' : 'healthy',
        details: {
          memoryUsage,
          systemMemoryUsage: usage,
          heapUsagePercent: memoryUsage.heapUsed / memoryUsage.heapTotal,
        },
      };
    });

    this.addHealthCheck('disk_space', async () => {
      // This would check disk space in a real implementation
      return {
        status: 'healthy',
        details: { diskUsage: '45%' },
      };
    });
  }

  // Cleanup Methods

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.config.metricsRetention;

    for (const [name, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp.getTime() > cutoff);
      this.metrics.set(name, filtered);
    }
  }

  private cleanupOldTraces(): void {
    const cutoff = Date.now() - this.config.tracesRetention;

    for (const [traceId, spans] of this.traces.entries()) {
      const hasRecentSpans = spans.some(s => s.startTime > cutoff);
      if (!hasRecentSpans) {
        this.traces.delete(traceId);
      }
    }
  }

  private async exportMetrics(): Promise<void> {
    try {
      // Export to time series database (would integrate with Prometheus, InfluxDB, etc.)
      const allMetrics = Array.from(this.metrics.values()).flat();

      // Example: Save to database for historical analysis
      if (allMetrics.length > 0) {
        await this.saveMetricsToDatabase(allMetrics);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', 'Failed to export metrics', { error: errorMessage });
    }
  }

  private async saveMetricsToDatabase(metrics: MetricPoint[]): Promise<void> {
    // This would save metrics to a time series database
    // For now, just log the count
    this.log('debug', `Exporting ${metrics.length} metrics to time series database`);
  }

  // Utility Methods

  private getTraceIdFromSpan(spanId: string): string {
    const span = this.activeSpans.get(spanId);
    return span?.traceId || uuidv4();
  }

  // Getter Methods

  getMetrics(name?: string, since?: Date): MetricPoint[] {
    if (name) {
      const metrics = this.metrics.get(name) || [];
      return since ? metrics.filter(m => m.timestamp >= since) : metrics;
    }

    const allMetrics = Array.from(this.metrics.values()).flat();
    return since ? allMetrics.filter(m => m.timestamp >= since) : allMetrics;
  }

  getTraces(traceId?: string): TraceSpan[] {
    if (traceId) {
      return this.traces.get(traceId) || [];
    }
    return Array.from(this.traces.values()).flat();
  }

  getAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  getBenchmarks(): PerformanceBenchmark[] {
    return Array.from(this.benchmarks.values());
  }

  getSLAMetrics(): SLAMetric[] {
    return Array.from(this.slaMetrics.values());
  }

  getBusinessMetrics(name?: string): BusinessMetric[] {
    if (name) {
      return this.businessMetrics.get(name) || [];
    }
    return Array.from(this.businessMetrics.values()).flat();
  }

  // Shutdown

  async shutdown(): Promise<void> {
    // Clear all intervals
    this.cleanupIntervals.forEach(interval => clearInterval(interval));

    // Export final metrics
    await this.exportMetrics();

    // Close logger
    this.logger.end();

    this.emit('shutdown');
  }
}

// Singleton instance
export const phoenixMonitoring = new PhoenixMonitoring();

// Express middleware for automatic instrumentation
export function instrumentationMiddleware(req: any, res: any, next: any): void {
  const startTime = performance.now();
  const span = phoenixMonitoring.startTrace(`${req.method} ${req.route?.path || req.path}`);

  // Add request metadata
  phoenixMonitoring.addTraceTag(span.spanId, 'http.method', req.method);
  phoenixMonitoring.addTraceTag(span.spanId, 'http.url', req.originalUrl);
  phoenixMonitoring.addTraceTag(span.spanId, 'http.user_agent', req.headers['user-agent'] || '');
  phoenixMonitoring.addTraceTag(span.spanId, 'user.id', req.user?.id || 'anonymous');

  // Store span in request for child spans
  req.span = span;

  res.on('finish', () => {
    const duration = performance.now() - startTime;

    phoenixMonitoring.addTraceTag(span.spanId, 'http.status_code', res.statusCode.toString());
    phoenixMonitoring.finishTrace(
      span.spanId,
      res.statusCode >= 400 ? new Error(`HTTP ${res.statusCode}`) : undefined,
    );

    // Record metrics
    phoenixMonitoring.recordTimer('http_request_duration', startTime, {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString(),
    });

    phoenixMonitoring.incrementCounter('http_requests_total', 1, {
      method: req.method,
      status_code: res.statusCode.toString(),
    });

    // Log request
    phoenixMonitoring.logPerformance('http_request', duration, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.user?.id,
    });

    // Record SLA event
    phoenixMonitoring.recordSLAEvent('api_availability', res.statusCode < 500);
  });

  next();
}
