import * as dotenv from 'dotenv';
dotenv.config();

export const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME!;
export const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;
export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
