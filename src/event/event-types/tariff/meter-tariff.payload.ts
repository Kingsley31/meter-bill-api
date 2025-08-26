export type MeterTariffPayload = {
  id: string;
  meterNumber: string;
  meterId: string;
  areaId: string;
  tariff: number;
  effectiveFrom: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
};
