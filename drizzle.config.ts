import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const connectionString = process.env.DATABASE_URL as string;

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: './src/database/migrations',
  dbCredentials: {
    url: connectionString,
  },
});
