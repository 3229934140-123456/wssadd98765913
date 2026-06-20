import { create } from 'zustand'
import type { ShipmentInfo, TracePoint, CheckItem, PhotoItem, AcceptanceRecord } from '@/types/vaccine'
import {
  mockShipmentInfo,
  mockTracePoints,
  mockCheckItems,
  mockPhotoItems,
  mockAcceptanceRecord,
  mockAcceptanceHistory
} from '@/data/mockVaccine'

interface VaccineStore {
  scanned: boolean
  shipmentInfo: ShipmentInfo | null
  tracePoints: TracePoint[]
  checkItems: CheckItem[]
  photoItems: PhotoItem[]
  checkResults: Record<string, boolean>
  acceptanceRecord: AcceptanceRecord | null
  acceptanceHistory: AcceptanceRecord[]
  receiverName: string
  receiverDept: string

  setScanned: (scanned: boolean) => void
  scanWaybill: (waybillNo?: string) => void
  setCheckResult: (itemId: string, passed: boolean) => void
  setPhotoUrl: (photoId: string, url: string) => void
  setReceiverInfo: (name: string, dept: string) => void
  submitAcceptance: (status: 'passed' | 'rejected', conclusion: string) => boolean
  resetAcceptance: () => void
  getAcceptanceById: (id: string) => AcceptanceRecord | undefined
}

export const useVaccineStore = create<VaccineStore>((set, get) => ({
  scanned: false,
  shipmentInfo: null,
  tracePoints: [],
  checkItems: mockCheckItems,
  photoItems: mockPhotoItems,
  checkResults: {},
  acceptanceRecord: null,
  acceptanceHistory: mockAcceptanceHistory,
  receiverName: '',
  receiverDept: '',

  setScanned: (scanned) => set({ scanned }),

  scanWaybill: () => {
    console.log('[VaccineStore] scanWaybill called')
    set({
      scanned: true,
      shipmentInfo: mockShipmentInfo,
      tracePoints: mockTracePoints,
      checkResults: {}
    })
  },

  setCheckResult: (itemId, passed) => {
    set((state) => ({
      checkResults: {
        ...state.checkResults,
        [itemId]: passed
      }
    }))
  },

  setPhotoUrl: (photoId, url) => {
    set((state) => ({
      photoItems: state.photoItems.map((item) =>
        item.id === photoId ? { ...item, imageUrl: url } : item
      )
    }))
  },

  setReceiverInfo: (name, dept) => {
    set({
      receiverName: name,
      receiverDept: dept
    })
  },

  submitAcceptance: (status, conclusion) => {
    const state = get()
    const { shipmentInfo, checkItems, checkResults, photoItems, receiverName, receiverDept } = state

    if (!shipmentInfo) {
      console.error('[VaccineStore] submitAcceptance: no shipment info')
      return false
    }

    const allRequiredChecked = checkItems
      .filter((item) => item.required)
      .every((item) => checkResults[item.id] !== undefined)

    if (!allRequiredChecked) {
      console.error('[VaccineStore] submitAcceptance: required check items not completed')
      return false
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const record: AcceptanceRecord = {
      id: `acc${Date.now()}`,
      waybillNo: shipmentInfo.waybillNo,
      batchNo: shipmentInfo.batchNo,
      vaccineName: shipmentInfo.vaccineName,
      quantity: shipmentInfo.quantity,
      arrivalTime: shipmentInfo.actualArrival,
      receiverName: receiverName || '当前用户',
      receiverDept: receiverDept || '预防接种门诊',
      checkResults: Object.entries(checkResults).map(([itemId, passed]) => ({ itemId, passed })),
      photos: photoItems
        .filter((item) => item.imageUrl)
        .map((item) => ({ label: item.label, url: item.imageUrl! })),
      abnormalConclusion: conclusion,
      status,
      signTime: now
    }

    set((state) => ({
      acceptanceRecord: record,
      acceptanceHistory: [record, ...state.acceptanceHistory]
    }))

    console.log('[VaccineStore] submitAcceptance success:', record.id)
    return true
  },

  resetAcceptance: () => {
    set({
      scanned: false,
      shipmentInfo: null,
      tracePoints: [],
      checkResults: {},
      acceptanceRecord: null,
      photoItems: mockPhotoItems.map((item) => ({ ...item, imageUrl: undefined })),
      receiverName: '',
      receiverDept: ''
    })
  },

  getAcceptanceById: (id) => {
    return get().acceptanceHistory.find((item) => item.id === id)
  }
}))
