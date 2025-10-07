import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Get,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadsService.uploadImage(file, {
      width: 1200,
      height: 1200,
      quality: 85,
    });

    return {
      message: 'Image uploaded successfully',
      data: result,
    };
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadsService.uploadImage(file, {
      width: 400,
      height: 400,
      quality: 90,
    });

    return {
      message: 'Avatar uploaded successfully',
      data: result,
    };
  }

  @Delete(':filename')
  async deleteImage(@Param('filename') filename: string) {
    await this.uploadsService.deleteImage(filename);
    return {
      message: 'Image deleted successfully',
    };
  }

  @Get(':filename')
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    const filepath = await this.uploadsService.getImagePath(filename);
    return res.sendFile(filepath);
  }
}
