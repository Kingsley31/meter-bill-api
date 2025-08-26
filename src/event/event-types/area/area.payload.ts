export type AreaPayload = {
  id: string;
  areaName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  totalMeters: number;
  type: string | null;
  currentTariff: number;
  totalKwhReading?: number | null;
  totalKwhConsumption?: number | null;
  lastBillKwhConsumption?: number | null;
  lastBillDate?: Date | null;
  lastBillAmount?: number | null;
  createdAt: Date;
  updatedAt: Date;
};
