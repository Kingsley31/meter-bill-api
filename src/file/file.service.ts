import { IFileService } from './file.service.interface';

export class FileService implements IFileService {
  uploadFile(file: Express.Multer.File): Promise<string> {
    throw new Error('Method not implemented.');
  }
  deleteFile(fileId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  getSignedUrl(fileId: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
