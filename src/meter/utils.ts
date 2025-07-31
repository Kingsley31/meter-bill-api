import { MeterResponseDto } from './dtos/meter.response.dto';
import { MeterPurpose, MeterType, Operaor } from './enums';
import { MeterWithSubMeters } from './types';

export function mapMeterToResponseDto(
  meter: MeterWithSubMeters,
): MeterResponseDto {
  return {
    ...meter,
    totalCustomers: Number(meter.totalCustomers),
    ctRating: meter.ctRating !== null ? Number(meter.ctRating) : 0,
    ctMultiplierFactor:
      meter.ctMultiplierFactor !== null ? Number(meter.ctMultiplierFactor) : 0,
    maxKwhReading:
      meter.maxKwhReading !== null ? Number(meter.maxKwhReading) : 0,
    currentKwhReading:
      meter.currentKwhReading !== null && meter.currentKwhReading !== undefined
        ? Number(meter.currentKwhReading)
        : null,
    tariff:
      meter.tariff !== null && meter.tariff !== undefined
        ? Number(meter.tariff)
        : null,
    subMeters: (meter.subMeters ?? []).map((subMeter) => ({
      ...subMeter,
      operator: subMeter.operator as Operaor,
    })),
    purpose: meter.purpose as MeterPurpose,
    type: meter.type as MeterType,
  } as MeterResponseDto;
}
