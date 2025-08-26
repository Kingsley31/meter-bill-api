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
import { AssignAreaToLeaderDto } from './dtos/assign-area-to-leader.dto';
import { AreaLeaderService } from './area-leader.service';
import { ListAreaLeaderQueryDto } from './dtos/list-area-leader.dto';
import { AreaLeaderResponseDto } from './dtos/area-leader.response.dto';
import { MeterCreatedEvent } from 'src/event/event-types/meter/meter-created.event';
import { Subscribe } from 'src/event/subscribe.decorator';
import { EventType } from 'src/event/enums';
import { MeterUpdatedEvent } from 'src/event/event-types/meter/meter-updated.event';
import { EventService } from 'src/event/event.service';
import { AreaCreatedEvent } from 'src/event/event-types/area/area-created.event';
import { AreaUpdatedEvent } from 'src/event/event-types/area/area-updated.event';
import { TariffService } from 'src/tariff/tariff.service';
import { AreaTariffCreatedEvent } from 'src/event/event-types/tariff/area-tariff-created.event';
import { AreaPayload } from 'src/event/event-types/area/area.payload';

@Injectable()
export class AreaService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly areaLeaderService: AreaLeaderService,
    private readonly eventService: EventService,
    private readonly tariffService: TariffService,
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
    const mapedCreadedArea: AreaPayload = mapAreaToAreaResponse(createdArea);
    const event = new AreaCreatedEvent(
      EventType.AREA_CREATED,
      mapedCreadedArea,
    );
    this.eventService.publish(EventType.AREA_CREATED, event);
    return mapedCreadedArea;
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

  async incrementAreaTotalMeter(areaId: string) {
    const area = await this.db.query.areas.findFirst({
      where: eq(areas.id, areaId),
    });
    if (!area) return true;
    const totalMeters = Number(area.totalMeters) + 1;
    const updatedArea = await this.db
      .update(areas)
      .set({ totalMeters: totalMeters.toString() })
      .where(eq(areas.id, areaId))
      .returning();
    const mapedOldAreaData: AreaPayload = mapAreaToAreaResponse(area);
    const mapedUpdatedArea: AreaPayload = mapAreaToAreaResponse(updatedArea[0]);
    const event = new AreaUpdatedEvent(EventType.AREA_UPDATED, {
      old: mapedOldAreaData,
      new: mapedUpdatedArea,
    });
    this.eventService.publish(EventType.AREA_UPDATED, event);
    return updatedArea[0];
  }

  async decrementAreaTotalMeter(areaId: string) {
    const area = await this.db.query.areas.findFirst({
      where: eq(areas.id, areaId),
    });
    if (!area) return true;
    const totalMeters = Number(area.totalMeters) - 1;
    const updatedArea = await this.db
      .update(areas)
      .set({ totalMeters: totalMeters.toString() })
      .where(eq(areas.id, areaId))
      .returning();
    const mapedOldAreaData: AreaPayload = mapAreaToAreaResponse(area);
    const mapedUpdatedArea: AreaPayload = mapAreaToAreaResponse(updatedArea[0]);
    const event = new AreaUpdatedEvent(EventType.AREA_UPDATED, {
      old: mapedOldAreaData,
      new: mapedUpdatedArea,
    });
    this.eventService.publish(EventType.AREA_UPDATED, event);
    return updatedArea[0];
  }

  @Subscribe(EventType.METER_CREATED)
  onMeterCreated(event: MeterCreatedEvent) {
    this.incrementAreaTotalMeter(event.data.areaId).catch((e) =>
      console.error(e),
    );
  }

  @Subscribe(EventType.METER_UPDATED)
  onMeterUpdated(event: MeterUpdatedEvent) {
    if (event.data.new.areaId == event.data.old.areaId) return;

    this.incrementAreaTotalMeter(event.data.new.areaId).catch((e) =>
      console.error(e),
    );
    this.decrementAreaTotalMeter(event.data.old.areaId).catch((e) =>
      console.error(e),
    );
  }

  async getAreaById(params: { areaId: string }): Promise<AreaResponseDto> {
    const area = await this.db.query.areas.findFirst({
      where: eq(areas.id, params.areaId),
    });
    if (!area) {
      throw new BadRequestException('Ara not found');
    }
    return mapAreaToAreaResponse(area);
  }

  async setCurrentAreaTariff(params: { areaId: string }) {
    const currentDate = new Date();
    const currentAreaTariff = await this.tariffService.getAreaCurrentDateTariff(
      { areaId: params.areaId, date: currentDate },
    );
    if (!currentAreaTariff) return;
    await this.db
      .update(areas)
      .set({
        currentTariff: currentAreaTariff.tariff!.toString(),
      })
      .where(eq(areas.id, params.areaId));
  }

  @Subscribe(EventType.AREA_TARIFF_CREATED)
  onAreaTariffCreated(event: AreaTariffCreatedEvent) {
    this.setCurrentAreaTariff({ areaId: event.data.areaId }).catch((e) =>
      console.log(e),
    );
  }

  async assignAreaToLeader(id: string, body: AssignAreaToLeaderDto) {
    const area = await this.db.query.areas.findFirst({
      where: eq(areas.id, id),
    });
    if (!area) {
      throw new BadRequestException('Area not found');
    }
    await this.areaLeaderService.assignAreaToLeader({
      ...body,
      areaId: area.id,
      areaName: area.areaName,
    });
    return true;
  }

  async listAreaLeaders(
    id: string,
    filter: ListAreaLeaderQueryDto,
  ): Promise<PaginatedResponseDto<AreaLeaderResponseDto>> {
    return this.areaLeaderService.listAreaLeaders(id, filter);
  }
}
