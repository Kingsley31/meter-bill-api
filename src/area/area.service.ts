import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateAreaDto } from './dtos/create-area.dto';
import { DATABASE } from 'src/database/constants';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import schema from 'src/database/schema';
import { AreaResponseDto } from './dtos/area.response.dto';
import { and, count, eq, ilike, or } from 'drizzle-orm';
import { areas } from './area.schema';
import { mapAreaToAreaResponse } from './utils';
import { ListAreaQueryDto } from './dtos/list-area.dto';
import { PaginatedResponseDto } from '../common/dtos/paginated-response.dto';

@Injectable()
export class AreaService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async createArea(body: CreateAreaDto): Promise<AreaResponseDto> {
    const areaExists = await this.db.query.areas.findFirst({
      where: and(
        eq(areas.areaName, body.areaName),
        eq(areas.city, body.city),
        eq(areas.state, body.state),
        eq(areas.country, body.country),
      ),
    });
    if (areaExists) throw new BadRequestException('This Area already exists.');
    const result = await this.db.insert(areas).values(body).returning();
    const createdArea = result[0];
    return mapAreaToAreaResponse(createdArea);
  }

  async listAreas(
    filter: ListAreaQueryDto,
  ): Promise<PaginatedResponseDto<AreaResponseDto>> {
    const { search, page = 1, pageSize } = filter;

    const where: Array<ReturnType<typeof eq> | ReturnType<typeof or>> = [];

    if (search) {
      where.push(
        or(
          ilike(areas.areaName, `%${search}%`),
          ilike(areas.address, `%${search}%`),
          ilike(areas.country, `%${search}%`),
          ilike(areas.state, `%${search}%`),
          ilike(areas.city, `%${search}%`),
        ),
      );
    }

    const offset = (page - 1) * pageSize;

    // Get total count
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(areas)
      .where(where.length ? and(...where) : undefined);

    // Get paginated data
    const areaRows = await this.db.query.areas.findMany({
      where: where.length ? and(...where) : undefined,
      limit: pageSize,
      offset: offset,
      orderBy: (area, { desc }) => [desc(area.createdAt)],
    });

    return {
      data: areaRows.map(mapAreaToAreaResponse),
      total: totalCount,
      page: page,
      pageSize: pageSize,
      hasMore: totalCount > page * pageSize,
    } as PaginatedResponseDto<AreaResponseDto>;
  }

  async getAreaStats() {
    // Total meters
    const [{ count: totalAreas }] = await this.db
      .select({ count: count() })
      .from(areas);

    // Total unassigned areas
    const [{ count: totalUnassignedAreas }] = await this.db
      .select({ count: count() })
      .from(areas)
      .where(eq(areas.totalMeters, '0'));

    return {
      totalAreas,
      totalUnassignedAreas,
    };
  }

  async updateAreaTotalMeter(areaId: string, totalMeters: number) {
    const updatedArea = await this.db
      .update(areas)
      .set({ totalMeters: totalMeters.toString() })
      .where(eq(areas.id, areaId))
      .returning();
    return updatedArea[0];
  }
}
