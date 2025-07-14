import { createClient, SupabaseClient } from '@supabase/supabase-js'; // path to your interface
import { Express } from 'express';
import { IFileService } from './file.service.interface';
import {
  BUCKET_NAME,
  SIGNED_URL_EXPIRY_SECONDS,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from 'src/config/supabase.config';

export class SupabaseFileService implements IFileService {
  supabase: SupabaseClient<any, 'public', any>;
  constructor() {
    this.supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY, // Use service role key for server-side ops
    );
  }
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const filePath = `${Date.now()}_${file.originalname}`
      .trim()
      .replace(/\s+/g, '_') // replace whitespace with underscores
      .replace(/[^a-zA-Z0-9._-]/g, '_'); // replace special characters

    const { error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return filePath;
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const { error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .remove([fileId]);

    if (error) {
      console.error('Delete failed:', error.message);
      return false;
    }

    return true;
  }

  async getSignedUrl(fileId: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileId, SIGNED_URL_EXPIRY_SECONDS);

    if (error || !data) {
      throw new Error(`Failed to get signed URL: ${error?.message}`);
    }

    return data.signedUrl;
  }
}
