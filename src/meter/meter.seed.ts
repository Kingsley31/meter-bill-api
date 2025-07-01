import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module'; // Ensure this path is correct. If 'app.module.ts' is in 'src', use './app.module' or adjust the path as needed.
import { MeterService } from './meter.service';
// Update the import path if the enums file is located elsewhere, e.g. '../dtos/enums' or './enums'
import { MeterPurpose, MeterType, Operaor } from './enums';
// If the file does not exist, create 'enums.ts' in the appropriate directory and define the enums there.
import { randomUUID } from 'crypto';

function randomMeterNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function randomAreaName() {
  const areas = [
    'Lagos Mainland',
    'Abuja Central',
    'Port Harcourt',
    'Kano City',
    'Ibadan North',
    'Enugu East',
    'Kaduna South',
    'Benin City',
    'Jos North',
    'Abeokuta',
  ];
  return areas[Math.floor(Math.random() * areas.length)];
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const meterService = app.get(MeterService);

  for (let i = 0; i < 10; i++) {
    const areaId = randomUUID();
    const subMeterId = randomUUID();
    const meterType = i % 2 === 0 ? MeterType.DERIVED : MeterType.MEASUREMENT;

    await meterService.createMeter({
      meterNumber: randomMeterNumber(),
      areaId,
      areaName: randomAreaName(),
      ctRating: Math.floor(Math.random() * 200) + 50,
      ctMultiplierFactor: parseFloat((Math.random() * 5 + 1).toFixed(2)),
      purpose: MeterPurpose.CONSUMER,
      type: meterType as MeterType,
      calculationReferenceMeterId:
        meterType === MeterType.DERIVED ? randomUUID() : undefined,
      hasMaxKwhReading: true,
      maxKwhReading: Math.floor(Math.random() * 90000) + 10000,
      subMeters:
        meterType === MeterType.DERIVED
          ? [
              {
                meterId: areaId,
                subMeterId,
                operator: Operaor.ADD,
              },
            ]
          : undefined,
    } as Parameters<typeof meterService.createMeter>[0]);
  }

  console.log('Seeded 10 random meters.');
  await app.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
