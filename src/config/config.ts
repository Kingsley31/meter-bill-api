import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRY_IN_H0URS: 48,
  RESEND_API_KEY: process.env.RESEND_API_KEY as string,
  AWS_REGION: process.env.AWS_REGION as string,
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME as string,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID as string,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY as string,
  AWS_CLOUDFRONT_ENDPOINT: process.env.AWS_CLOUDFRONT_ENDPOINT as string,
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
  FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL as string,
};

function assertConfigValid<T extends Record<string, any>>(obj: T): void {
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === '') {
      throw new Error(
        `Config validation error: Field "${key}" is ${value === '' ? 'empty string' : value}`,
      );
    }
  }
}

// Run the validation
assertConfigValid(config);
