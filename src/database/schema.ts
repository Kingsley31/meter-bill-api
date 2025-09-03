import {
  meters,
  meterSubmeters,
  meterRelation,
  submeterRelations,
  meterReadings,
  meterReadingRelations,
  meterReadingUpdates,
} from 'src/meter/meter.schema';

export * from 'src/meter/meter.schema';

import {
  customerMeters,
  customerMeterRelations,
} from 'src/customer-meter/customer-meter.schema';

export * from 'src/customer-meter/customer-meter.schema';
export * from 'src/area/area.schema';
import { areas, areaLeaders, areaLeaderRelations } from 'src/area/area.schema';

import { meterTariffs, areaTariffs } from 'src/tariff/tariff.schema';
export * from 'src/tariff/tariff.schema';

import {
  billGenerationRequests,
  bills,
  billRelations,
  billBreakdowns,
  billBreakdownRelations,
  invoiceSequences,
  recipients,
  recipientRelations,
} from 'src/bill/bill.schema';

export * from 'src/bill/bill.schema';

const schema = {
  meters,
  meterSubmeters,
  meterRelation,
  submeterRelations,
  meterReadings,
  meterReadingRelations,
  meterTariffs,
  customerMeters,
  customerMeterRelations,
  meterReadingUpdates,
  areas,
  areaTariffs,
  areaLeaders,
  areaLeaderRelations,
  billGenerationRequests,
  bills,
  billRelations,
  billBreakdowns,
  billBreakdownRelations,
  recipients,
  recipientRelations,
  invoiceSequences,
};

export default schema;
