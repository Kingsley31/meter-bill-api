import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';

@Injectable()
export class AppService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}
  async getHello(): Promise<string> {
    //const tableName = await this.db.execute('select * from meters');
    //console.log(tableName);
    return Promise.resolve('Hello world');
  }
}
