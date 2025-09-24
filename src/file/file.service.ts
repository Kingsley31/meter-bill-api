import { IFileService } from './file.service.interface';

export class FileService implements IFileService {
  uploadFile(file: Express.Multer.File): Promise<string> {
    throw new Error(`Method not implemented. to upload ${file.originalname}`);
  }
  deleteFile(fileId: string): Promise<boolean> {
    throw new Error(`Method not implemented. to delete ${fileId}`);
  }
  getSignedUrl(fileId: string): Promise<string> {
    throw new Error(`Method not implemented. to get signed url for ${fileId}`);
  }

  getUploadSignedUrl(fileId: string): Promise<string> {
    throw new Error(
      `Method not implemented. to get upload signed url for ${fileId}`,
    );
  }
}
