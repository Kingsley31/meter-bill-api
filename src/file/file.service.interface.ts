import { Express } from 'express';

export interface IFileService {
  uploadFile(file: Express.Multer.File): Promise<string>;
  deleteFile(fileId: string): Promise<boolean>;
  getSignedUrl(fileId: string): Promise<string>;
}
