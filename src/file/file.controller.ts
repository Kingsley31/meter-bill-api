import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import {
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Express } from 'express';
import { FileService } from './file.service';
import { VALIDATION_PIPE } from './file-type.validation';

@ApiTags('Files')
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file to Supabase (images or PDFs only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    example: '1752430117536_Screen_Shot_2025-06-18_at_9.11.32_PM.png',
    schema: { type: 'string' },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type. Only images and PDFs are allowed.',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(VALIDATION_PIPE) file: Express.Multer.File,
  ): Promise<string> {
    return await this.fileService.uploadFile(file);
  }

  @Delete(':fileId')
  @ApiOperation({ summary: 'Delete a file from Supabase' })
  @ApiParam({ name: 'fileId', required: true })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: { type: 'boolean' },
  })
  async deleteFile(@Param('fileId') fileId: string): Promise<boolean> {
    return await this.fileService.deleteFile(fileId);
  }

  @Get(':fileId/upload/signed-url')
  @ApiOperation({ summary: 'Generate a signed URL for uploading a file' })
  @ApiParam({
    name: 'fileId',
    required: true,
    description:
      'The desired file name and extension (e.g., 374884433_filename.png)',
  })
  @ApiResponse({
    status: 200,
    description: 'Signed Upload URL generated',
    schema: { type: 'string' },
  })
  async getUploadSignedUrl(@Param('fileId') fileId: string): Promise<string> {
    return await this.fileService.getUploadSignedUrl(fileId);
  }

  @Get(':fileId/signed-url')
  @ApiOperation({ summary: 'Generate a signed URL for accessing a file' })
  @ApiParam({ name: 'fileId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Signed URL generated',
    schema: { type: 'string' },
  })
  async getSignedUrl(@Param('fileId') fileId: string): Promise<string> {
    return await this.fileService.getSignedUrl(fileId);
  }
}
