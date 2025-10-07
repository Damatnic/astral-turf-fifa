import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly uploadDir = path.join(__dirname, '../../uploads');
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

  async onModuleInit() {
    // Ensure upload directory exists
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch {
      // Directory might already exist
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
    }
  ): Promise<{ filename: string; path: string; size: number }> {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed'
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomString}${extension}`;
    const filepath = path.join(this.uploadDir, filename);

    try {
      // Process and save image
      let sharpInstance = sharp(file.buffer);

      // Resize if dimensions provided
      if (options?.width || options?.height) {
        sharpInstance = sharpInstance.resize(options.width, options.height, {
          fit: 'cover',
          position: 'center',
        });
      }

      // Set quality
      const quality = options?.quality || 80;
      sharpInstance = sharpInstance.jpeg({ quality });

      // Save processed image
      await sharpInstance.toFile(filepath);

      // Get file stats
      const stats = await fs.stat(filepath);

      return {
        filename,
        path: `/uploads/${filename}`,
        size: stats.size,
      };
    } catch {
      throw new BadRequestException('Failed to process image');
    }
  }

  async deleteImage(filename: string): Promise<void> {
    const filepath = path.join(this.uploadDir, filename);

    try {
      await fs.unlink(filepath);
    } catch {
      throw new BadRequestException('Failed to delete image');
    }
  }

  async getImagePath(filename: string): Promise<string> {
    const filepath = path.join(this.uploadDir, filename);

    try {
      await fs.access(filepath);
      return filepath;
    } catch {
      throw new BadRequestException('Image not found');
    }
  }
}
