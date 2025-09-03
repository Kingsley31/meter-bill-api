export type BillRecipient = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  billId: string;
  phoneNumber: string | null;
  email: string;
  billSent: boolean;
};

export type BillPayload = {
  id: string;
  areaId: string | null;
  areaName: string | null;
  createdAt: Date;
  updatedAt: Date;
  endDate: Date;
  scope: string;
  isConsolidated: boolean;
  startDate: Date;
  recipientType: string;
  invoiceNumber: string;
  requestId: string;
  generateByUserId: string;
  generateByUserName: string;
  pdfGenerated: boolean;
  pdfUrl: string | null;
  totalAmountDue: string;
  paymentStatus: string;
  billRecipients: BillRecipient[];
};
