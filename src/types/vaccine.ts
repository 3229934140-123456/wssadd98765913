export interface ShipmentInfo {
  waybillNo: string
  originWarehouse: string
  destinationClinic: string
  carrier: string
  vehicleNo: string
  driverName: string
  driverPhone: string
  startTime: string
  estimatedArrival: string
  actualArrival: string
  temperatureMin: number
  temperatureMax: number
  temperatureStandard: string
  hasDoorOpen: boolean
  doorOpenCount: number
  status: 'normal' | 'warning' | 'error'
}

export interface VaccineBatch {
  id: string
  batchNo: string
  vaccineName: string
  vaccineType: string
  spec: string
  expectedQuantity: number
  actualQuantity?: number
  quantityPassed?: boolean | null
  batchRemark?: string
}

export interface TraceSummary {
  totalDuration: string
  totalPoints: number
  abnormalCount: number
  doorOpenCount: number
  temperatureRange: string
  routeText: string
}

export interface TracePoint {
  id: string
  time: string
  location: string
  temperature: number
  type: 'normal' | 'door_open' | 'temperature_abnormal' | 'arrival' | 'departure'
  description: string
  duration?: number
  carrierRemark?: string
}

export interface CheckItem {
  id: string
  label: string
  description: string
  required: boolean
}

export interface PhotoItem {
  id: string
  label: string
  description: string
  required: boolean
  imageUrl?: string
}

export interface AcceptanceRecord {
  id: string
  waybillNo: string
  vaccineBatches: VaccineBatch[]
  arrivalTime: string
  receiverName: string
  receiverDept: string
  checkResults: { itemId: string; passed: boolean }[]
  photos: { label: string; url: string }[]
  abnormalConclusion: string
  status: 'passed' | 'rejected' | 'pending'
  signTime: string
  traceSummary?: TraceSummary
  handoverId?: string
  rejectTrackingId?: string
}

export interface RejectTracking {
  id: string
  acceptanceId: string
  carrierRemark: string
  replenishQty: number
  reviewResult: 'closed' | 'pending' | 'processing'
  reviewRemark: string
  reviewTime: string
  reviewerName: string
}

export interface Handover {
  id: string
  title: string
  dept: string
  month: string
  recordIds: string[]
  passedCount: number
  rejectedCount: number
  totalQty: number
  rejectedQty: number
  createTime: string
  creatorName: string
  confirmStatus: 'pending' | 'confirmed'
  confirmerName?: string
  confirmTime?: string
}
