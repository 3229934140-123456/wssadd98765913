export interface ShipmentInfo {
  waybillNo: string
  batchNo: string
  vaccineName: string
  vaccineType: string
  quantity: number
  spec: string
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
  batchNo: string
  vaccineName: string
  quantity: number
  arrivalTime: string
  receiverName: string
  receiverDept: string
  checkResults: { itemId: string; passed: boolean }[]
  photos: { label: string; url: string }[]
  abnormalConclusion: string
  status: 'passed' | 'rejected' | 'pending'
  signTime: string
}
