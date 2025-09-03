export enum BillGenerationRequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum BillGenerationRequestScope {
  AREA_WIDE = 'area-wide',
  SYSTEM_WIDE = 'system-wide',
}

export enum BillGenerationRequestRecepientType {
  CUSTOMER = 'customer',
  AREA_LEADER = 'area-leader',
}
