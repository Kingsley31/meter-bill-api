import { AreaRecord } from './area.schema';

export const mapAreaToAreaResponse = (area: AreaRecord) => {
  return {
    ...area,
    currentTariff: area.currentTariff ? Number(area.currentTariff) : 0,
    totalKwhReading: area.totalKwhReading ? Number(area.totalKwhReading) : 0,
    totalKwhConsumption: area.totalKwhConsumption
      ? Number(area.totalKwhConsumption)
      : 0,
    totalMeters: area.totalMeters ? Number(area.totalMeters) : 0,
    lastBillAmount: area.lastBillAmount ? Number(area.lastBillAmount) : 0,
    lastBillKwhConsumption: area.lastBillKwhConsumption
      ? Number(area.lastBillKwhConsumption)
      : 0,
  };
};
