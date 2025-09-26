/**
 * Data Sanitization Security Module
 *
 * Provides comprehensive data sanitization to prevent XSS attacks,
 * HTML injection, and other client-side security vulnerabilities.
 */

import DOMPurify from 'dompurify';
import validator from 'validator';
import { securityLogger } from './logging';

// DOMPurify configuration for different contexts
const PURIFY_CONFIGS = {
  // Strict configuration - removes all HTML
  strict: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  },

  // Basic HTML configuration - allows safe formatting tags
  basic: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'iframe'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style'],
  },

  // Rich text configuration - allows more formatting but still secure
  rich: {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
    ],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'iframe', 'svg'],
    FORBID_ATTR: [
      'onerror',
      'onload',
      'onclick',
      'onmouseover',
      'onfocus',
      'onblur',
      'style',
      'class',
      'id',
    ],
  },
} as const;

type SanitizationLevel = keyof typeof PURIFY_CONFIGS;

/**
 * HTML Sanitization Functions
 */

// Sanitize HTML content with configurable strictness
export function sanitizeHtml(html: string, level: SanitizationLevel = 'strict'): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    const config = PURIFY_CONFIGS[level];
    const sanitized = DOMPurify.sanitize(html, config);

    // Log if significant changes were made
    if (sanitized !== html && sanitized.length < html.length * 0.8) {
      securityLogger.info('HTML sanitization removed significant content', {
        originalLength: html.length,
        sanitizedLength: sanitized.length,
        level,
      });
    }

    return sanitized;
  } catch (_error) {
    securityLogger.error('HTML sanitization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      inputLength: html.length,
    });

    // Fallback to strict text-only sanitization
    return sanitizeText(html);
  }
}

// Sanitize text content (removes all HTML)
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove all HTML tags and decode entities
  let sanitized = text.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  sanitized = validator.unescape(sanitized);

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

// Sanitize user input for display
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // First, sanitize as text to remove any HTML
  let sanitized = sanitizeText(input);

  // Then escape any remaining special characters
  sanitized = validator.escape(sanitized);

  return sanitized;
}

// Sanitize AI prompts to prevent prompt injection
export function sanitizeAiPrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') {
    return '';
  }

  // Remove potentially dangerous instructions
  const dangerousPatterns = [
    /ignore\s+previous\s+instructions?/gi,
    /forget\s+everything/gi,
    /disregard\s+(?:all\s+)?previous/gi,
    /you\s+are\s+now/gi,
    /act\s+as\s+if/gi,
    /pretend\s+(?:to\s+be|that)/gi,
    /simulate\s+(?:being|that)/gi,
    /roleplay\s+as/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /user\s*:/gi,
    /human\s*:/gi,
    /ai\s*:/gi,
  ];

  let sanitized = prompt;
  let removedPatterns = 0;

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, '');
      removedPatterns++;
    }
  });

  if (removedPatterns > 0) {
    securityLogger.warn('AI prompt injection attempt detected and sanitized', {
      originalLength: prompt.length,
      sanitizedLength: sanitized.length,
      removedPatterns,
    });
  }

  // Clean up extra whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Limit length to prevent resource exhaustion
  if (sanitized.length > 2000) {
    sanitized = sanitized.substring(0, 2000) + '...';
    securityLogger.info('AI prompt truncated due to length', {
      originalLength: prompt.length,
    });
  }

  return sanitized;
}

/**
 * URL Sanitization Functions
 */

// Sanitize URLs to prevent XSS and other attacks
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    // Remove leading/trailing whitespace
    const sanitized = url.trim();

    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:', 'about:'];

    const lowerUrl = sanitized.toLowerCase();
    if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
      securityLogger.warn('Dangerous URL protocol detected', { url: sanitized });
      return '';
    }

    // Validate URL format
    const urlObj = new URL(sanitized);

    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }

    // Return the cleaned URL
    return urlObj.toString();
  } catch (_error) {
    securityLogger.warn('Invalid URL format', { url: url.substring(0, 100) });
    return '';
  }
}

// Sanitize file paths to prevent directory traversal
export function sanitizeFilePath(path: string): string {
  if (!path || typeof path !== 'string') {
    return '';
  }

  // Remove dangerous path components
  let sanitized = path
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/\/+/g, '/') // Normalize multiple slashes
    .replace(/^\/+/, '') // Remove leading slashes
    .replace(/\/+$/, ''); // Remove trailing slashes

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Only allow safe characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._\/-]/g, '');

  return sanitized;
}

/**
 * Data Sanitization Functions
 */

// Sanitize JSON data recursively
export function sanitizeJson(data: unknown, level: SanitizationLevel = 'strict'): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeHtml(data, level);
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeJson(item, level));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Sanitize keys to prevent prototype pollution
      const sanitizedKey = sanitizeText(key);
      if (sanitizedKey && !['__proto__', 'constructor', 'prototype'].includes(sanitizedKey)) {
        sanitized[sanitizedKey] = sanitizeJson(value, level);
      }
    }

    return sanitized;
  }

  return data;
}

// Sanitize form data
export function sanitizeFormData(formData: FormData): FormData {
  const sanitized = new FormData();

  for (const [key, value] of formData.entries()) {
    const sanitizedKey = sanitizeText(key);

    if (typeof value === 'string') {
      sanitized.append(sanitizedKey, sanitizeUserInput(value));
    } else if (value instanceof File) {
      // Sanitize filename
      const sanitizedFileName = sanitizeFilePath(value.name);
      const sanitizedFile = new File([value], sanitizedFileName, { type: value.type });
      sanitized.append(sanitizedKey, sanitizedFile);
    } else {
      sanitized.append(sanitizedKey, value);
    }
  }

  return sanitized;
}

// Sanitize query parameters
export function sanitizeQueryParams(params: URLSearchParams): URLSearchParams {
  const sanitized = new URLSearchParams();

  for (const [key, value] of params.entries()) {
    const sanitizedKey = sanitizeText(key);
    const sanitizedValue = sanitizeUserInput(value);

    if (sanitizedKey && sanitizedValue) {
      sanitized.append(sanitizedKey, sanitizedValue);
    }
  }

  return sanitized;
}

/**
 * Player Data Sanitization
 */

// Sanitize player names and text fields
export function sanitizePlayerData(playerData: unknown): unknown {
  if (!playerData || typeof playerData !== 'object') {
    return playerData;
  }

  const sanitized = { ...playerData };

  // Sanitize text fields
  const textFields = ['name', 'notes', 'nationality'];
  textFields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeUserInput(sanitized[field]);
    }
  });

  // Sanitize communication history
  if (Array.isArray(sanitized.conversationHistory)) {
    sanitized.conversationHistory = sanitized.conversationHistory.map((message: unknown) => ({
      ...message,
      text: typeof message.text === 'string' ? sanitizeHtml(message.text, 'basic') : message.text,
    }));
  }

  // Sanitize development log
  if (Array.isArray(sanitized.developmentLog)) {
    sanitized.developmentLog = sanitized.developmentLog.map((log: unknown) => ({
      ...log,
      note: typeof log.note === 'string' ? sanitizeHtml(log.note, 'basic') : log.note,
    }));
  }

  return sanitized;
}

/**
 * Chat Message Sanitization
 */

// Sanitize chat messages while preserving some formatting
export function sanitizeChatMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return '';
  }

  // Use basic HTML sanitization to allow some formatting
  let sanitized = sanitizeHtml(message, 'basic');

  // Additional checks for chat-specific threats
  const chatThreats = [
    /@everyone/gi,
    /@here/gi,
    /discord\.gg\/\w+/gi,
    /bit\.ly\/\w+/gi,
    /tinyurl\.com\/\w+/gi,
  ];

  chatThreats.forEach(threat => {
    if (threat.test(sanitized)) {
      sanitized = sanitized.replace(threat, '[REMOVED]');
      securityLogger.info('Chat threat pattern removed', { pattern: threat.source });
    }
  });

  return sanitized;
}

/**
 * Filename Sanitization
 */

// Sanitize uploaded filenames
export function sanitizeFileName(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'file';
  }

  // Remove path separators and dangerous characters
  let sanitized = filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .replace(/\.+/g, '.');

  // Limit length
  if (sanitized.length > 255) {
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    const name = sanitized.substring(0, 255 - extension.length);
    sanitized = name + extension;
  }

  // Ensure it doesn't start with a dot
  if (sanitized.startsWith('.')) {
    sanitized = 'file' + sanitized;
  }

  return sanitized || 'file';
}

/**
 * Security Header Sanitization
 */

// Sanitize values for security headers
export function sanitizeHeaderValue(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  // Remove line breaks that could be used for header injection
  return value.replace(/[\r\n]/g, '').trim();
}

/**
 * Export sanitization utility functions
 */

export const sanitizationUtils = {
  html: sanitizeHtml,
  text: sanitizeText,
  userInput: sanitizeUserInput,
  aiPrompt: sanitizeAiPrompt,
  url: sanitizeUrl,
  filePath: sanitizeFilePath,
  json: sanitizeJson,
  formData: sanitizeFormData,
  queryParams: sanitizeQueryParams,
  playerData: sanitizePlayerData,
  chatMessage: sanitizeChatMessage,
  fileName: sanitizeFileName,
  headerValue: sanitizeHeaderValue,
};
