export type GeneratedBillBreakdown = {
  meterId: string;
  areaId: string;
  location: string;
  areaName: string;
  meterNumber: string;
  lastReadDate: string;
  firstReadKwh: number;
  lastReadKwh: number;
  totalConsumption: number;
  tariff: number;
  totalAmount: string;
};

export type GeneratdBillRecipient = {
  name: string;
};

export type GeneratedBill = {
  invoiceNumber: string;
  requestId: string;
  generateByUserId: string;
  generateByUserName: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  totalAmountDue: string;
  isConsolidated: boolean;
  recipientType: string;
};

export type BankDetails = {
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankCode: string;
};

export type BillPDFPayload = {
  billBreakdowns: GeneratedBillBreakdown[];
  recipient?: GeneratdBillRecipient; // optional
  bankDetails?: BankDetails; // optional
  bill: GeneratedBill;
};

export type BillMeter = { id: string; areaId: string };
