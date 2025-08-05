import {
  meters,
  meterSubmeters,
  meterRelation,
  submeterRelations,
  meterReadings,
  meterReadingRelations,
  meterReadingUpdates,
  meterTariffs,
} from 'src/meter/meter.schema';

export * from 'src/meter/meter.schema';

import {
  customerMeters,
  customerMeterRelations,
} from 'src/customer-meter/customer-meter.schema';

export * from 'src/customer-meter/customer-meter.schema';
export * from 'src/area/area.schema';
import { areas } from 'src/area/area.schema';

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
};

export default schema;
