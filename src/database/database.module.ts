import { Global, Module } from '@nestjs/common';
import schema from './schema';
import { DATABASE } from './constants';
import { config } from 'src/config/config';
import { drizzle } from 'drizzle-orm/postgres-js';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: () => {
        return drizzle(config.DATABASE_URL, { schema });
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
