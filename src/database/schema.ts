import {
  meters,
  meterSubmeters,
  meterRelation,
  submeterRelations,
  meterReadings,
  meterReadingRelations,
  meterTariffs,
} from 'src/meter/meter.schema';

export * from 'src/meter/meter.schema';

import {
  customerMeters,
  customerMeterRelations,
} from 'src/customer-meter/customer-meter.schema';

export * from 'src/customer-meter/customer-meter.schema';

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
};

export default schema;
