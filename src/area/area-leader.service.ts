import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AssignAreaToLeaderDto } from './dtos/assign-area-to-leader.dto';
import { DATABASE } from 'src/database/constants';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import schema from 'src/database/schema';
import { areaLeaders } from './area.schema';
import { and, between, count, eq, ilike, or } from 'drizzle-orm';
import { ListAreaLeaderQueryDto } from './dtos/list-area-leader.dto';
import { PaginatedResponseDto } from '../common/dtos/paginated-response.dto';
import { AreaLeaderResponseDto } from './dtos/area-leader.response.dto';
import { mapAreaToAreaResponse } from './utils';

@Injectable()
export class AreaLeaderService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async assignAreaToLeader(params: AssignAreaToLeaderDto): Promise<boolean> {
    const areaLeader = await this.db.query.areaLeaders.findFirst({
      where: and(
        eq(areaLeaders.areaId, params.areaId),
        eq(areaLeaders.leaderId, params.leaderId),
      ),
    });
    if (areaLeader) {
      throw new BadRequestException('Area is already assigned to this leader');
    }
    await this.db.insert(areaLeaders).values(params).returning();
    // const [{ count: totalCount }] = await this.db
    //   .select({ count: count() })
    //   .from(areaLeaders)
    //   .where(eq(areaLeaders.areaId, params.areaId));

    // await this.areaService.updateLeader(params.areaId, {
    //   leaderId: params.leaderId,
    //   leaderName: params.leaderName,
    //   totalLeaders: totalCount,
    // });
    return true;
  }

  async listAreaLeaders(
    areaId: string,
    filter: ListAreaLeaderQueryDto,
  ): Promise<PaginatedResponseDto<AreaLeaderResponseDto>> {
    const {
      search,
      createdAtStart,
      createdAtEnd,
      page = 1,
      pageSize = 20,
    } = filter;

    const where: Array<ReturnType<typeof eq> | ReturnType<typeof or>> = [
      eq(areaLeaders.areaId, areaId),
    ];
    if (search) {
      where.push(
        or(
          ilike(areaLeaders.leaderName, search),
          ilike(areaLeaders.leaderEmail, search),
          ilike(areaLeaders.leaderPhone, search),
        ),
      );
    }
    if (createdAtStart && createdAtEnd) {
      where.push(between(areaLeaders.createdAt, createdAtStart, createdAtEnd));
    }
    const offset = (page - 1) * pageSize;
    const areaLeaderRows = await this.db.query.areaLeaders.findMany({
      where: and(...where),
      with: { area: true },
      limit: pageSize,
      offset: offset,
      orderBy: (areaLeaders, { desc }) => desc(areaLeaders.createdAt),
    });
    const totalCount = await this.db
      .select({ count: count() })
      .from(areaLeaders)
      .where(where.length ? and(...where) : undefined);

    return {
      data: areaLeaderRows.map((areaLeader) => ({
        ...areaLeader,
        area: mapAreaToAreaResponse({ ...areaLeader.area }),
      })),
      total: totalCount[0].count,
      page,
      pageSize,
      hasMore: totalCount[0].count > page * pageSize,
    };
  }

  async deleteAreaLeader(params: { areaId: string; leaderId: string }) {
    const areaLeader = await this.db.query.areaLeaders.findFirst({
      where: and(
        eq(areaLeaders.areaId, params.areaId),
        eq(areaLeaders.leaderId, params.leaderId),
      ),
    });
    if (!areaLeader) {
      throw new BadRequestException('Area leader assignment not found');
    }
    await this.db
      .delete(areaLeaders)
      .where(
        and(
          eq(areaLeaders.areaId, params.areaId),
          eq(areaLeaders.leaderId, params.leaderId),
        ),
      )
      .returning();
    // const [{ count: totalCount }] = await this.db
    //   .select({ count: count() })
    //   .from(areaLeaders)
    //   .where(eq(areaLeaders.areaId, params.areaId));
    // const lastAssignedLeader = await this.db.query.areaLeaders.findFirst({
    //   where: eq(areaLeaders.areaId, params.areaId),
    //   orderBy: (areaLeaders, { desc }) => desc(areaLeaders.createdAt),
    // });
    // const dummyUuid = '0f4f2453-a209-4d49-8fa7-a5023a8a5d1c';
    // await this.areaService.updateLeader(params.areaId, {
    //   leaderId: lastAssignedLeader?.leaderId ?? dummyUuid,
    //   leaderName: lastAssignedLeader?.leaderName ?? 'None',
    //   totalLeaders: totalCount,
    // });
    return true;
  }
}
