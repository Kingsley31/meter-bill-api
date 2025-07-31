export interface TotalConsumptionResult {
  meterId: string;
  totalConsumption: string; // numeric comes as string
}

export interface SubmeterWithConsumption {
  subMeterId: string;
  operator: string;
  kwhConsumption: number;
}

export interface ReferenceMeterWithConsumption {
  referenceMeterId: string;
  kwhConsumption: number;
}

import { meters, meterSubmeters } from './meter.schema';
export type SubMeter = typeof meterSubmeters.$inferSelect;
export type MeterWithSubMeters = typeof meters.$inferSelect & {
  subMeters: SubMeter[];
};
