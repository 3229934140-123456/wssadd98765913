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
  submitAcceptance: (status: 'passed' | 'rejected', conclusion: string, receiverName?: string, receiverDept?: string) => { success: boolean; message: string }
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

  scanWaybill: (waybillNo) => {
    if (!waybillNo) {
      console.warn('[VaccineStore] scanWaybill: waybillNo is empty, ignored')
      return
    }
    console.log('[VaccineStore] scanWaybill called with:', waybillNo)
    set({
      scanned: true,
      shipmentInfo: { ...mockShipmentInfo, waybillNo },
      tracePoints: mockTracePoints,
      checkResults: {},
      photoItems: mockPhotoItems.map((item) => ({ ...item, imageUrl: undefined })),
      receiverName: '',
      receiverDept: ''
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

  submitAcceptance: (status, conclusion, receiverNameInput, receiverDeptInput) => {
    const state = get()
    const { shipmentInfo, checkItems, checkResults, photoItems } = state

    if (!shipmentInfo) {
      console.error('[VaccineStore] submitAcceptance: no shipment info')
      return { success: false, message: '请先扫描运单' }
    }

    const finalReceiverName = (receiverNameInput || '').trim()
    const finalReceiverDept = (receiverDeptInput || '').trim()

    if (!finalReceiverName) {
      console.error('[VaccineStore] submitAcceptance: receiverName is empty')
      return { success: false, message: '请填写签收人姓名' }
    }

    const requiredPhotoItems = photoItems.filter((item) => item.required)
    const allPhotosUploaded = requiredPhotoItems.every((item) => item.imageUrl)
    if (!allPhotosUploaded) {
      const missing = requiredPhotoItems.filter((item) => !item.imageUrl).map((item) => item.label)
      console.error('[VaccineStore] submitAcceptance: missing photos:', missing)
      return { success: false, message: `请补齐照片：${missing.join('、')}` }
    }

    const allRequiredChecked = checkItems
      .filter((item) => item.required)
      .every((item) => checkResults[item.id] !== undefined)

    if (!allRequiredChecked) {
      console.error('[VaccineStore] submitAcceptance: required check items not completed')
      return { success: false, message: '请完成所有验收项的勾选' }
    }

    if (status === 'passed') {
      const allPassed = checkItems
        .filter((item) => item.required)
        .every((item) => checkResults[item.id] === true)
      if (!allPassed) {
        console.error('[VaccineStore] submitAcceptance: cannot pass with failed items')
        return { success: false, message: '存在不合格项，无法签收合格，请选择验收不合格' }
      }
    }

    if (status === 'rejected' && !conclusion.trim()) {
      console.error('[VaccineStore] submitAcceptance: rejected without conclusion')
      return { success: false, message: '请填写异常说明' }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const record: AcceptanceRecord = {
      id: `acc${Date.now()}`,
      waybillNo: shipmentInfo.waybillNo,
      batchNo: shipmentInfo.batchNo,
      vaccineName: shipmentInfo.vaccineName,
      quantity: shipmentInfo.quantity,
      arrivalTime: shipmentInfo.actualArrival,
      receiverName: finalReceiverName,
      receiverDept: finalReceiverDept || '预防接种门诊',
      checkResults: Object.entries(checkResults).map(([itemId, passed]) => ({ itemId, passed })),
      photos: photoItems
        .filter((item) => item.imageUrl)
        .map((item) => ({ label: item.label, url: item.imageUrl! })),
      abnormalConclusion: conclusion.trim() || '验收合格，无异常情况。',
      status,
      signTime: now
    }

    set((s) => ({
      acceptanceRecord: record,
      acceptanceHistory: [record, ...s.acceptanceHistory],
      receiverName: finalReceiverName,
      receiverDept: finalReceiverDept
    }))

    console.log('[VaccineStore] submitAcceptance success:', record.id, record.receiverName)
    return { success: true, message: '' }
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
