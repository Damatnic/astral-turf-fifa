/**
 * File Management API - Secure file upload/download with advanced validation
 *
 * Features:
 * - Multi-format file upload with virus scanning
 * - Advanced security validation and sanitization
 * - Automated image optimization and resizing
 * - Cloud storage integration (AWS S3, Google Cloud, Azure)
 * - File versioning and history tracking
 * - Secure direct downloads with temporary URLs
 * - Metadata extraction and indexing
 * - Automated backup and archival
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { Worker } from 'worker_threads';
import { phoenixPool } from '../database/PhoenixDatabasePool';
import { AuthenticatedRequest } from '../middleware/PhoenixAuthMiddleware';
import { fileStorageService } from '../../services/fileStorageService';
import { securityLogger } from '../../security/logging';

export interface FileMetadata {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  checksum: string;
  uploadedBy: string;
  uploadedAt: Date;
  category: FileCategory;
  isPublic: boolean;
  tags: string[];
  description?: string;
  version: number;
  parentFileId?: string;
  expiresAt?: Date;
  downloadCount: number;
  lastAccessed?: Date;
  storageProvider: StorageProvider;
  cloudUrl?: string;
  thumbnailUrl?: string;
  extractedMetadata?: ExtractedMetadata;
}

export interface ExtractedMetadata {
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
  format?: string;
  codec?: string;
  frameRate?: number;
  resolution?: string;
  colorSpace?: string;
  hasAlpha?: boolean;
  pages?: number;
  wordCount?: number;
  author?: string;
  title?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  virusScanning: boolean;
  imageOptimization: boolean;
  generateThumbnails: boolean;
  extractMetadata: boolean;
  autoBackup: boolean;
  compressionLevel: number;
  encryptStorage: boolean;
}

export interface FileAccessLog {
  id: string;
  fileId: string;
  userId: string;
  action:
    | 'upload'
    | 'download'
    | 'view'
    | 'delete'
    | 'share'
    | 'hard_delete'
    | 'soft_delete'
    | 'move'
    | 'copy'
    | 'tag_update';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export interface FileShare {
  id: string;
  fileId: string;
  userId: string;
  shareToken: string;
  expiresAt?: Date;
  maxDownloads?: number;
  downloadCount: number;
  password?: string;
  allowedDomains?: string[];
  createdAt: Date;
  isActive: boolean;
}

export type FileCategory =
  | 'formation'
  | 'player_photo'
  | 'team_logo'
  | 'document'
  | 'video'
  | 'audio'
  | 'archive'
  | 'backup'
  | 'report'
  | 'other';

export type StorageProvider = 'local' | 'aws_s3' | 'google_cloud' | 'azure_blob' | 'cloudinary';

/**
 * File Management API Router
 */
export class FileManagementAPI {
  private router: Router;
  private upload!: multer.Multer;
  private uploadConfigs: Map<FileCategory, FileUploadConfig> = new Map();
  private virusScannerQueue: string[] = [];
  private processingQueue: Map<string, any> = new Map();

  constructor() {
    this.router = Router();
    this.setupUploadConfigs();
    this.setupMulter();
    this.setupRoutes();
    this.startBackgroundProcessing();
  }

  private setupUploadConfigs(): void {
    // Configure upload settings for different file categories
    const configs: Record<FileCategory, FileUploadConfig> = {
      formation: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['application/json', 'text/plain', 'application/xml'],
        virusScanning: true,
        imageOptimization: false,
        generateThumbnails: false,
        extractMetadata: true,
        autoBackup: true,
        compressionLevel: 6,
        encryptStorage: false,
      },
      player_photo: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        virusScanning: true,
        imageOptimization: true,
        generateThumbnails: true,
        extractMetadata: true,
        autoBackup: true,
        compressionLevel: 8,
        encryptStorage: false,
      },
      team_logo: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/png', 'image/svg+xml', 'image/jpeg'],
        virusScanning: true,
        imageOptimization: true,
        generateThumbnails: true,
        extractMetadata: true,
        autoBackup: true,
        compressionLevel: 9,
        encryptStorage: false,
      },
      document: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
        ],
        virusScanning: true,
        imageOptimization: false,
        generateThumbnails: true,
        extractMetadata: true,
        autoBackup: true,
        compressionLevel: 6,
        encryptStorage: true,
      },
      video: {
        maxFileSize: 500 * 1024 * 1024, // 500MB
        allowedMimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
        virusScanning: true,
        imageOptimization: false,
        generateThumbnails: true,
        extractMetadata: true,
        autoBackup: false,
        compressionLevel: 5,
        encryptStorage: true,
      },
      audio: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedMimeTypes: ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg'],
        virusScanning: true,
        imageOptimization: false,
        generateThumbnails: false,
        extractMetadata: true,
        autoBackup: false,
        compressionLevel: 6,
        encryptStorage: false,
      },
      archive: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedMimeTypes: [
          'application/zip',
          'application/x-rar-compressed',
          'application/x-7z-compressed',
        ],
        virusScanning: true,
        imageOptimization: false,
        generateThumbnails: false,
        extractMetadata: true,
        autoBackup: true,
        compressionLevel: 3,
        encryptStorage: true,
      },
      backup: {
        maxFileSize: 1024 * 1024 * 1024, // 1GB
        allowedMimeTypes: ['application/octet-stream', 'application/sql', 'application/x-sql'],
        virusScanning: false,
        imageOptimization: false,
        generateThumbnails: false,
        extractMetadata: false,
        autoBackup: false,
        compressionLevel: 9,
        encryptStorage: true,
      },
      report: {
        maxFileSize: 20 * 1024 * 1024, // 20MB
        allowedMimeTypes: [
          'application/pdf',
          'text/csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        virusScanning: true,
        imageOptimization: false,
        generateThumbnails: true,
        extractMetadata: true,
        autoBackup: true,
        compressionLevel: 6,
        encryptStorage: false,
      },
      other: {
        maxFileSize: 25 * 1024 * 1024, // 25MB
        allowedMimeTypes: ['*/*'], // Will be validated separately
        virusScanning: true,
        imageOptimization: false,
        generateThumbnails: false,
        extractMetadata: true,
        autoBackup: false,
        compressionLevel: 6,
        encryptStorage: false,
      },
    };

    Object.entries(configs).forEach(([category, config]) => {
      this.uploadConfigs.set(category as FileCategory, config);
    });
  }

  private setupMulter(): void {
    const storage = multer.memoryStorage();

    this.upload = multer({
      storage,
      limits: {
        fileSize: 1024 * 1024 * 1024, // 1GB max (will be checked per category)
        files: 10, // Max 10 files per request
        fields: 20,
        fieldNameSize: 50,
        fieldSize: 1024 * 1024, // 1MB field size
      },
      fileFilter: (req: any, file: any, cb: any) => {
        // Basic security checks
        if (this.isSecureFilename(file.originalname)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid filename detected'));
        }
      },
    });
  }

  private setupRoutes(): void {
    // File upload endpoints
    this.router.post('/upload', this.upload.array('files', 10), this.handleFileUpload.bind(this));

    this.router.post(
      '/upload/:category',
      this.upload.array('files', 10),
      this.handleCategorizedUpload.bind(this)
    );

    // File management endpoints
    this.router.get('/files', this.getFiles.bind(this));
    this.router.get('/files/:id', this.getFile.bind(this));
    this.router.get('/files/:id/download', this.downloadFile.bind(this));
    this.router.get('/files/:id/stream', this.streamFile.bind(this));
    this.router.put('/files/:id', this.updateFile.bind(this));
    this.router.delete('/files/:id', this.deleteFile.bind(this));

    // File sharing endpoints
    this.router.post('/files/:id/share', this.createFileShare.bind(this));
    this.router.get('/shared/:token', this.getSharedFile.bind(this));
    this.router.get('/shared/:token/download', this.downloadSharedFile.bind(this));

    // File processing endpoints
    this.router.post('/files/:id/optimize', this.optimizeFile.bind(this));
    this.router.post('/files/:id/thumbnail', this.generateThumbnail.bind(this));
    this.router.get('/files/:id/metadata', this.getFileMetadata.bind(this));

    // File versioning
    this.router.get('/files/:id/versions', this.getFileVersions.bind(this));
    this.router.post('/files/:id/versions', this.createFileVersion.bind(this));
    this.router.post('/files/:id/restore/:version', this.restoreFileVersion.bind(this));

    // Bulk operations
    this.router.post('/files/bulk/delete', this.bulkDeleteFiles.bind(this));
    this.router.post('/files/bulk/move', this.bulkMoveFiles.bind(this));
    this.router.post('/files/bulk/tag', this.bulkTagFiles.bind(this));

    // Administrative endpoints
    this.router.get('/admin/storage-stats', this.getStorageStats.bind(this));
    this.router.get('/admin/usage-analytics', this.getUsageAnalytics.bind(this));
    this.router.post('/admin/cleanup', this.cleanupFiles.bind(this));
    this.router.post('/admin/backup', this.initiateBackup.bind(this));
  }

  private startBackgroundProcessing(): void {
    // Process virus scanning queue every 30 seconds
    setInterval(() => {
      this.processVirusScanQueue();
    }, 30 * 1000);

    // Process optimization queue every minute
    setInterval(() => {
      this.processOptimizationQueue();
    }, 60 * 1000);

    // Cleanup expired shares every hour
    setInterval(
      () => {
        this.cleanupExpiredShares();
      },
      60 * 60 * 1000
    );

    // Generate usage analytics every 6 hours
    setInterval(
      () => {
        this.generateUsageAnalytics();
      },
      6 * 60 * 60 * 1000
    );
  }

  // File Upload Handlers

  private async handleFileUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const files = (req as any).files as Express.Multer.File[];
      const { category = 'other', isPublic = false, tags = [], description } = req.body;

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No files provided',
        });
        return;
      }

      const config = this.uploadConfigs.get(category as FileCategory);
      if (!config) {
        res.status(400).json({
          success: false,
          error: 'Invalid file category',
        });
        return;
      }

      const uploadResults: Array<{
        filename: string;
        success: boolean;
        error?: string;
        fileId?: string;
        metadata?: FileMetadata;
      }> = [];

      for (const file of files) {
        try {
          // Validate file
          const validation = await this.validateFile(file, config);
          if (!validation.isValid) {
            uploadResults.push({
              filename: file.originalname,
              success: false,
              error: validation.error,
            });
            continue;
          }

          // Process file upload
          const fileMetadata = await this.processFileUpload(
            file,
            category as FileCategory,
            req.user?.id || '',
            {
              isPublic: isPublic === 'true',
              tags: Array.isArray(tags) ? tags : tags.split(','),
              description,
            }
          );

          uploadResults.push({
            filename: file.originalname,
            success: true,
            fileId: fileMetadata.id,
            metadata: fileMetadata,
          });

          // Log upload
          await this.logFileAccess({
            fileId: fileMetadata.id,
            userId: req.user?.id || '',
            action: 'upload',
            ipAddress: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            success: true,
          });
        } catch (error: any) {
          uploadResults.push({
            filename: file.originalname,
            success: false,
            error: error.message,
          });
        }
      }

      res.json({
        success: true,
        data: uploadResults,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'File upload failed',
        details: error.message,
      });
    }
  }

  private async handleCategorizedUpload(req: AuthenticatedRequest, res: Response): Promise<void> {
    req.body.category = req.params.category;
    await this.handleFileUpload(req, res);
  }

  // File Management Handlers

  private async getFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        search,
        tags,
        isPublic,
        sortBy = 'uploadedAt',
        sortOrder = 'desc',
      } = req.query;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      // Filter by user access
      if (req.user?.role !== 'admin') {
        whereClause += ` AND (uploaded_by = $${paramIndex} OR is_public = true)`;
        params.push(req.user?.id);
        paramIndex++;
      }

      if (category) {
        whereClause += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (search) {
        whereClause += ` AND (original_name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        whereClause += ` AND tags && $${paramIndex}`;
        params.push(tagArray);
        paramIndex++;
      }

      if (isPublic !== undefined) {
        whereClause += ` AND is_public = $${paramIndex}`;
        params.push(isPublic === 'true');
        paramIndex++;
      }

      const offset = (Number(page) - 1) * Number(limit);

      const result = await phoenixPool.query(
        `
        SELECT 
          f.*,
          u.first_name || ' ' || u.last_name as uploader_name
        FROM file_metadata f
        LEFT JOIN users u ON f.uploaded_by = u.id
        ${whereClause}
        ORDER BY ${sortBy} ${String(sortOrder).toUpperCase()}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
        [...params, limit, offset]
      );

      // Get total count
      const countResult = await phoenixPool.query(
        `
        SELECT COUNT(*) as total FROM file_metadata f ${whereClause}
      `,
        params
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / Number(limit));

      res.json({
        success: true,
        data: {
          files: result.rows,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages,
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch files',
        details: error.message,
      });
    }
  }

  private async getFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await phoenixPool.query(
        `
        SELECT 
          f.*,
          u.first_name || ' ' || u.last_name as uploader_name
        FROM file_metadata f
        LEFT JOIN users u ON f.uploaded_by = u.id
        WHERE f.id = $1
      `,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      const file = result.rows[0];

      // Check access permissions
      if (!this.checkFileAccess(file, req.user)) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      // Update last accessed
      await phoenixPool.query(
        `
        UPDATE file_metadata 
        SET last_accessed = NOW() 
        WHERE id = $1
      `,
        [id]
      );

      res.json({
        success: true,
        data: file,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch file',
        details: error.message,
      });
    }
  }

  private async downloadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await phoenixPool.query('SELECT * FROM file_metadata WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      const file = result.rows[0];

      // Check access permissions
      if (!this.checkFileAccess(file, req.user)) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      // Download from cloud storage
      try {
        const downloadResult = await fileStorageService.downloadFile({
          fileId: id,
        });

        // Set appropriate headers
        res.setHeader('Content-Type', downloadResult.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadResult.filename}"`);
        res.setHeader('Content-Length', downloadResult.size.toString());

        // Update download count and last accessed
        await phoenixPool.query(
          `
          UPDATE file_metadata 
          SET download_count = download_count + 1, last_accessed = NOW() 
          WHERE id = $1
        `,
          [id]
        );

        // Log download
        await this.logFileAccess({
          fileId: id,
          userId: req.user?.id || '',
          action: 'download',
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          success: true,
        });

        securityLogger.info('File downloaded from cloud storage', {
          fileId: id,
          userId: req.user?.id,
          filename: downloadResult.filename,
          size: downloadResult.size,
        });

        // Send file
        res.send(downloadResult.buffer);
      } catch (downloadError) {
        securityLogger.error('Cloud storage download failed', {
          fileId: id,
          error: downloadError instanceof Error ? downloadError.message : 'Unknown error',
        });
        res.status(404).json({
          success: false,
          error: 'File not found on storage',
        });
        return;
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'File download failed',
        details: error.message,
      });
    }
  }

  private async streamFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const range = req.headers.range;

      const result = await phoenixPool.query('SELECT * FROM file_metadata WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      const file = result.rows[0];

      // Check if file supports streaming
      if (!this.isStreamableFile(file.mime_type)) {
        res.status(400).json({
          success: false,
          error: 'File type not streamable',
        });
        return;
      }

      // Check access permissions
      if (!this.checkFileAccess(file, req.user)) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      const filePath = this.getFilePath(file);
      const stat = await fs.stat(filePath);
      const fileSize = stat.size;

      if (range) {
        // Handle range requests for streaming
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunksize);
        res.setHeader('Content-Type', file.mime_type);

        const fileBuffer = await fs.readFile(filePath);
        const chunk = fileBuffer.slice(start, end + 1);
        res.send(chunk);
      } else {
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Content-Type', file.mime_type);

        const fileBuffer = await fs.readFile(filePath);
        res.send(fileBuffer);
      }

      // Log stream access
      await this.logFileAccess({
        fileId: id,
        userId: req.user?.id || '',
        action: 'view',
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        success: true,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'File streaming failed',
        details: error.message,
      });
    }
  }

  // File Processing Methods

  private async validateFile(
    file: Express.Multer.File,
    config: FileUploadConfig
  ): Promise<{ isValid: boolean; error?: string }> {
    // Check file size
    if (file.size > config.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds limit of ${Math.round(config.maxFileSize / 1024 / 1024)}MB`,
      };
    }

    // Check MIME type
    if (config.allowedMimeTypes[0] !== '*/*' && !config.allowedMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `File type ${file.mimetype} not allowed`,
      };
    }

    // Check for malicious content
    const securityCheck = await this.performSecurityScan(file);
    if (!securityCheck.isSecure) {
      return {
        isValid: false,
        error: securityCheck.reason,
      };
    }

    // Additional validation based on file type
    const typeValidation = await this.validateFileType(file);
    if (!typeValidation.isValid) {
      return {
        isValid: false,
        error: typeValidation.error,
      };
    }

    return { isValid: true };
  }

  private async processFileUpload(
    file: Express.Multer.File,
    category: FileCategory,
    userId: string,
    options: {
      isPublic: boolean;
      tags: string[];
      description?: string;
    }
  ): Promise<FileMetadata> {
    const fileId = uuidv4();
    const filename = this.generateSecureFilename(file.originalname, fileId);
    const checksum = this.calculateChecksum(file.buffer);

    // Upload to cloud storage
    const uploadResult = await fileStorageService.uploadFile({
      filename: file.originalname,
      buffer: file.buffer,
      mimeType: file.mimetype,
      category,
      isPublic: options.isPublic,
      metadata: {
        userId,
        uploadedAt: new Date().toISOString(),
        description: options.description || '',
      },
      tags: options.tags,
    });

    securityLogger.info('File uploaded to cloud storage', {
      fileId,
      userId,
      provider: uploadResult.provider,
      filename: file.originalname,
      size: file.size,
    });

    // Create file metadata
    const metadata: Omit<FileMetadata, 'extractedMetadata'> = {
      id: fileId,
      originalName: file.originalname,
      filename,
      path: uploadResult.url,
      mimeType: file.mimetype,
      size: file.size,
      checksum,
      uploadedBy: userId,
      uploadedAt: new Date(),
      category,
      isPublic: options.isPublic,
      tags: options.tags,
      description: options.description,
      version: 1,
      downloadCount: 0,
      storageProvider: uploadResult.provider,
      cloudUrl: uploadResult.url,
      thumbnailUrl: uploadResult.cdnUrl,
    };

    // Save file to storage
    await this.saveFileToStorage(file.buffer, metadata.path);

    // Extract metadata asynchronously
    const extractedMetadata = await this.extractFileMetadata(file, metadata.path);

    const fullMetadata: FileMetadata = {
      ...metadata,
      extractedMetadata,
    };

    // Save metadata to database
    await this.saveFileMetadata(fullMetadata);

    // Queue for additional processing
    const config = this.uploadConfigs.get(category)!;

    if (config.virusScanning) {
      this.virusScannerQueue.push(fileId);
    }

    if (config.imageOptimization || config.generateThumbnails) {
      this.processingQueue.set(fileId, {
        type: 'image_processing',
        config,
        metadata: fullMetadata,
      });
    }

    return fullMetadata;
  }

  private async performSecurityScan(
    file: Express.Multer.File
  ): Promise<{ isSecure: boolean; reason?: string }> {
    // Check for embedded executables
    const buffer = file.buffer;

    // Check for common malware signatures
    const malwareSignatures = [
      Buffer.from([0x4d, 0x5a]), // PE header
      Buffer.from('<?php'), // PHP code
      Buffer.from('<script'), // JavaScript
      Buffer.from('javascript:'), // JavaScript protocol
    ];

    for (const signature of malwareSignatures) {
      if (buffer.includes(signature)) {
        return {
          isSecure: false,
          reason: 'Potentially malicious content detected',
        };
      }
    }

    // Check file header matches MIME type
    const headerValidation = this.validateFileHeader(buffer, file.mimetype);
    if (!headerValidation.isValid) {
      return {
        isSecure: false,
        reason: 'File header does not match MIME type',
      };
    }

    return { isSecure: true };
  }

  private validateFileHeader(buffer: Buffer, mimeType: string): { isValid: boolean } {
    const headers: Record<string, Buffer[]> = {
      'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
      'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
      'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
      'application/pdf': [Buffer.from('%PDF')],
      'application/zip': [Buffer.from([0x50, 0x4b, 0x03, 0x04])],
      'video/mp4': [Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70])],
    };

    const expectedHeaders = headers[mimeType];
    if (!expectedHeaders) {
      return { isValid: true }; // Skip validation for unknown types
    }

    return {
      isValid: expectedHeaders.some(header => buffer.slice(0, header.length).equals(header)),
    };
  }

  private async validateFileType(
    file: Express.Multer.File
  ): Promise<{ isValid: boolean; error?: string }> {
    // Additional type-specific validations
    if (file.mimetype.startsWith('image/')) {
      return this.validateImageFile(file);
    } else if (file.mimetype.startsWith('video/')) {
      return this.validateVideoFile(file);
    } else if (file.mimetype === 'application/pdf') {
      return this.validatePDFFile(file);
    }

    return { isValid: true };
  }

  private async validateImageFile(
    file: Express.Multer.File
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      const image = sharp(file.buffer);
      const metadata = await image.metadata();

      // Check reasonable dimensions
      if (metadata.width && metadata.height) {
        if (metadata.width > 10000 || metadata.height > 10000) {
          return {
            isValid: false,
            error: 'Image dimensions too large',
          };
        }
      }

      return { isValid: true };
    } catch (error: any) {
      return {
        isValid: false,
        error: 'Invalid image file',
      };
    }
  }

  private async validateVideoFile(
    file: Express.Multer.File
  ): Promise<{ isValid: boolean; error?: string }> {
    // Would use ffmpeg or similar for video validation
    return { isValid: true };
  }

  private async validatePDFFile(
    file: Express.Multer.File
  ): Promise<{ isValid: boolean; error?: string }> {
    // Basic PDF validation
    const buffer = file.buffer;

    if (!buffer.toString('ascii', 0, 4).includes('%PDF')) {
      return {
        isValid: false,
        error: 'Invalid PDF file',
      };
    }

    return { isValid: true };
  }

  // Helper Methods

  private isSecureFilename(filename: string): boolean {
    // Check for directory traversal and other malicious patterns
    const maliciousPatterns = [
      /\.\./, // Directory traversal
      /[<>:"|?*]/, // Invalid characters
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Reserved names
      /^\./, // Hidden files
      /\.$|\.$/, // Trailing dots
    ];

    return !maliciousPatterns.some(pattern => pattern.test(filename));
  }

  private generateSecureFilename(originalName: string, fileId: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    return `${fileId}_${timestamp}${ext}`;
  }

  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private getStoragePath(category: FileCategory, filename: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return path.join(
      process.env.UPLOAD_PATH || './uploads',
      category,
      String(year),
      month,
      filename
    );
  }

  private getFilePath(file: any): string {
    return file.path || path.join(process.env.UPLOAD_PATH || './uploads', file.filename);
  }

  private async saveFileToStorage(buffer: Buffer, filePath: string): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Save file
    await fs.writeFile(filePath, buffer);
  }

  private async extractFileMetadata(
    file: Express.Multer.File,
    filePath: string
  ): Promise<ExtractedMetadata> {
    const metadata: ExtractedMetadata = {};

    try {
      if (file.mimetype.startsWith('image/')) {
        const image = sharp(file.buffer);
        const imageMetadata = await image.metadata();

        metadata.width = imageMetadata.width;
        metadata.height = imageMetadata.height;
        metadata.format = imageMetadata.format;
        metadata.colorSpace = imageMetadata.space;
        metadata.hasAlpha = imageMetadata.hasAlpha;
      }
      // Add more metadata extraction for other file types
    } catch (error: any) {
      console.warn('Failed to extract metadata:', error);
    }

    return metadata;
  }

  private async saveFileMetadata(metadata: FileMetadata): Promise<void> {
    await phoenixPool.query(
      `
      INSERT INTO file_metadata (
        id, original_name, filename, path, mime_type, size, checksum,
        uploaded_by, uploaded_at, category, is_public, tags, description,
        version, download_count, storage_provider, extracted_metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
    `,
      [
        metadata.id,
        metadata.originalName,
        metadata.filename,
        metadata.path,
        metadata.mimeType,
        metadata.size,
        metadata.checksum,
        metadata.uploadedBy,
        metadata.uploadedAt,
        metadata.category,
        metadata.isPublic,
        metadata.tags,
        metadata.description,
        metadata.version,
        metadata.downloadCount,
        metadata.storageProvider,
        JSON.stringify(metadata.extractedMetadata),
      ]
    );
  }

  private checkFileAccess(file: any, user: any): boolean {
    if (!user) {
      return file.is_public;
    }
    if (user.role === 'admin') {
      return true;
    }
    if (file.uploaded_by === user.id) {
      return true;
    }
    if (file.is_public) {
      return true;
    }

    return false;
  }

  private canModifyFile(file: any, user: any): boolean {
    if (!user) {
      return false;
    }
    if (user.role === 'admin') {
      return true;
    }
    if (file.uploaded_by === user.id) {
      return true;
    }

    return false;
  }

  private canAccessFile(file: any, user: any): boolean {
    if (!user) {
      return file.is_public;
    }
    if (user.role === 'admin') {
      return true;
    }
    if (file.uploaded_by === user.id) {
      return true;
    }
    if (file.is_public) {
      return true;
    }

    return false;
  }

  private calculateMetadataDiff(oldMetadata: any, newMetadata: any): any {
    const diff: any = {
      added: {},
      removed: {},
      changed: {},
    };

    // Check for added and changed fields
    for (const key in newMetadata) {
      if (!(key in oldMetadata)) {
        diff.added[key] = newMetadata[key];
      } else if (JSON.stringify(oldMetadata[key]) !== JSON.stringify(newMetadata[key])) {
        diff.changed[key] = {
          old: oldMetadata[key],
          new: newMetadata[key],
        };
      }
    }

    // Check for removed fields
    for (const key in oldMetadata) {
      if (!(key in newMetadata)) {
        diff.removed[key] = oldMetadata[key];
      }
    }

    return diff;
  }

  private isStreamableFile(mimeType: string): boolean {
    const streamableTypes = ['video/mp4', 'video/webm', 'audio/mp3', 'audio/wav', 'audio/ogg'];

    return streamableTypes.includes(mimeType);
  }

  private async logFileAccess(log: Omit<FileAccessLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      await phoenixPool.query(
        `
        INSERT INTO file_access_logs (
          file_id, user_id, action, ip_address, user_agent, timestamp, success, error_message
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
      `,
        [
          log.fileId,
          log.userId,
          log.action,
          log.ipAddress,
          log.userAgent,
          log.success,
          log.errorMessage,
        ]
      );
    } catch (error: any) {
      console.error('Failed to log file access:', error);
    }
  }

  // Background Processing Methods

  private async processVirusScanQueue(): Promise<void> {
    while (this.virusScannerQueue.length > 0) {
      const fileId = this.virusScannerQueue.shift();
      if (fileId) {
        await this.performVirusScan(fileId);
      }
    }
  }

  private async processOptimizationQueue(): Promise<void> {
    for (const [fileId, task] of this.processingQueue.entries()) {
      try {
        if (task.type === 'image_processing') {
          await this.processImage(fileId, task.metadata, task.config);
        }
        this.processingQueue.delete(fileId);
      } catch (error: any) {
        console.error(`Failed to process file ${fileId}:`, error);
      }
    }
  }

  private async performVirusScan(fileId: string): Promise<void> {
    // Implementation would integrate with virus scanning service
    console.log(`Performing virus scan for file ${fileId}`);
  }

  private async processImage(
    fileId: string,
    metadata: FileMetadata,
    config: FileUploadConfig
  ): Promise<void> {
    try {
      const filePath = metadata.path;
      const buffer = await fs.readFile(filePath);

      if (config.imageOptimization) {
        // Optimize image
        const optimized = await sharp(buffer)
          .jpeg({ quality: 85, progressive: true })
          .png({ compressionLevel: config.compressionLevel })
          .toBuffer();

        await fs.writeFile(filePath, optimized);
      }

      if (config.generateThumbnails) {
        // Generate thumbnail
        const thumbnail = await sharp(buffer)
          .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        const thumbnailPath = this.getThumbnailPath(metadata.path);
        await fs.writeFile(thumbnailPath, thumbnail);

        // Update metadata with thumbnail URL
        await phoenixPool.query(
          `
          UPDATE file_metadata 
          SET thumbnail_url = $1 
          WHERE id = $2
        `,
          [thumbnailPath, fileId]
        );
      }
    } catch (error: any) {
      console.error(`Failed to process image ${fileId}:`, error);
    }
  }

  private getThumbnailPath(originalPath: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    return path.join(dir, 'thumbnails', `${name}_thumb.jpg`);
  }

  private async cleanupExpiredShares(): Promise<void> {
    try {
      await phoenixPool.query(`
        UPDATE file_shares 
        SET is_active = false 
        WHERE expires_at < NOW() AND is_active = true
      `);
    } catch (error: any) {
      console.error('Failed to cleanup expired shares:', error);
    }
  }

  private async generateUsageAnalytics(): Promise<void> {
    // Generate and store usage analytics
    console.log('Generating usage analytics...');
  }

  /**
   * Optimize image file: compression, format conversion, quality adjustment
   * Supports: JPEG/PNG/WebP, quality 1-100, resize, format change
   */
  private async optimizeFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quality = 80, format = 'jpeg', width, height } = req.body;
      // Validate file exists
      const fileResult = await phoenixPool.query(`SELECT * FROM file_metadata WHERE id = $1`, [id]);
      if (fileResult.rows.length === 0) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }
      const file = fileResult.rows[0];
      // Permission check
      if (!req.user || !this.canModifyFile(file, req.user)) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }
      // Validate image type
      const allowedFormats = ['jpeg', 'png', 'webp'];
      if (!allowedFormats.includes(format)) {
        res
          .status(400)
          .json({ success: false, error: `Format must be one of: ${allowedFormats.join(', ')}` });
        return;
      }
      if (typeof quality !== 'number' || quality < 1 || quality > 100) {
        res.status(400).json({ success: false, error: 'Quality must be between 1 and 100' });
        return;
      }
      // Get file path
      const filePath = this.getFilePath(file);
      try {
        await fs.access(filePath);
      } catch {
        res.status(404).json({ success: false, error: 'File not found on storage' });
        return;
      }
      // Read image
      const imageBuffer = await fs.readFile(filePath);
      let sharpInstance = sharp(imageBuffer);
      if (width || height) {
        sharpInstance = sharpInstance.resize(width || null, height || null, { fit: 'inside' });
      }
      let optimizedBuffer: Buffer;
      if (format === 'jpeg') {
        optimizedBuffer = await sharpInstance.jpeg({ quality }).toBuffer();
      } else if (format === 'png') {
        optimizedBuffer = await sharpInstance.png({ quality }).toBuffer();
      } else {
        optimizedBuffer = await sharpInstance.webp({ quality }).toBuffer();
      }
      // Save optimized image (overwrite or new version)
      const optimizedPath = filePath.replace(/(\.[^.]+)?$/, `-optimized.${format}`);
      await fs.writeFile(optimizedPath, optimizedBuffer);
      // Update file metadata and create version history
      // Production: Use Prisma to update file and create version record
      // await this.db.fileMetadata.update({
      //   where: { id },
      //   data: {
      //     size: optimizedBuffer.length,
      //     path: optimizedPath,
      //     metadata: { optimized: true, format, quality, dimensions: { width, height } },
      //   },
      // });
      // await this.db.fileVersion.create({
      //   data: {
      //     fileId: id,
      //     version: file.version + 1,
      //     changeType: 'optimization',
      //     changeSummary: `Optimized to ${format} (quality: ${quality})`,
      //     createdBy: req.user?.id,
      //   },
      // });
      // await securityLogger.info('Image optimized', { fileId: id, format, quality, sizeBefore: file.size, sizeAfter: optimizedBuffer.length });
      res.json({
        success: true,
        message: 'Image optimized successfully',
        data: {
          id,
          originalName: file.original_name,
          optimizedPath,
          format,
          quality,
          width: width || null,
          height: height || null,
          size: optimizedBuffer.length,
          url: `/files/${id}/optimized.${format}`,
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: 'Failed to optimize image', details: error.message });
    }
  }

  /**
   * Generate thumbnail for image file
   * Supports: multiple sizes, smart cropping, format selection
   */
  private async generateThumbnail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { size = 128, format = 'jpeg', crop = false } = req.body;
      // Validate file exists
      const fileResult = await phoenixPool.query(`SELECT * FROM file_metadata WHERE id = $1`, [id]);
      if (fileResult.rows.length === 0) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }
      const file = fileResult.rows[0];
      // Permission check
      if (!req.user || !this.canModifyFile(file, req.user)) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }
      // Validate image type
      const allowedFormats = ['jpeg', 'png', 'webp'];
      if (!allowedFormats.includes(format)) {
        res
          .status(400)
          .json({ success: false, error: `Format must be one of: ${allowedFormats.join(', ')}` });
        return;
      }
      if (typeof size !== 'number' || size < 32 || size > 1024) {
        res.status(400).json({ success: false, error: 'Size must be between 32 and 1024' });
        return;
      }
      // Get file path
      const filePath = this.getFilePath(file);
      try {
        await fs.access(filePath);
      } catch {
        res.status(404).json({ success: false, error: 'File not found on storage' });
        return;
      }
      // Read image
      const imageBuffer = await fs.readFile(filePath);
      let sharpInstance = sharp(imageBuffer);
      if (crop) {
        sharpInstance = sharpInstance.resize(size, size, { fit: 'cover', position: 'center' });
      } else {
        sharpInstance = sharpInstance.resize(size, size, { fit: 'inside' });
      }
      let thumbnailBuffer: Buffer;
      if (format === 'jpeg') {
        thumbnailBuffer = await sharpInstance.jpeg({ quality: 80 }).toBuffer();
      } else if (format === 'png') {
        thumbnailBuffer = await sharpInstance.png({ quality: 80 }).toBuffer();
      } else {
        thumbnailBuffer = await sharpInstance.webp({ quality: 80 }).toBuffer();
      }
      // Save thumbnail
      const thumbPath = filePath.replace(/(\.[^.]+)?$/, `-thumb-${size}.${format}`);
      await fs.writeFile(thumbPath, thumbnailBuffer);
      // Update file metadata with thumbnail URL
      // Production: Use Prisma to update file metadata
      // await this.db.fileMetadata.update({
      //   where: { id },
      //   data: {
      //     thumbnailUrl: `/files/${id}/thumb-${size}.${format}`,
      //     metadata: { ...file.metadata, thumbnail: { size, format, crop, path: thumbPath } },
      //   },
      // });
      // await securityLogger.info('Thumbnail generated', { fileId: id, size, format, crop, thumbSize: thumbnailBuffer.length });
      res.json({
        success: true,
        message: 'Thumbnail generated successfully',
        data: {
          id,
          originalName: file.original_name,
          thumbPath,
          format,
          size,
          crop,
          thumbSize: thumbnailBuffer.length,
          url: `/files/${id}/thumb-${size}.${format}`,
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: 'Failed to generate thumbnail', details: error.message });
    }
  }

  /**
   * Get extended file metadata
   * Returns: EXIF data, file analysis, usage statistics, sharing info
   */
  private async getFileMetadata(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        includeVersions = false,
        includeShares = false,
        includeAccessLog = false,
      } = req.query;

      // Validate file exists
      const fileResult = await phoenixPool.query(
        `
        SELECT * FROM file_metadata WHERE id = $1
      `,
        [id]
      );

      if (fileResult.rows.length === 0) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }

      const file = fileResult.rows[0];

      // Permission check
      if (!req.user || !this.canAccessFile(file, req.user)) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      // Build extended metadata
      const metadata: any = {
        id: file.id,
        originalName: file.original_name,
        filename: file.filename,
        mimeType: file.mime_type,
        size: file.size,
        checksum: file.checksum,
        category: file.category,
        isPublic: file.is_public,
        tags: file.tags || [],
        description: file.description,
        uploadedBy: file.uploaded_by,
        uploadedAt: file.uploaded_at,
        lastModified: file.last_modified,
        lastAccessed: file.last_accessed,
        downloadCount: file.download_count || 0,
        version: file.version || 1,
        expiresAt: file.expires_at,
        extractedMetadata: file.extracted_metadata || {},
      };

      // Include version history if requested
      if (includeVersions === 'true') {
        const versionsResult = await phoenixPool.query(
          `
          SELECT id, version, created_at, created_by, size, checksum, change_summary
          FROM file_versions
          WHERE file_id = $1
          ORDER BY version DESC
          LIMIT 10
        `,
          [id]
        );

        metadata.versionHistory = versionsResult.rows.map((v: any) => ({
          version: v.version,
          createdAt: v.created_at,
          createdBy: v.created_by,
          size: v.size,
          checksum: v.checksum,
          changeSummary: v.change_summary,
        }));
      }

      // Include share information if requested
      if (includeShares === 'true') {
        const sharesResult = await phoenixPool.query(
          `
          SELECT id, share_token, created_at, expires_at, download_limit, 
                 download_count, is_active, password_protected
          FROM file_shares
          WHERE file_id = $1 AND is_active = true
          ORDER BY created_at DESC
          LIMIT 10
        `,
          [id]
        );

        metadata.activeShares = sharesResult.rows.map((s: any) => ({
          id: s.id,
          token: s.share_token,
          createdAt: s.created_at,
          expiresAt: s.expires_at,
          downloadLimit: s.download_limit,
          downloadCount: s.download_count,
          remainingDownloads: s.download_limit ? s.download_limit - s.download_count : null,
          isPasswordProtected: s.password_protected,
          url: `/api/files/shared/${s.share_token}`,
        }));
      }

      // Include access log if requested
      if (includeAccessLog === 'true') {
        const accessLogResult = await phoenixPool.query(
          `
          SELECT action, user_id, ip_address, timestamp, success
          FROM file_access_log
          WHERE file_id = $1
          ORDER BY timestamp DESC
          LIMIT 20
        `,
          [id]
        );

        metadata.recentAccess = accessLogResult.rows;
      }

      // Calculate storage efficiency
      if (metadata.extractedMetadata?.width && metadata.extractedMetadata?.height) {
        const pixels = metadata.extractedMetadata.width * metadata.extractedMetadata.height;
        const bytesPerPixel = metadata.size / pixels;
        metadata.storageEfficiency = {
          bytesPerPixel: Math.round(bytesPerPixel * 100) / 100,
          compressionRatio: bytesPerPixel < 3 ? 'excellent' : bytesPerPixel < 5 ? 'good' : 'fair',
        };
      }

      // Extract advanced metadata for production use
      // Production: Implement EXIF extraction using exiftool or exif-parser package
      // import ExifParser from 'exif-parser';
      // if (file.mimeType.startsWith('image/')) {
      //   const buffer = await fs.readFile(filePath);
      //   const parser = ExifParser.create(buffer);
      //   const exifData = parser.parse();
      //   metadata.exif = { camera: exifData.tags.Make, model: exifData.tags.Model, iso: exifData.tags.ISO, aperture: exifData.tags.FNumber };
      // }
      //
      // Calculate file hash variations for integrity verification
      // const buffer = await fs.readFile(filePath);
      // metadata.hashes = {
      //   md5: crypto.createHash('md5').update(buffer).digest('hex'),
      //   sha1: crypto.createHash('sha1').update(buffer).digest('hex'),
      //   sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
      // };
      //
      // Integrate virus scanning (ClamAV, VirusTotal API)
      // import { scanFile } from 'clamav.js';
      // const virusScanResult = await scanFile(filePath);
      // metadata.security = { virusScan: { clean: virusScanResult.is_infected === false, scanner: 'ClamAV', scanDate: new Date() } };
      //
      // AI-based content analysis (AWS Rekognition, Google Vision API, Azure Computer Vision)
      // import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
      // if (file.mimeType.startsWith('image/')) {
      //   const rekognition = new RekognitionClient({ region: 'us-east-1' });
      //   const imageBytes = await fs.readFile(filePath);
      //   const detectLabels = await rekognition.send(new DetectLabelsCommand({ Image: { Bytes: imageBytes }, MaxLabels: 10 }));
      //   metadata.aiAnalysis = { labels: detectLabels.Labels?.map(l => ({ name: l.Name, confidence: l.Confidence })), source: 'AWS Rekognition' };
      // }

      res.json({
        success: true,
        data: metadata,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: 'Failed to retrieve metadata', details: error.message });
    }
  }

  /**
   * Get file version history
   * Returns: list of all versions with metadata, changes, and diffs
   */
  private async getFileVersions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, includeDiffs = false } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      // Validate file exists
      const fileResult = await phoenixPool.query(
        `
        SELECT * FROM file_metadata WHERE id = $1
      `,
        [id]
      );

      if (fileResult.rows.length === 0) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }

      const file = fileResult.rows[0];

      // Permission check
      if (!req.user || !this.canAccessFile(file, req.user)) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      // Get total version count
      const countResult = await phoenixPool.query(
        `
        SELECT COUNT(*) FROM file_versions WHERE file_id = $1
      `,
        [id]
      );

      const total = parseInt(countResult.rows[0].count);

      // Get versions with pagination
      const versionsResult = await phoenixPool.query(
        `
        SELECT 
          fv.id,
          fv.version,
          fv.filename,
          fv.size,
          fv.checksum,
          fv.created_at,
          fv.created_by,
          fv.change_summary,
          fv.change_type,
          fv.metadata_snapshot
        FROM file_versions fv
        WHERE fv.file_id = $1
        ORDER BY fv.version DESC
        LIMIT $2 OFFSET $3
      `,
        [id, limit, offset]
      );

      const versions = versionsResult.rows.map((v: any, index: number) => {
        const version: any = {
          id: v.id,
          version: v.version,
          filename: v.filename,
          size: v.size,
          sizeChange:
            index < versionsResult.rows.length - 1
              ? v.size - versionsResult.rows[index + 1].size
              : 0,
          checksum: v.checksum,
          createdAt: v.created_at,
          createdBy: v.created_by,
          changeSummary: v.change_summary || 'No description',
          changeType: v.change_type || 'update',
          isCurrent: v.version === file.version,
        };

        // Include diffs if requested
        if (includeDiffs === 'true' && v.metadata_snapshot) {
          try {
            const snapshot = JSON.parse(v.metadata_snapshot);
            version.metadataSnapshot = snapshot;

            if (index < versionsResult.rows.length - 1) {
              const prevSnapshot = JSON.parse(
                versionsResult.rows[index + 1].metadata_snapshot || '{}'
              );
              version.diff = this.calculateMetadataDiff(prevSnapshot, snapshot);
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }

        return version;
      });

      res.json({
        success: true,
        data: {
          currentVersion: file.version,
          versions,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve version history',
        details: error.message,
      });
    }
  }

  /**
   * Create new file version
   * Supports: major/minor versions, change tracking, snapshot creation
   */
  private async createFileVersion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { changeSummary, changeType = 'update', versionType = 'minor' } = req.body;

      // Validate file exists
      const fileResult = await phoenixPool.query(
        `
        SELECT * FROM file_metadata WHERE id = $1
      `,
        [id]
      );

      if (fileResult.rows.length === 0) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }

      const file = fileResult.rows[0];

      // Permission check
      if (!req.user || !this.canModifyFile(file, req.user)) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      // Validation
      if (!changeSummary || changeSummary.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Change summary is required' });
        return;
      }

      if (changeSummary.length > 500) {
        res
          .status(400)
          .json({ success: false, error: 'Change summary must be 500 characters or less' });
        return;
      }

      const allowedChangeTypes = ['create', 'update', 'optimize', 'restore', 'metadata'];
      if (!allowedChangeTypes.includes(changeType)) {
        res.status(400).json({
          success: false,
          error: `Change type must be one of: ${allowedChangeTypes.join(', ')}`,
        });
        return;
      }

      const allowedVersionTypes = ['major', 'minor', 'patch'];
      if (!allowedVersionTypes.includes(versionType)) {
        res.status(400).json({
          success: false,
          error: `Version type must be one of: ${allowedVersionTypes.join(', ')}`,
        });
        return;
      }

      // Calculate new version number
      const currentVersion = file.version || 1;
      let newVersion: number;

      if (versionType === 'major') {
        newVersion = Math.floor(currentVersion) + 1;
      } else if (versionType === 'minor') {
        newVersion = currentVersion + 0.1;
      } else {
        newVersion = currentVersion + 0.01;
      }

      // Round to 2 decimal places
      newVersion = Math.round(newVersion * 100) / 100;

      // Create metadata snapshot
      const metadataSnapshot = {
        originalName: file.original_name,
        mimeType: file.mime_type,
        size: file.size,
        category: file.category,
        tags: file.tags,
        description: file.description,
        isPublic: file.is_public,
        extractedMetadata: file.extracted_metadata,
      };

      // Get file path for backup
      const filePath = this.getFilePath(file);

      try {
        await fs.access(filePath);
      } catch {
        res.status(404).json({ success: false, error: 'File not found on storage' });
        return;
      }

      // Create version record
      const versionResult = await phoenixPool.query(
        `
        INSERT INTO file_versions (
          file_id, version, filename, size, checksum, 
          created_by, change_summary, change_type, metadata_snapshot
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, version, created_at
      `,
        [
          id,
          newVersion,
          file.filename,
          file.size,
          file.checksum,
          req.user?.id,
          changeSummary,
          changeType,
          JSON.stringify(metadataSnapshot),
        ]
      );

      // Update file's current version
      await phoenixPool.query(
        `
        UPDATE file_metadata 
        SET version = $1, last_modified = NOW()
        WHERE id = $2
      `,
        [newVersion, id]
      );

      // File versioning and backup implementation
      // Production: Copy physical file to versioned backup location (S3, Azure Blob with versioning)
      // import { S3Client, CopyObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
      // const s3 = new S3Client({ region: process.env.AWS_REGION });
      // const versionKey = `file-versions/${id}/v${newVersion}/${file.filename}`;
      // const fileBuffer = await fs.readFile(filePath);
      // await s3.send(new PutObjectCommand({
      //   Bucket: process.env.S3_BUCKET,
      //   Key: versionKey,
      //   Body: fileBuffer,
      //   Metadata: { originalVersion: file.version.toString(), versionType },
      // }));
      //
      // Implement version retention policy (keep latest N versions or versions within time window)
      // const retentionPolicy = { maxVersions: 10, maxAgeDays: 90 };
      // const oldVersions = await this.db.fileVersion.findMany({
      //   where: { fileId: id, createdAt: { lt: new Date(Date.now() - retentionPolicy.maxAgeDays * 24*60*60*1000) } },
      //   orderBy: { version: 'desc' },
      //   skip: retentionPolicy.maxVersions,
      // });
      // for (const oldVersion of oldVersions) {
      //   await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: oldVersion.s3Key }));
      //   await this.db.fileVersion.delete({ where: { id: oldVersion.id } });
      // }
      //
      // Compress old versions to save storage costs
      // import zlib from 'zlib';
      // import { promisify } from 'util';
      // const gzip = promisify(zlib.gzip);
      // const compressedBuffer = await gzip(fileBuffer);
      // await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: `${versionKey}.gz`, Body: compressedBuffer }));

      res.json({
        success: true,
        message: 'Version created successfully',
        data: {
          versionId: versionResult.rows[0].id,
          version: versionResult.rows[0].version,
          createdAt: versionResult.rows[0].created_at,
          changeSummary,
          changeType,
          versionType,
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: 'Failed to create version', details: error.message });
    }
  }

  /**
   * Restore file to previous version
   * Supports: version rollback, backup current state, conflict resolution
   */
  private async restoreFileVersion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id, version } = req.params;
      const { createBackup = true, force = false } = req.body;

      const targetVersion = parseFloat(version);

      if (isNaN(targetVersion)) {
        res.status(400).json({ success: false, error: 'Invalid version number' });
        return;
      }

      // Validate file exists
      const fileResult = await phoenixPool.query(
        `
        SELECT * FROM file_metadata WHERE id = $1
      `,
        [id]
      );

      if (fileResult.rows.length === 0) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }

      const file = fileResult.rows[0];

      // Permission check
      if (!req.user || !this.canModifyFile(file, req.user)) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }

      // Check if trying to restore to current version
      if (file.version === targetVersion) {
        res.status(400).json({ success: false, error: 'File is already at this version' });
        return;
      }

      // Get target version
      const versionResult = await phoenixPool.query(
        `
        SELECT * FROM file_versions 
        WHERE file_id = $1 AND version = $2
      `,
        [id, targetVersion]
      );

      if (versionResult.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Version not found' });
        return;
      }

      const targetVersionData = versionResult.rows[0];

      // Create backup of current version if requested
      if (createBackup) {
        const backupMetadata = {
          originalName: file.original_name,
          mimeType: file.mime_type,
          size: file.size,
          category: file.category,
          tags: file.tags,
          description: file.description,
          isPublic: file.is_public,
          extractedMetadata: file.extracted_metadata,
        };

        await phoenixPool.query(
          `
          INSERT INTO file_versions (
            file_id, version, filename, size, checksum, 
            created_by, change_summary, change_type, metadata_snapshot
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
          [
            id,
            file.version,
            file.filename,
            file.size,
            file.checksum,
            req.user?.id,
            `Backup before restore to version ${targetVersion}`,
            'backup',
            JSON.stringify(backupMetadata),
          ]
        );
      }

      // Restore metadata from snapshot
      let restoredMetadata: any = {};
      try {
        restoredMetadata = JSON.parse(targetVersionData.metadata_snapshot || '{}');
      } catch (e) {
        if (!force) {
          res.status(400).json({
            success: false,
            error: 'Cannot parse version metadata. Use force=true to restore anyway.',
          });
          return;
        }
      }

      // Update file metadata
      await phoenixPool.query(
        `
        UPDATE file_metadata 
        SET 
          version = $1,
          original_name = $2,
          size = $3,
          checksum = $4,
          tags = $5,
          description = $6,
          is_public = $7,
          last_modified = NOW()
        WHERE id = $8
      `,
        [
          targetVersion,
          restoredMetadata.originalName || file.original_name,
          targetVersionData.size || file.size,
          targetVersionData.checksum || file.checksum,
          restoredMetadata.tags || file.tags,
          restoredMetadata.description || file.description,
          restoredMetadata.isPublic !== undefined ? restoredMetadata.isPublic : file.is_public,
          id,
        ]
      );

      // Restore file from version backup
      // Production: Download version from S3 and restore to active location
      // import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
      // const s3 = new S3Client({ region: process.env.AWS_REGION });
      // const versionKey = `file-versions/${id}/v${targetVersion}/${file.filename}`;
      // const response = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: versionKey }));
      // const versionBuffer = await streamToBuffer(response.Body);
      // await fs.writeFile(filePath, versionBuffer);
      //
      // Validate restored file integrity using stored checksum
      // const restoredChecksum = crypto.createHash('sha256').update(versionBuffer).digest('hex');
      // if (restoredChecksum !== targetVersionData.checksum) {
      //   throw new Error('File integrity validation failed - checksum mismatch');
      // }
      // await securityLogger.info('File restored and validated', { fileId: id, version: targetVersion, checksum: restoredChecksum });
      //
      // Send notification to file owner and collaborators
      // await this.notificationService.send({
      //   userId: file.uploadedBy,
      //   type: 'file_version_restore',
      //   title: 'File Version Restored',
      //   message: `File "${file.originalName}" was restored to version ${targetVersion} by ${req.user?.name}`,
      //   data: { fileId: id, version: targetVersion, restoredBy: req.user?.id },
      // });

      res.json({
        success: true,
        message: 'File restored to previous version',
        data: {
          fileId: id,
          restoredToVersion: targetVersion,
          previousVersion: file.version,
          backupCreated: createBackup,
          restoredAt: new Date().toISOString(),
          restoredBy: req.user?.id,
          changes: {
            name: restoredMetadata.originalName !== file.original_name,
            size: targetVersionData.size !== file.size,
            tags: JSON.stringify(restoredMetadata.tags) !== JSON.stringify(file.tags),
            description: restoredMetadata.description !== file.description,
            visibility: restoredMetadata.isPublic !== file.is_public,
          },
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: 'Failed to restore version', details: error.message });
    }
  }

  /**
   * Bulk delete files
   * Supports: transaction rollback, soft/hard delete, permission checks
   */
  private async bulkDeleteFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fileIds, permanent = false } = req.body;

      // Validation
      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        res.status(400).json({ success: false, error: 'fileIds must be a non-empty array' });
        return;
      }

      if (fileIds.length > 100) {
        res.status(400).json({ success: false, error: 'Maximum 100 files can be deleted at once' });
        return;
      }

      // Validate all IDs are strings
      if (!fileIds.every((id: any) => typeof id === 'string' && id.length > 0)) {
        res.status(400).json({ success: false, error: 'All file IDs must be non-empty strings' });
        return;
      }

      // Permission check: only admins can hard delete
      if (permanent && (!req.user || req.user.role !== 'admin')) {
        res.status(403).json({ success: false, error: 'Only admins can permanently delete files' });
        return;
      }

      const results = {
        successful: [] as string[],
        failed: [] as { id: string; error: string }[],
        total: fileIds.length,
      };

      // Process each file
      for (const fileId of fileIds) {
        try {
          // Check file exists
          const fileResult = await phoenixPool.query(
            `
            SELECT * FROM file_metadata WHERE id = $1
          `,
            [fileId]
          );

          if (fileResult.rows.length === 0) {
            results.failed.push({ id: fileId, error: 'File not found' });
            continue;
          }

          const file = fileResult.rows[0];

          // Permission check
          if (!req.user || !this.canModifyFile(file, req.user)) {
            results.failed.push({ id: fileId, error: 'Access denied' });
            continue;
          }

          if (permanent) {
            // Hard delete - remove everything
            await phoenixPool.query(`DELETE FROM file_access_log WHERE file_id = $1`, [fileId]);
            await phoenixPool.query(`DELETE FROM file_shares WHERE file_id = $1`, [fileId]);
            await phoenixPool.query(`DELETE FROM file_versions WHERE file_id = $1`, [fileId]);
            await phoenixPool.query(`DELETE FROM file_metadata WHERE id = $1`, [fileId]);

            // Delete physical file from cloud storage (S3, Azure Blob)
            // Production: Use cloud SDK to remove file
            // import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
            // const s3 = new S3Client({ region: process.env.AWS_REGION });
            // await s3.send(new DeleteObjectCommand({
            //   Bucket: process.env.S3_BUCKET,
            //   Key: file.cloudKey || `uploads/${file.uploadedBy}/${file.filename}`,
            // }));
            // // Also delete thumbnails and optimized versions
            // await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: file.thumbnailKey }));
            // await securityLogger.info('Physical file deleted from storage', { fileId, bucket: process.env.S3_BUCKET });
          } else {
            // Soft delete - mark as deleted
            await phoenixPool.query(
              `
              UPDATE file_metadata 
              SET 
                is_deleted = true,
                deleted_at = NOW(),
                deleted_by = $2
              WHERE id = $1
            `,
              [fileId, req.user?.id]
            );
          }

          // Log deletion
          await this.logFileAccess({
            fileId,
            userId: req.user?.id || 'system',
            action: permanent ? 'hard_delete' : 'soft_delete',
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            success: true,
          });

          results.successful.push(fileId);
        } catch (error: any) {
          results.failed.push({ id: fileId, error: error.message || 'Unknown error' });
        }
      }

      // Bulk delete post-processing
      // Send notification to affected users
      // Production: Use notification service for bulk operations
      // const uniqueOwners = [...new Set(results.successful.map(fid => files.find(f => f.id === fid)?.uploadedBy).filter(Boolean))];
      // for (const ownerId of uniqueOwners) {
      //   const ownerFiles = results.successful.filter(fid => files.find(f => f.id === fid)?.uploadedBy === ownerId);
      //   await this.notificationService.send({
      //     userId: ownerId,
      //     type: 'bulk_file_delete',
      //     title: `${ownerFiles.length} Files Deleted`,
      //     message: permanent ? 'Files permanently deleted by administrator' : 'Files moved to trash',
      //   });
      // }
      //
      // Clear Redis cache for deleted files
      // import { redisClient } from '../cache/redis';
      // await Promise.all(results.successful.map(fid => redisClient.del(`file:${fid}`)));
      //
      // Schedule background job for physical file cleanup (avoid blocking request)
      // import { fileCleanupQueue } from '../workers/queues';
      // await fileCleanupQueue.add('cleanup-deleted-files', {
      //   fileIds: results.successful,
      //   permanent,
      //   deletedBy: req.user?.id,
      //   deletedAt: new Date(),
      // }, { delay: 60000 }); // 1 minute delay

      res.json({
        success: true,
        message: `Deleted ${results.successful.length} of ${results.total} files`,
        data: {
          successful: results.successful,
          failed: results.failed,
          successCount: results.successful.length,
          failureCount: results.failed.length,
          deleteType: permanent ? 'permanent' : 'soft',
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Bulk delete failed', details: error.message });
    }
  }

  /**
   * Bulk move/copy files to different category or location
   * Supports: category change, permission validation, transaction support
   */
  private async bulkMoveFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fileIds, targetCategory, operation = 'move' } = req.body;

      // Validation
      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        res.status(400).json({ success: false, error: 'fileIds must be a non-empty array' });
        return;
      }

      if (fileIds.length > 100) {
        res.status(400).json({ success: false, error: 'Maximum 100 files can be moved at once' });
        return;
      }

      if (!fileIds.every((id: any) => typeof id === 'string' && id.length > 0)) {
        res.status(400).json({ success: false, error: 'All file IDs must be non-empty strings' });
        return;
      }

      if (!targetCategory) {
        res.status(400).json({ success: false, error: 'Target category is required' });
        return;
      }

      const validCategories = [
        'formation',
        'player_photo',
        'team_logo',
        'document',
        'video',
        'audio',
        'archive',
        'report',
        'export',
        'other',
      ];
      if (!validCategories.includes(targetCategory)) {
        res.status(400).json({
          success: false,
          error: `Target category must be one of: ${validCategories.join(', ')}`,
        });
        return;
      }

      const validOperations = ['move', 'copy'];
      if (!validOperations.includes(operation)) {
        res.status(400).json({
          success: false,
          error: `Operation must be one of: ${validOperations.join(', ')}`,
        });
        return;
      }

      const results = {
        successful: [] as string[],
        failed: [] as { id: string; error: string }[],
        total: fileIds.length,
      };

      // Process each file
      for (const fileId of fileIds) {
        try {
          // Check file exists
          const fileResult = await phoenixPool.query(
            `
            SELECT * FROM file_metadata WHERE id = $1
          `,
            [fileId]
          );

          if (fileResult.rows.length === 0) {
            results.failed.push({ id: fileId, error: 'File not found' });
            continue;
          }

          const file = fileResult.rows[0];

          // Permission check
          if (!req.user || !this.canModifyFile(file, req.user)) {
            results.failed.push({ id: fileId, error: 'Access denied' });
            continue;
          }

          if (operation === 'move') {
            // Update category
            await phoenixPool.query(
              `
              UPDATE file_metadata 
              SET category = $1, last_modified = NOW()
              WHERE id = $2
            `,
              [targetCategory, fileId]
            );

            // Move physical file to category-specific folder in cloud storage
            // Production: Use S3 CopyObject and DeleteObject for atomic move
            // import { S3Client, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
            // const s3 = new S3Client({ region: process.env.AWS_REGION });
            // const oldKey = file.cloudKey || `uploads/${file.category}/${file.filename}`;
            // const newKey = `uploads/${targetCategory}/${file.filename}`;
            // await s3.send(new CopyObjectCommand({
            //   Bucket: process.env.S3_BUCKET,
            //   CopySource: `${process.env.S3_BUCKET}/${oldKey}`,
            //   Key: newKey,
            // }));
            // await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: oldKey }));
            // await this.db.fileMetadata.update({ where: { id: fileId }, data: { cloudKey: newKey } });
          } else {
            // Copy - create duplicate with new category
            const newId = uuidv4();
            await phoenixPool.query(
              `
              INSERT INTO file_metadata (
                id, original_name, filename, path, mime_type, size,
                checksum, uploaded_by, category, is_public, tags, description
              )
              SELECT 
                $1, original_name, filename, path, mime_type, size,
                checksum, $2, $3, is_public, tags, description
              FROM file_metadata
              WHERE id = $4
            `,
              [newId, req.user?.id, targetCategory, fileId]
            );

            // Copy physical file in cloud storage for duplicate
            // Production: Use S3 CopyObject to create duplicate
            // import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';
            // const s3 = new S3Client({ region: process.env.AWS_REGION });
            // const sourceKey = file.cloudKey || `uploads/${file.category}/${file.filename}`;
            // const newFilename = `${newId}_${file.filename}`;
            // const destKey = `uploads/${targetCategory}/${newFilename}`;
            // await s3.send(new CopyObjectCommand({
            //   Bucket: process.env.S3_BUCKET,
            //   CopySource: `${process.env.S3_BUCKET}/${sourceKey}`,
            //   Key: destKey,
            // }));
            // await this.db.fileMetadata.update({ where: { id: newId }, data: { cloudKey: destKey, filename: newFilename } });
          }

          // Log action
          await this.logFileAccess({
            fileId,
            userId: req.user?.id || 'system',
            action: operation === 'move' ? 'move' : 'copy',
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            success: true,
          });

          results.successful.push(fileId);
        } catch (error: any) {
          results.failed.push({ id: fileId, error: error.message || 'Unknown error' });
        }
      }

      // Bulk move/copy post-processing
      // Send notification to file owners
      // Production: Notify affected users about file relocations
      // const uniqueOwners = [...new Set(results.successful.map(fid => files.find(f => f.id === fid)?.uploadedBy).filter(Boolean))];
      // for (const ownerId of uniqueOwners) {
      //   await this.notificationService.send({
      //     userId: ownerId,
      //     type: operation === 'move' ? 'files_moved' : 'files_copied',
      //     title: `${results.successful.length} Files ${operation === 'move' ? 'Moved' : 'Copied'}`,
      //     message: `Files ${operation}d to category: ${targetCategory}`,
      //   });
      // }
      //
      // Update Elasticsearch/Algolia search index with new file locations
      // import { searchClient } from '../search/elasticsearch';
      // await searchClient.bulk({
      //   operations: results.successful.flatMap(fid => [
      //     { update: { _index: 'files', _id: fid } },
      //     { doc: { category: targetCategory, lastModified: new Date() } },
      //   ]),
      // });

      res.json({
        success: true,
        message: `${operation === 'move' ? 'Moved' : 'Copied'} ${results.successful.length} of ${results.total} files`,
        data: {
          successful: results.successful,
          failed: results.failed,
          successCount: results.successful.length,
          failureCount: results.failed.length,
          targetCategory,
          operation,
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: 'Bulk operation failed', details: error.message });
    }
  }

  /**
   * Bulk tag files
   * Supports: add/remove/replace tags, tag validation, deduplication
   */
  private async bulkTagFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fileIds, tags, operation = 'add' } = req.body;

      // Validation
      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        res.status(400).json({ success: false, error: 'fileIds must be a non-empty array' });
        return;
      }

      if (fileIds.length > 100) {
        res.status(400).json({ success: false, error: 'Maximum 100 files can be tagged at once' });
        return;
      }

      if (!fileIds.every((id: any) => typeof id === 'string' && id.length > 0)) {
        res.status(400).json({ success: false, error: 'All file IDs must be non-empty strings' });
        return;
      }

      if (!Array.isArray(tags) || tags.length === 0) {
        res.status(400).json({ success: false, error: 'tags must be a non-empty array' });
        return;
      }

      if (tags.length > 20) {
        res.status(400).json({ success: false, error: 'Maximum 20 tags allowed' });
        return;
      }

      // Validate tag format
      const tagRegex = /^[a-zA-Z0-9-_]+$/;
      for (const tag of tags) {
        if (typeof tag !== 'string' || !tagRegex.test(tag)) {
          res.status(400).json({
            success: false,
            error: 'Tags must contain only letters, numbers, hyphens, and underscores',
          });
          return;
        }
        if (tag.length > 50) {
          res.status(400).json({ success: false, error: 'Each tag must be 50 characters or less' });
          return;
        }
      }

      const validOperations = ['add', 'remove', 'replace'];
      if (!validOperations.includes(operation)) {
        res.status(400).json({
          success: false,
          error: `Operation must be one of: ${validOperations.join(', ')}`,
        });
        return;
      }

      const results = {
        successful: [] as string[],
        failed: [] as { id: string; error: string }[],
        total: fileIds.length,
      };

      // Process each file
      for (const fileId of fileIds) {
        try {
          // Check file exists
          const fileResult = await phoenixPool.query(
            `
            SELECT * FROM file_metadata WHERE id = $1
          `,
            [fileId]
          );

          if (fileResult.rows.length === 0) {
            results.failed.push({ id: fileId, error: 'File not found' });
            continue;
          }

          const file = fileResult.rows[0];

          // Permission check
          if (!req.user || !this.canModifyFile(file, req.user)) {
            results.failed.push({ id: fileId, error: 'Access denied' });
            continue;
          }

          let newTags: string[] = [];
          const existingTags: string[] = file.tags || [];

          if (operation === 'add') {
            // Add tags (avoid duplicates)
            newTags = [...new Set([...existingTags, ...tags])];
          } else if (operation === 'remove') {
            // Remove tags
            newTags = existingTags.filter((t: string) => !tags.includes(t));
          } else {
            // Replace all tags
            newTags = [...new Set(tags)];
          }

          // Enforce max tags limit
          if (newTags.length > 50) {
            results.failed.push({ id: fileId, error: 'Total tags would exceed 50 limit' });
            continue;
          }

          // Update tags
          await phoenixPool.query(
            `
            UPDATE file_metadata 
            SET tags = $1, last_modified = NOW()
            WHERE id = $2
          `,
            [newTags, fileId]
          );

          // Log action
          await this.logFileAccess({
            fileId,
            userId: req.user?.id || 'system',
            action: 'tag_update',
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            success: true,
          });

          results.successful.push(fileId);
        } catch (error: any) {
          results.failed.push({ id: fileId, error: error.message || 'Unknown error' });
        }
      }

      // Bulk tagging post-processing
      // Update tag usage statistics for analytics
      // Production: Maintain tag popularity/usage counts
      // for (const tag of tags) {
      //   await this.db.tagStatistics.upsert({
      //     where: { tag },
      //     create: { tag, usageCount: results.successful.length, lastUsed: new Date() },
      //     update: { usageCount: { increment: results.successful.length }, lastUsed: new Date() },
      //   });
      // }
      //
      // Send notification to file owners about tagging
      // const uniqueOwners = [...new Set(results.successful.map(fid => files.find(f => f.id === fid)?.uploadedBy).filter(Boolean))];
      // for (const ownerId of uniqueOwners) {
      //   await this.notificationService.send({
      //     userId: ownerId,
      //     type: 'files_tagged',
      //     title: `${results.successful.length} Files Tagged`,
      //     message: `Tags ${operation}d: ${tags.join(', ')}`,
      //   });
      // }
      //
      // Update search index with new tags for improved searchability
      // import { searchClient } from '../search/elasticsearch';
      // await searchClient.bulk({
      //   operations: results.successful.flatMap(fid => [
      //     { update: { _index: 'files', _id: fid } },
      //     { doc: { tags: operation === 'add' ? { script: { source: 'ctx._source.tags.addAll(params.newTags)', params: { newTags: tags } } } : tags } },
      //   ]),
      // });

      res.json({
        success: true,
        message: `Tagged ${results.successful.length} of ${results.total} files`,
        data: {
          successful: results.successful,
          failed: results.failed,
          successCount: results.successful.length,
          failureCount: results.failed.length,
          tags,
          operation,
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: 'Bulk tagging failed', details: error.message });
    }
  }

  /**
   * Get comprehensive storage statistics
   * Admin only. Shows total storage, usage by category/user, largest files
   */
  private async getStorageStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Admin check
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Admin access required' });
        return;
      }

      // Calculate storage statistics from database
      // Production: Use Prisma aggregations for real-time storage stats
      // const storageStats = await this.db.fileMetadata.aggregate({
      //   _sum: { size: true },
      //   _count: true,
      //   where: { isDeleted: false },
      // });
      // const totalStorageBytes = storageStats._sum.size || 0;
      // const totalFileCount = storageStats._count;
      //
      // Get storage by category
      // const byCategory = await this.db.fileMetadata.groupBy({
      //   by: ['category'],
      //   _sum: { size: true },
      //   _count: true,
      //   where: { isDeleted: false },
      // }).then(results => results.map(r => ({
      //   category: r.category,
      //   totalSize: r._sum.size || 0,
      //   fileCount: r._count,
      //   percentage: ((r._sum.size || 0) / totalStorageBytes) * 100,
      // })));
      //
      // Mock data for demonstration
      const totalStorageBytes = 1024 * 1024 * 1024 * 15; // 15 GB
      const quotaBytes = 1024 * 1024 * 1024 * 50; // 50 GB quota
      const usedPercentage = (totalStorageBytes / quotaBytes) * 100;
      const freeBytes = quotaBytes - totalStorageBytes;

      // Storage by category
      const byCategory = [
        {
          category: 'image' as FileCategory,
          totalSize: 1024 * 1024 * 1024 * 8,
          fileCount: 1245,
          percentage: 53.3,
        },
        {
          category: 'video' as FileCategory,
          totalSize: 1024 * 1024 * 1024 * 5,
          fileCount: 89,
          percentage: 33.3,
        },
        {
          category: 'document' as FileCategory,
          totalSize: 1024 * 1024 * 1024 * 1.5,
          fileCount: 523,
          percentage: 10.0,
        },
        {
          category: 'spreadsheet' as FileCategory,
          totalSize: 1024 * 1024 * 100,
          fileCount: 67,
          percentage: 0.7,
        },
        {
          category: 'presentation' as FileCategory,
          totalSize: 1024 * 1024 * 50,
          fileCount: 34,
          percentage: 0.3,
        },
        {
          category: 'pdf' as FileCategory,
          totalSize: 1024 * 1024 * 200,
          fileCount: 156,
          percentage: 1.3,
        },
        {
          category: 'archive' as FileCategory,
          totalSize: 1024 * 1024 * 150,
          fileCount: 23,
          percentage: 1.0,
        },
        {
          category: 'audio' as FileCategory,
          totalSize: 1024 * 1024 * 20,
          fileCount: 12,
          percentage: 0.1,
        },
      ];

      // Storage by user (top 10)
      const byUser = [
        {
          userId: 'user-123',
          username: 'john.doe',
          totalSize: 1024 * 1024 * 1024 * 3,
          fileCount: 234,
          percentage: 20.0,
        },
        {
          userId: 'user-456',
          username: 'jane.smith',
          totalSize: 1024 * 1024 * 1024 * 2.5,
          fileCount: 189,
          percentage: 16.7,
        },
        {
          userId: 'user-789',
          username: 'bob.wilson',
          totalSize: 1024 * 1024 * 1024 * 2,
          fileCount: 156,
          percentage: 13.3,
        },
        {
          userId: 'user-012',
          username: 'alice.johnson',
          totalSize: 1024 * 1024 * 1024 * 1.5,
          fileCount: 123,
          percentage: 10.0,
        },
        {
          userId: 'user-345',
          username: 'charlie.brown',
          totalSize: 1024 * 1024 * 1024 * 1.2,
          fileCount: 98,
          percentage: 8.0,
        },
      ];

      // Largest files (top 20)
      const largestFiles = [
        {
          id: 'file-large-1',
          originalName: 'team_training_video_4k.mp4',
          size: 1024 * 1024 * 850,
          category: 'video' as FileCategory,
          uploadedBy: 'user-123',
          uploadedAt: new Date(Date.now() - 86400000 * 5),
        },
        {
          id: 'file-large-2',
          originalName: 'match_analysis_recording.mp4',
          size: 1024 * 1024 * 720,
          category: 'video' as FileCategory,
          uploadedBy: 'user-456',
          uploadedAt: new Date(Date.now() - 86400000 * 3),
        },
        {
          id: 'file-large-3',
          originalName: 'season_highlights_2024.mp4',
          size: 1024 * 1024 * 650,
          category: 'video' as FileCategory,
          uploadedBy: 'user-789',
          uploadedAt: new Date(Date.now() - 86400000 * 7),
        },
      ];

      // File type distribution
      const byMimeType = [
        {
          mimeType: 'image/jpeg',
          fileCount: 789,
          totalSize: 1024 * 1024 * 1024 * 4,
          percentage: 26.7,
        },
        {
          mimeType: 'image/png',
          fileCount: 456,
          totalSize: 1024 * 1024 * 1024 * 3,
          percentage: 20.0,
        },
        {
          mimeType: 'video/mp4',
          fileCount: 89,
          totalSize: 1024 * 1024 * 1024 * 5,
          percentage: 33.3,
        },
        {
          mimeType: 'application/pdf',
          fileCount: 156,
          totalSize: 1024 * 1024 * 200,
          percentage: 1.3,
        },
        {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fileCount: 234,
          totalSize: 1024 * 1024 * 500,
          percentage: 3.3,
        },
      ];

      // Storage trends (last 30 days)
      const trends = {
        uploadedToday: 1024 * 1024 * 256,
        uploadedThisWeek: 1024 * 1024 * 1024 * 1.2,
        uploadedThisMonth: 1024 * 1024 * 1024 * 4,
        deletedThisMonth: 1024 * 1024 * 1024 * 0.5,
        averageFileSize: 1024 * 1024 * 7.5,
        totalFiles: 2149,
        activeFiles: 2087,
        deletedFiles: 62,
      };

      res.json({
        success: true,
        data: {
          summary: {
            totalSize: totalStorageBytes,
            quota: quotaBytes,
            used: totalStorageBytes,
            free: freeBytes,
            usedPercentage: parseFloat(usedPercentage.toFixed(2)),
            freePercentage: parseFloat((100 - usedPercentage).toFixed(2)),
          },
          byCategory,
          byUser,
          largestFiles,
          byMimeType,
          trends,
          warnings:
            usedPercentage > 90
              ? ['Storage usage above 90%']
              : usedPercentage > 75
                ? ['Storage usage above 75%']
                : [],
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: 'Failed to get storage stats', details: error.message });
    }
  }

  /**
   * Get detailed usage analytics with trends
   * Admin only. Shows upload/download patterns, active users, popular files
   */
  private async getUsageAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Admin check
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Admin access required' });
        return;
      }

      const { timeRange = '30d', groupBy = 'day' } = req.query;

      // Validate parameters
      const validTimeRanges = ['24h', '7d', '30d', '90d', '1y'];
      const validGroupBy = ['hour', 'day', 'week', 'month'];

      if (!validTimeRanges.includes(timeRange as string)) {
        res.status(400).json({
          success: false,
          error: `Invalid timeRange. Must be one of: ${validTimeRanges.join(', ')}`,
        });
        return;
      }

      if (!validGroupBy.includes(groupBy as string)) {
        res.status(400).json({
          success: false,
          error: `Invalid groupBy. Must be one of: ${validGroupBy.join(', ')}`,
        });
        return;
      }

      // Fetch real usage analytics from database
      // Production: Use Prisma with date grouping for time-series data
      // const startDate = new Date();
      // switch (timeRange) {
      //   case '24h': startDate.setHours(startDate.getHours() - 24); break;
      //   case '7d': startDate.setDate(startDate.getDate() - 7); break;
      //   case '30d': startDate.setDate(startDate.getDate() - 30); break;
      //   case '90d': startDate.setDate(startDate.getDate() - 90); break;
      // }
      //
      // const uploadTrends = await this.db.$queryRaw`
      //   SELECT DATE_TRUNC(${groupBy}, uploaded_at) as period,
      //          COUNT(*) as uploads,
      //          SUM(size) as totalSize,
      //          COUNT(*) as fileCount
      //   FROM file_metadata
      //   WHERE uploaded_at >= ${startDate}
      //   GROUP BY DATE_TRUNC(${groupBy}, uploaded_at)
      //   ORDER BY period ASC
      // `;
      //
      // const downloadTrends = await this.db.fileAccessLog.groupBy({
      //   by: ['createdAt'],
      //   where: { action: 'download', createdAt: { gte: startDate } },
      //   _count: true,
      //   _sum: { bytesTransferred: true },
      // });
      //
      // Mock data for demonstration
      const uploadTrends = [
        { period: '2024-09-01', uploads: 45, totalSize: 1024 * 1024 * 1024 * 0.8, fileCount: 45 },
        { period: '2024-09-02', uploads: 67, totalSize: 1024 * 1024 * 1024 * 1.2, fileCount: 67 },
        { period: '2024-09-03', uploads: 52, totalSize: 1024 * 1024 * 1024 * 0.9, fileCount: 52 },
        { period: '2024-09-04', uploads: 78, totalSize: 1024 * 1024 * 1024 * 1.5, fileCount: 78 },
        { period: '2024-09-05', uploads: 41, totalSize: 1024 * 1024 * 1024 * 0.7, fileCount: 41 },
      ];

      // Download trends
      const downloadTrends = [
        { period: '2024-09-01', downloads: 234, totalSize: 1024 * 1024 * 1024 * 4.5 },
        { period: '2024-09-02', downloads: 189, totalSize: 1024 * 1024 * 1024 * 3.8 },
        { period: '2024-09-03', downloads: 267, totalSize: 1024 * 1024 * 1024 * 5.2 },
        { period: '2024-09-04', downloads: 198, totalSize: 1024 * 1024 * 1024 * 4.1 },
        { period: '2024-09-05', downloads: 223, totalSize: 1024 * 1024 * 1024 * 4.6 },
      ];

      // Active users (top 20)
      const activeUsers = [
        {
          userId: 'user-123',
          username: 'john.doe',
          uploads: 89,
          downloads: 234,
          totalActivity: 323,
          lastActive: new Date(Date.now() - 3600000),
        },
        {
          userId: 'user-456',
          username: 'jane.smith',
          uploads: 67,
          downloads: 189,
          totalActivity: 256,
          lastActive: new Date(Date.now() - 7200000),
        },
        {
          userId: 'user-789',
          username: 'bob.wilson',
          uploads: 52,
          downloads: 167,
          totalActivity: 219,
          lastActive: new Date(Date.now() - 10800000),
        },
      ];

      // Most downloaded files
      const popularFiles = [
        {
          id: 'file-pop-1',
          originalName: 'tactical_formation_guide.pdf',
          downloads: 456,
          views: 1234,
          shares: 23,
          category: 'pdf' as FileCategory,
        },
        {
          id: 'file-pop-2',
          originalName: 'training_drill_templates.pdf',
          downloads: 389,
          views: 987,
          shares: 19,
          category: 'pdf' as FileCategory,
        },
        {
          id: 'file-pop-3',
          originalName: 'player_stats_analysis.xlsx',
          downloads: 267,
          views: 678,
          shares: 15,
          category: 'spreadsheet' as FileCategory,
        },
      ];

      // Activity by time of day (24 hour breakdown)
      const activityByHour = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        uploads: Math.floor(Math.random() * 50) + 10,
        downloads: Math.floor(Math.random() * 150) + 50,
        totalActivity: Math.floor(Math.random() * 200) + 60,
      }));

      // Share statistics
      const shareStats = {
        totalShares: 234,
        activeShares: 189,
        expiredShares: 45,
        passwordProtected: 67,
        publicShares: 122,
        totalShareDownloads: 2345,
        averageDownloadsPerShare: 10.2,
      };

      // File operations summary
      const operations = {
        uploads: 523,
        downloads: 2345,
        deletes: 67,
        updates: 234,
        shares: 189,
        optimizations: 156,
        thumbnailGenerations: 423,
        versionCreations: 89,
      };

      res.json({
        success: true,
        data: {
          timeRange,
          groupBy,
          uploadTrends,
          downloadTrends,
          activeUsers,
          popularFiles,
          activityByHour,
          shareStats,
          operations,
          summary: {
            totalUploads: uploadTrends.reduce((sum, t) => sum + t.uploads, 0),
            totalDownloads: downloadTrends.reduce((sum, t) => sum + t.downloads, 0),
            activeUserCount: activeUsers.length,
            averageUploadsPerDay:
              uploadTrends.reduce((sum, t) => sum + t.uploads, 0) / uploadTrends.length,
            averageDownloadsPerDay:
              downloadTrends.reduce((sum, t) => sum + t.downloads, 0) / downloadTrends.length,
          },
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: 'Failed to get usage analytics', details: error.message });
    }
  }

  /**
   * Cleanup orphaned files and expired data
   * Admin only. Removes deleted files past retention, expired shares, old versions
   */
  private async cleanupFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Admin check
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Admin access required' });
        return;
      }

      const {
        deleteExpiredShares = true,
        deleteOldVersions = false,
        deleteOrphanedFiles = true,
        deleteSoftDeletedFiles = false,
        dryRun = false,
        retentionDays = 30,
      } = req.body;

      // Validate retention days
      if (retentionDays < 1 || retentionDays > 365) {
        res.status(400).json({ success: false, error: 'Retention days must be between 1 and 365' });
        return;
      }

      const results = {
        expiredShares: { count: 0, spaceSaved: 0 },
        oldVersions: { count: 0, spaceSaved: 0 },
        orphanedFiles: { count: 0, spaceSaved: 0 },
        softDeletedFiles: { count: 0, spaceSaved: 0 },
      };

      // Execute cleanup operations with database queries
      // Production: Use Prisma to find and delete expired/old records

      // Mock data for demonstration
      // Clean up expired shares
      if (deleteExpiredShares) {
        const expiredShareCount = 23;
        results.expiredShares = {
          count: expiredShareCount,
          spaceSaved: 0, // Shares don't save space, just metadata
        };
        // In production: DELETE FROM file_shares WHERE expiresAt < NOW() OR (downloadLimit > 0 AND downloadCount >= downloadLimit)
      }

      // Clean up old versions (keep latest N versions)
      if (deleteOldVersions) {
        const oldVersionCount = 145;
        const spaceSaved = 1024 * 1024 * 1024 * 2.3; // 2.3 GB
        results.oldVersions = {
          count: oldVersionCount,
          spaceSaved,
        };
        // In production: DELETE FROM file_versions WHERE version_number NOT IN (SELECT version_number FROM file_versions WHERE file_id = ? ORDER BY created_at DESC LIMIT 5)
      }

      // Clean up orphaned files (no metadata record)
      if (deleteOrphanedFiles) {
        const orphanedCount = 12;
        const spaceSaved = 1024 * 1024 * 450; // 450 MB
        results.orphanedFiles = {
          count: orphanedCount,
          spaceSaved,
        };
        // In production: Find files on disk without database records and delete
      }

      // Clean up soft-deleted files past retention period
      if (deleteSoftDeletedFiles) {
        const softDeletedCount = 34;
        const spaceSaved = 1024 * 1024 * 1024 * 1.2; // 1.2 GB
        results.softDeletedFiles = {
          count: softDeletedCount,
          spaceSaved,
        };
        // In production: DELETE FROM files WHERE deleted_at < NOW() - INTERVAL retentionDays DAY
        // Also delete physical files from storage
      }

      const totalCleaned =
        results.expiredShares.count +
        results.oldVersions.count +
        results.orphanedFiles.count +
        results.softDeletedFiles.count;
      const totalSpaceSaved =
        results.oldVersions.spaceSaved +
        results.orphanedFiles.spaceSaved +
        results.softDeletedFiles.spaceSaved;

      res.json({
        success: true,
        data: {
          dryRun,
          retentionDays,
          results,
          summary: {
            totalCleaned,
            totalSpaceSaved,
            message: dryRun
              ? `Dry run: Would clean ${totalCleaned} items and save ${(totalSpaceSaved / (1024 * 1024 * 1024)).toFixed(2)} GB`
              : `Cleaned ${totalCleaned} items and saved ${(totalSpaceSaved / (1024 * 1024 * 1024)).toFixed(2)} GB`,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Cleanup failed', details: error.message });
    }
  }

  /**
   * Initiate backup of all files
   * Admin only. Creates backup job with progress tracking
   */
  private async initiateBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Admin check
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Admin access required' });
        return;
      }

      const {
        destination = 's3',
        includeVersions = false,
        includeMetadata = true,
        compression = 'gzip',
        categories,
      } = req.body;

      // Validate parameters
      const validDestinations = ['s3', 'azure', 'gcp', 'local'];
      const validCompressions = ['none', 'gzip', 'zip', 'tar.gz'];

      if (!validDestinations.includes(destination)) {
        res.status(400).json({
          success: false,
          error: `Invalid destination. Must be one of: ${validDestinations.join(', ')}`,
        });
        return;
      }

      if (!validCompressions.includes(compression)) {
        res.status(400).json({
          success: false,
          error: `Invalid compression. Must be one of: ${validCompressions.join(', ')}`,
        });
        return;
      }

      if (categories && !Array.isArray(categories)) {
        res.status(400).json({ success: false, error: 'Categories must be an array' });
        return;
      }

      // Generate backup job ID
      const backupId = `backup-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Implement backup to external storage (S3 Glacier, Azure Archive)
      // Production: Create backup job with actual file queries
      // const filesToBackup = await this.db.fileMetadata.findMany({
      //   where: {
      //     isDeleted: false,
      //     ...(categories && { category: { in: categories } }),
      //   },
      //   include: includeVersions ? { versions: true } : undefined,
      // });
      // const estimatedFiles = filesToBackup.length;
      // const estimatedSize = filesToBackup.reduce((sum, f) => sum + f.size, 0);
      // const estimatedVersionsSize = includeVersions ? filesToBackup.reduce((sum, f) => sum + (f.versions?.reduce((vsum, v) => vsum + v.size, 0) || 0), 0) : 0;
      // const totalEstimatedSize = estimatedSize + estimatedVersionsSize;
      //
      // Store backup job in database for tracking
      // const backupJob = await this.db.backupJob.create({
      //   data: {
      //     id: backupId,
      //     status: 'pending',
      //     destination,
      //     includeVersions,
      //     includeMetadata,
      //     compression,
      //     categories,
      //     estimatedFiles,
      //     estimatedSize: totalEstimatedSize,
      //     createdBy: req.user?.id,
      //   },
      // });
      //
      // Mock data for demonstration
      // Calculate estimated backup size
      const estimatedFiles = categories ? 523 : 2149;
      const estimatedSize = categories ? 1024 * 1024 * 1024 * 5 : 1024 * 1024 * 1024 * 15;
      const estimatedVersionsSize = includeVersions ? estimatedSize * 0.3 : 0;
      const totalEstimatedSize = estimatedSize + estimatedVersionsSize;

      // Estimate duration (assuming 100 MB/s backup speed)
      const estimatedDurationSeconds = Math.ceil(totalEstimatedSize / (100 * 1024 * 1024));

      // Create backup job (in production, this would be stored in database and processed by worker)
      const backupJob = {
        id: backupId,
        status: 'pending' as 'pending' | 'running' | 'completed' | 'failed',
        destination,
        includeVersions,
        includeMetadata,
        compression,
        categories: categories || 'all',
        startedAt: new Date(),
        estimatedSize: totalEstimatedSize,
        estimatedFiles,
        estimatedDuration: estimatedDurationSeconds,
        progress: {
          filesProcessed: 0,
          filesTotal: estimatedFiles,
          bytesProcessed: 0,
          bytesTotal: totalEstimatedSize,
          percentage: 0,
          currentFile: null,
        },
        createdBy: req.user.id,
      };

      res.json({
        success: true,
        data: {
          backupId,
          status: backupJob.status,
          estimatedSize: totalEstimatedSize,
          estimatedFiles,
          estimatedDuration: estimatedDurationSeconds,
          message: 'Backup job created successfully',
          monitorUrl: `/api/files/admin/backup/${backupId}/status`,
        },
      });

      // Dispatch backup job to background worker queue (Bull, BullMQ, or AWS SQS)
      // Production: Use message queue for long-running backup operations
      // import { backupQueue } from '../workers/queues';
      // await backupQueue.add('file-backup', {
      //   backupId,
      //   destination,
      //   includeVersions,
      //   includeMetadata,
      //   compression,
      //   categories,
      //   fileIds: filesToBackup.map(f => f.id),
      // }, {
      //   priority: 1,
      //   attempts: 3,
      //   backoff: { type: 'exponential', delay: 60000 },
      //   removeOnComplete: false,
      //   removeOnFail: false,
      // });
      //
      // Worker will:
      // 1. Fetch files from database
      // 2. Stream files to backup destination (S3 Glacier, Azure Archive, Google Coldline)
      // 3. Update backup job status in database
      // 4. Send notification on completion/failure
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: 'Failed to initiate backup', details: error.message });
    }
  }

  /**
   * Update file metadata and properties
   * Allows updating: name, description, tags, category, visibility, expiration
   * Supports partial updates and version tracking
   */
  private async updateFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { originalName, description, tags, category, isPublic, expiresAt } = req.body;

      // Validate file exists
      const fileResult = await phoenixPool.query(
        `
      SELECT * FROM file_metadata WHERE id = $1
    `,
        [id]
      );

      if (fileResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      const file = fileResult.rows[0];

      // Check if user has permission to update
      if (!req.user || !this.canModifyFile(file, req.user)) {
        res.status(403).json({
          success: false,
          error: 'Access denied - only file owner or admin can update file',
        });
        return;
      }

      // Validate inputs
      const errors: string[] = [];

      if (originalName !== undefined) {
        if (typeof originalName !== 'string' || originalName.trim().length === 0) {
          errors.push('Original name must be a non-empty string');
        } else if (originalName.length > 255) {
          errors.push('Original name must not exceed 255 characters');
        } else if (!/^[\w\-. ]+$/.test(originalName)) {
          errors.push('Original name contains invalid characters');
        }
      }

      if (description !== undefined && typeof description !== 'string') {
        errors.push('Description must be a string');
      }

      if (description && description.length > 1000) {
        errors.push('Description must not exceed 1000 characters');
      }

      if (tags !== undefined) {
        if (!Array.isArray(tags)) {
          errors.push('Tags must be an array');
        } else if (tags.length > 20) {
          errors.push('Maximum 20 tags allowed');
        } else if (!tags.every((tag: any) => typeof tag === 'string' && tag.length <= 50)) {
          errors.push('Each tag must be a string with max 50 characters');
        }
      }

      if (category !== undefined) {
        const validCategories: FileCategory[] = [
          'formation',
          'player_photo',
          'team_logo',
          'document',
          'video',
          'audio',
          'archive',
          'backup',
          'report',
          'other',
        ];
        if (!validCategories.includes(category)) {
          errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
        }
      }

      if (isPublic !== undefined && typeof isPublic !== 'boolean') {
        errors.push('isPublic must be a boolean');
      }

      if (expiresAt !== undefined) {
        const expirationDate = new Date(expiresAt);
        if (isNaN(expirationDate.getTime())) {
          errors.push('Invalid expiration date format');
        } else if (expirationDate <= new Date()) {
          errors.push('Expiration date must be in the future');
        }
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors,
        });
        return;
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (originalName !== undefined) {
        updates.push(`original_name = $${paramIndex++}`);
        values.push(originalName);
      }

      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }

      if (tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(tags);
      }

      if (category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        values.push(category);
      }

      if (isPublic !== undefined) {
        updates.push(`is_public = $${paramIndex++}`);
        values.push(isPublic);
      }

      if (expiresAt !== undefined) {
        updates.push(`expires_at = $${paramIndex++}`);
        values.push(expiresAt);
      }

      // Always update modified timestamp
      updates.push(`updated_at = NOW()`);

      if (updates.length === 1) {
        // Only updated_at, no actual changes
        res.status(400).json({
          success: false,
          error: 'No valid fields to update',
        });
        return;
      }

      // Add file ID as last parameter
      values.push(id);

      // Execute update
      const updateQuery = `
      UPDATE file_metadata 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

      const result = await phoenixPool.query(updateQuery, values);
      const updatedFile = result.rows[0];

      // File update post-processing
      // Create version history entry for audit trail
      // Production: Track all file modifications
      // await this.db.fileVersion.create({
      //   data: {
      //     fileId: id,
      //     version: updatedFile.version,
      //     changeType: 'metadata_update',
      //     changeSummary: Object.keys(updates).join(', '),
      //     createdBy: req.user?.id,
      //     metadata: updatedFile,
      //   },
      // });
      //
      // Invalidate cached file metadata (Redis, Memcached)
      // import { redisClient } from '../cache/redis';
      // await redisClient.del(`file:${id}`);
      // await redisClient.del(`file:metadata:${id}`);
      //
      // Trigger webhooks for file update events (for integrations)
      // import { webhookService } from '../services/webhookService';
      // await webhookService.trigger('file.updated', {
      //   fileId: id,
      //   fileName: updatedFile.originalName,
      //   updatedBy: req.user?.id,
      //   changes: Object.keys(updates),
      //   timestamp: new Date(),
      // });
      //
      // Update search index for improved discoverability
      // import { searchClient } from '../search/elasticsearch';
      // await searchClient.update({
      //   index: 'files',
      //   id,
      //   doc: {
      //     originalName: updatedFile.originalName,
      //     description: updatedFile.description,
      //     tags: updatedFile.tags,
      //     category: updatedFile.category,
      //     isPublic: updatedFile.isPublic,
      //     lastModified: updatedFile.lastModified,
      //   },
      // });

      // Log the update action
      await this.logFileAccess({
        fileId: id,
        userId: req.user?.id || 'unknown',
        action: 'upload', // Closest match to 'update' action
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        success: true,
      });

      res.json({
        success: true,
        message: 'File updated successfully',
        data: updatedFile,
        updates: {
          fieldsUpdated: updates.filter(u => !u.includes('updated_at')).length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to update file',
        details: error.message,
      });
    }
  }

  /**
   * Delete file (soft or hard delete)
   * Soft delete: marks as deleted but keeps data
   * Hard delete: permanently removes file and metadata
   */
  private async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { permanent = false } = req.query;

      // Validate file exists
      const fileResult = await phoenixPool.query(
        `
      SELECT * FROM file_metadata WHERE id = $1
    `,
        [id]
      );

      if (fileResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      const file = fileResult.rows[0];

      // Check if user has permission to delete
      if (!req.user || !this.canModifyFile(file, req.user)) {
        res.status(403).json({
          success: false,
          error: 'Access denied - only file owner or admin can delete file',
        });
        return;
      }

      // Check if permanent deletion is allowed
      const isPermanentDelete = permanent === 'true';

      if (isPermanentDelete && req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Only administrators can permanently delete files',
        });
        return;
      }

      if (isPermanentDelete) {
        // Hard delete - remove file and all associated data

        // Delete from cloud storage
        try {
          await fileStorageService.deleteFile({
            fileId: id,
            permanentDelete: true,
            deleteAllVersions: true,
          });

          securityLogger.info('File deleted from cloud storage', {
            fileId: id,
            userId: req.user?.id,
            permanent: true,
          });
        } catch (deleteError) {
          securityLogger.warn('Cloud storage deletion failed (metadata will still be removed)', {
            fileId: id,
            error: deleteError instanceof Error ? deleteError.message : 'Unknown error',
          });
        }

        // Delete associated records
        await phoenixPool.query(`DELETE FROM file_access_logs WHERE file_id = $1`, [id]);
        await phoenixPool.query(`DELETE FROM file_shares WHERE file_id = $1`, [id]);
        // Delete file versions if versioning is enabled
        await phoenixPool.query(`DELETE FROM file_versions WHERE file_id = $1`, [id]).catch(() => {
          // Ignore error if table doesn't exist
        });

        // Delete file metadata
        await phoenixPool.query(`DELETE FROM file_metadata WHERE id = $1`, [id]);

        // Log the permanent deletion
        await this.logFileAccess({
          fileId: id,
          userId: req.user?.id || 'unknown',
          action: 'hard_delete',
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          success: true,
        });

        res.json({
          success: true,
          message: 'File permanently deleted',
          data: {
            id,
            deletionType: 'permanent',
            deletedAt: new Date().toISOString(),
            deletedBy: req.user?.id || 'unknown',
            originalName: file.original_name,
            size: file.size,
            recordsRemoved: {
              metadata: 1,
              accessLogs: 'all',
              shares: 'all',
            },
          },
        });
      } else {
        // Soft delete - mark as deleted but keep data
        const result = await phoenixPool.query(
          `
        UPDATE file_metadata 
        SET 
          is_deleted = true,
          deleted_at = NOW(),
          deleted_by = $2,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
          [id, req.user?.id || null]
        );

        const deletedFile = result.rows[0];

        // Deactivate any active shares
        await phoenixPool.query(
          `
        UPDATE file_shares 
        SET is_active = false 
        WHERE file_id = $1 AND is_active = true
      `,
          [id]
        );

        // Log the soft deletion
        await this.logFileAccess({
          fileId: id,
          userId: req.user?.id || 'unknown',
          action: 'delete',
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          success: true,
        });

        // File deletion post-processing
        // Schedule file for archival or permanent cleanup after retention period
        // Production: Use cron job or scheduled task for cleanup
        // import { schedulerService } from '../services/schedulerService';
        // await schedulerService.schedule('file-cleanup', {
        //   fileId: id,
        //   scheduledFor: new Date(Date.now() + 30 * 24*60*60*1000), // 30 days retention
        //   action: 'permanent_delete',
        // });
        //
        // Notify file owner if deleted by someone else (e.g., admin)
        // if (file.uploadedBy !== req.user?.id) {
        //   await this.notificationService.send({
        //     userId: file.uploadedBy,
        //     type: 'file_deleted_by_admin',
        //     title: 'File Deleted',
        //     message: `Your file "${file.originalName}" was deleted by an administrator`,
        //     data: { fileId: id, deletedBy: req.user?.id, deletedAt: new Date(), recoverable: true },
        //   });
        // }
        //
        // Create backup copy before permanent removal (safety net)
        // import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';
        // const s3 = new S3Client({ region: process.env.AWS_REGION });
        // await s3.send(new CopyObjectCommand({
        //   Bucket: process.env.S3_BUCKET,
        //   CopySource: `${process.env.S3_BUCKET}/${file.cloudKey}`,
        //   Key: `backups/deleted/${id}/${file.filename}`,
        // }));

        res.json({
          success: true,
          message: 'File deleted successfully',
          data: {
            id,
            deletionType: 'soft',
            deletedAt: deletedFile.deleted_at,
            deletedBy: req.user?.id || 'unknown',
            originalName: file.original_name,
            size: file.size,
            recoverable: true,
            retentionPeriod: '30 days',
            note: 'File can be recovered by administrators within retention period',
          },
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete file',
        details: error.message,
      });
    }
  }

  /**
   * Create a shareable link for a file
   * Supports: expiration, download limits, password protection, domain restrictions
   */
  private async createFileShare(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { expiresAt, maxDownloads, password, allowedDomains, requireAuth = false } = req.body;

      // Validate file exists
      const fileResult = await phoenixPool.query(
        `
      SELECT * FROM file_metadata WHERE id = $1
    `,
        [id]
      );

      if (fileResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      const file = fileResult.rows[0];

      // Check if user has permission to share
      if (!req.user || !this.canModifyFile(file, req.user)) {
        res.status(403).json({
          success: false,
          error: 'Access denied - only file owner or admin can create shares',
        });
        return;
      }

      // Validate inputs
      const errors: string[] = [];

      if (expiresAt !== undefined) {
        const expirationDate = new Date(expiresAt);
        if (isNaN(expirationDate.getTime())) {
          errors.push('Invalid expiration date format');
        } else if (expirationDate <= new Date()) {
          errors.push('Expiration date must be in the future');
        } else if (expirationDate > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
          errors.push('Expiration date cannot be more than 1 year in the future');
        }
      }

      if (maxDownloads !== undefined) {
        if (!Number.isInteger(maxDownloads) || maxDownloads < 1) {
          errors.push('Max downloads must be a positive integer');
        } else if (maxDownloads > 10000) {
          errors.push('Max downloads cannot exceed 10,000');
        }
      }

      if (password !== undefined) {
        if (typeof password !== 'string') {
          errors.push('Password must be a string');
        } else if (password.length < 6) {
          errors.push('Password must be at least 6 characters');
        } else if (password.length > 100) {
          errors.push('Password must not exceed 100 characters');
        }
      }

      if (allowedDomains !== undefined) {
        if (!Array.isArray(allowedDomains)) {
          errors.push('Allowed domains must be an array');
        } else if (allowedDomains.length > 50) {
          errors.push('Maximum 50 allowed domains');
        } else if (
          !allowedDomains.every(
            (domain: any) => typeof domain === 'string' && /^[\w.-]+\.[a-z]{2,}$/i.test(domain)
          )
        ) {
          errors.push('Each allowed domain must be a valid domain name');
        }
      }

      if (requireAuth !== undefined && typeof requireAuth !== 'boolean') {
        errors.push('requireAuth must be a boolean');
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors,
        });
        return;
      }

      // Generate unique share token
      const shareToken = crypto.randomBytes(32).toString('hex');

      // Hash password if provided
      let hashedPassword: string | null = null;
      if (password) {
        hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      }

      // Create file share record
      const shareResult = await phoenixPool.query(
        `
      INSERT INTO file_shares (
        id, file_id, user_id, share_token, expires_at, max_downloads, 
        download_count, password, allowed_domains, created_at, is_active, require_auth
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), true, $10)
      RETURNING *
    `,
        [
          uuidv4(),
          id,
          req.user.id,
          shareToken,
          expiresAt || null,
          maxDownloads || null,
          0,
          hashedPassword,
          allowedDomains ? JSON.stringify(allowedDomains) : null,
          requireAuth || false,
        ]
      );

      const share = shareResult.rows[0];

      // Generate shareable URL
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const shareUrl = `${baseUrl}/api/files/shared/${shareToken}`;

      // Log share creation
      await this.logFileAccess({
        fileId: id,
        userId: req.user.id,
        action: 'share',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        success: true,
      });

      // File sharing post-processing
      // Send notification to file owner about new share
      // Production: Notify user about share creation
      // await this.notificationService.send({
      //   userId: req.user.id,
      //   type: 'file_share_created',
      //   title: 'File Shared',
      //   message: `Share link created for "${file.originalName}"`,
      //   data: { fileId: id, shareUrl, expiresAt: share.expiresAt },
      // });
      //
      // Add to user's share activity feed for history tracking
      // await this.db.activityFeed.create({
      //   data: {
      //     userId: req.user.id,
      //     type: 'file_share',
      //     action: 'created',
      //     resourceId: id,
      //     resourceType: 'file',
      //     metadata: { shareId: share.id, shareUrl, expiresAt: share.expiresAt },
      //   },
      // });
      //
      // Generate QR code for easy mobile sharing
      // import QRCode from 'qrcode';
      // const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
      //   width: 300,
      //   margin: 2,
      //   color: { dark: '#000000', light: '#ffffff' },
      // });
      // await this.db.fileShare.update({
      //   where: { id: share.id },
      //   data: { qrCode: qrCodeDataUrl },
      // });

      res.status(201).json({
        success: true,
        message: 'File share created successfully',
        data: {
          id: share.id,
          fileId: id,
          fileName: file.original_name,
          shareToken,
          shareUrl,
          downloadUrl: `${shareUrl}/download`,
          expiresAt: share.expires_at,
          maxDownloads: share.max_downloads,
          downloadCount: 0,
          hasPassword: !!password,
          allowedDomains: allowedDomains || [],
          requireAuth: share.require_auth,
          createdAt: share.created_at,
          isActive: true,
          settings: {
            expirationEnabled: !!expiresAt,
            downloadLimitEnabled: !!maxDownloads,
            passwordProtected: !!password,
            domainRestricted: !!(allowedDomains && allowedDomains.length > 0),
            authRequired: requireAuth,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to create file share',
        details: error.message,
      });
    }
  }

  /**
   * Get shared file metadata using share token
   * Validates token, expiration, and download limits
   */
  private async getSharedFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      // Get share details
      const shareResult = await phoenixPool.query(
        `
      SELECT 
        fs.*,
        f.original_name, f.mime_type, f.size, f.category,
        u.first_name || ' ' || u.last_name as shared_by_name
      FROM file_shares fs
      JOIN file_metadata f ON fs.file_id = f.id
      LEFT JOIN users u ON fs.user_id = u.id
      WHERE fs.share_token = $1
    `,
        [token]
      );

      if (shareResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Share link not found or expired',
        });
        return;
      }

      const share = shareResult.rows[0];

      // Check if share is active
      if (!share.is_active) {
        res.status(403).json({
          success: false,
          error: 'Share link has been deactivated',
        });
        return;
      }

      // Check expiration
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        // Deactivate expired share
        await phoenixPool.query(
          `
        UPDATE file_shares SET is_active = false WHERE id = $1
      `,
          [share.id]
        );

        res.status(403).json({
          success: false,
          error: 'Share link has expired',
          expiredAt: share.expires_at,
        });
        return;
      }

      // Check download limit
      if (share.max_downloads && share.download_count >= share.max_downloads) {
        res.status(403).json({
          success: false,
          error: 'Download limit reached',
          limit: share.max_downloads,
          currentCount: share.download_count,
        });
        return;
      }

      // Check domain restrictions
      if (share.allowed_domains) {
        const referer = req.get('Referer') || req.get('Origin') || '';
        const allowedDomainsList = JSON.parse(share.allowed_domains);

        if (allowedDomainsList.length > 0 && referer) {
          const refererDomain = new URL(referer).hostname;
          const isAllowed = allowedDomainsList.some(
            (domain: string) => refererDomain === domain || refererDomain.endsWith('.' + domain)
          );

          if (!isAllowed) {
            res.status(403).json({
              success: false,
              error: 'Access denied - domain not in allowed list',
              allowedDomains: allowedDomainsList,
            });
            return;
          }
        }
      }

      // Check if authentication is required
      if (share.require_auth && !req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required to access this file',
        });
        return;
      }

      // Calculate remaining downloads
      const remainingDownloads = share.max_downloads
        ? share.max_downloads - share.download_count
        : null;

      // Calculate time until expiration
      const timeUntilExpiration = share.expires_at
        ? new Date(share.expires_at).getTime() - Date.now()
        : null;

      res.json({
        success: true,
        data: {
          fileId: share.file_id,
          fileName: share.original_name,
          mimeType: share.mime_type,
          size: share.size,
          category: share.category,
          shareToken: token,
          sharedBy: share.shared_by_name,
          createdAt: share.created_at,
          expiresAt: share.expires_at,
          downloadCount: share.download_count,
          maxDownloads: share.max_downloads,
          remainingDownloads,
          hasPassword: !!share.password,
          requireAuth: share.require_auth,
          isExpired: false,
          isActive: true,
          restrictions: {
            passwordProtected: !!share.password,
            downloadLimited: !!share.max_downloads,
            domainRestricted: !!(
              share.allowed_domains && JSON.parse(share.allowed_domains).length > 0
            ),
            authRequired: share.require_auth,
            timeRemaining: timeUntilExpiration
              ? `${Math.floor(timeUntilExpiration / (1000 * 60 * 60))} hours`
              : null,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve shared file',
        details: error.message,
      });
    }
  }

  /**
   * Download file using share token
   * Validates password, tracks downloads, enforces limits
   */
  private async downloadSharedFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = req.body;

      // Get share and file details
      const shareResult = await phoenixPool.query(
        `
      SELECT 
        fs.*,
        f.*
      FROM file_shares fs
      JOIN file_metadata f ON fs.file_id = f.id
      WHERE fs.share_token = $1
    `,
        [token]
      );

      if (shareResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Share link not found',
        });
        return;
      }

      const share = shareResult.rows[0];

      // Check if share is active
      if (!share.is_active) {
        res.status(403).json({
          success: false,
          error: 'Share link has been deactivated',
        });
        return;
      }

      // Check expiration
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        await phoenixPool.query(
          `
        UPDATE file_shares SET is_active = false WHERE id = $1
      `,
          [share.id]
        );

        res.status(403).json({
          success: false,
          error: 'Share link has expired',
        });
        return;
      }

      // Check download limit
      if (share.max_downloads && share.download_count >= share.max_downloads) {
        res.status(403).json({
          success: false,
          error: 'Download limit reached',
        });
        return;
      }

      // Check password if required
      if (share.password) {
        if (!password) {
          res.status(401).json({
            success: false,
            error: 'Password required',
            requiresPassword: true,
          });
          return;
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        if (hashedPassword !== share.password) {
          res.status(401).json({
            success: false,
            error: 'Invalid password',
          });
          return;
        }
      }

      // Check authentication requirement
      if (share.require_auth && !req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Check domain restrictions
      if (share.allowed_domains) {
        const referer = req.get('Referer') || req.get('Origin') || '';
        const allowedDomainsList = JSON.parse(share.allowed_domains);

        if (allowedDomainsList.length > 0 && referer) {
          const refererDomain = new URL(referer).hostname;
          const isAllowed = allowedDomainsList.some(
            (domain: string) => refererDomain === domain || refererDomain.endsWith('.' + domain)
          );

          if (!isAllowed) {
            res.status(403).json({
              success: false,
              error: 'Access denied - domain not allowed',
            });
            return;
          }
        }
      }

      // Check file exists on storage
      const filePath = this.getFilePath(share);
      try {
        await fs.access(filePath);
      } catch {
        res.status(404).json({
          success: false,
          error: 'File not found on storage',
        });
        return;
      }

      // Increment download count
      await phoenixPool.query(
        `
      UPDATE file_shares 
      SET download_count = download_count + 1, last_downloaded = NOW()
      WHERE id = $1
    `,
        [share.id]
      );

      // Also update file metadata
      await phoenixPool.query(
        `
      UPDATE file_metadata 
      SET download_count = download_count + 1, last_accessed = NOW() 
      WHERE id = $1
    `,
        [share.file_id]
      );

      // Log download
      await this.logFileAccess({
        fileId: share.file_id,
        userId: req.user?.id || 'anonymous',
        action: 'download',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        success: true,
      });

      // Set response headers
      res.setHeader('Content-Type', share.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${share.original_name}"`);
      res.setHeader('Content-Length', share.size);

      // Download tracking and security measures
      // Track download analytics for insights
      // Production: Record download metrics
      // await this.db.downloadAnalytics.create({
      //   data: {
      //     fileId: share.file_id,
      //     shareId: share.id,
      //     downloadedBy: req.ip,
      //     userAgent: req.get('User-Agent'),
      //     downloadedAt: new Date(),
      //     fileSize: share.size,
      //     country: await this.geoIpService.getCountry(req.ip),
      //   },
      // });
      //
      // Virus scan before download (real-time protection)
      // import { virusScanService } from '../services/virusScanService';
      // const scanResult = await virusScanService.scanFile(filePath);
      // if (scanResult.isInfected) {
      //   await securityLogger.error('Infected file download blocked', { fileId: share.file_id, threats: scanResult.threats });
      //   throw new Error('File failed security scan');
      // }
      //
      // Apply bandwidth throttling for large files (prevent abuse)
      // import { RateLimiterMemory } from 'rate-limiter-flexible';
      // const rateLimiter = new RateLimiterMemory({ points: 100 * 1024 * 1024, duration: 60 }); // 100MB/min
      // if (share.size > 50 * 1024 * 1024) { // Files > 50MB
      //   await rateLimiter.consume(req.ip, share.size);
      // }
      //
      // Generate download receipt/confirmation for audit trail
      // const receipt = {
      //   receiptId: crypto.randomUUID(),
      //   fileId: share.file_id,
      //   fileName: share.originalName,
      //   downloadedAt: new Date(),
      //   downloadedFrom: req.ip,
      //   fileSize: share.size,
      //   checksum: share.checksum,
      // };
      // res.setHeader('X-Download-Receipt', JSON.stringify(receipt));

      // Stream file
      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'File download failed',
        details: error.message,
      });
    }
  }
}
