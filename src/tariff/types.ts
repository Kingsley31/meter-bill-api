import { TariffType } from './enums';

export type MeterConsumptionTariff = {
  tariffId: string;
  effectiveFrom: Date;
  tariff: number;
  endDate?: Date | null;
  tariffType: TariffType;
};
