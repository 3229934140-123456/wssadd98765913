import { create } from 'zustand'
import type { ShipmentInfo, TracePoint, CheckItem, PhotoItem, AcceptanceRecord } from '@/types/vaccine'
import {
  mockShipmentInfo,
  mockTracePoints,
  mockCheckItems,
  mockPhotoItems,
  mockAcceptanceHistory
} from '@/data/mockVaccine'

interface VaccineStore {
  checkItems: CheckItem[]
  pendingRecord: AcceptanceRecord | null
  shipmentInfo: ShipmentInfo | null
  tracePoints: TracePoint[]
  acceptanceRecord: AcceptanceRecord | null
  acceptanceHistory: AcceptanceRecord[]

  scanWaybill: (waybillNo: string) => void
  setCheckResult: (itemId: string, passed: boolean) => void
  setPhotoUrl: (photoId: string, url: string) => void
  submitAcceptance: (
    status: 'passed' | 'rejected',
    conclusion: string,
    receiverName: string,
    receiverDept: string
  ) => { success: boolean; message: string }
  resetAcceptance: () => void
  getAcceptanceById: (id: string) => AcceptanceRecord | undefined
  getCheckItemLabels: () => { id: string; label: string }[]
}

const createEmptyCheckResults = (): Record<string, boolean | null> => {
  const result: Record<string, boolean | null> = {}
  mockCheckItems.forEach((item) => {
    result[item.id] = null
  })
  return result
}

const createEmptyPhotoItems = (): PhotoItem[] => {
  return mockPhotoItems.map((item) => ({ ...item, imageUrl: undefined }))
}

export const useVaccineStore = create<VaccineStore>((set, get) => ({
  checkItems: mockCheckItems,
  pendingRecord: null,
  shipmentInfo: null,
  tracePoints: [],
  acceptanceRecord: null,
  acceptanceHistory: mockAcceptanceHistory,

  scanWaybill: (waybillNo) => {
    if (!waybillNo || !waybillNo.trim()) {
      console.warn('[VaccineStore] scanWaybill: waybillNo is empty, ignored')
      return
    }

    const existingPending = get().pendingRecord
    if (existingPending && existingPending.waybillNo === waybillNo.trim()) {
      console.log('[VaccineStore] scanWaybill: continue existing pending record')
      return
    }

    console.log('[VaccineStore] scanWaybill creating new pending:', waybillNo)

    const pending: AcceptanceRecord = {
      id: `pending_${Date.now()}`,
      waybillNo: waybillNo.trim(),
      batchNo: mockShipmentInfo.batchNo,
      vaccineName: mockShipmentInfo.vaccineName,
      quantity: mockShipmentInfo.quantity,
      arrivalTime: mockShipmentInfo.actualArrival,
      receiverName: '',
      receiverDept: '',
      checkResults: [],
      photos: [],
      abnormalConclusion: '',
      status: 'pending',
      signTime: ''
    }

    set({
      pendingRecord: pending,
      shipmentInfo: { ...mockShipmentInfo, waybillNo: waybillNo.trim() },
      tracePoints: mockTracePoints,
      acceptanceRecord: null
    })
  },

  setCheckResult: (itemId, passed) => {
    set((state) => {
      if (!state.pendingRecord) return state

      const currentResults = state.pendingRecord.checkResults
      const existingIdx = currentResults.findIndex((r) => r.itemId === itemId)
      let newResults

      if (existingIdx >= 0) {
        newResults = [...currentResults]
        newResults[existingIdx] = { itemId, passed }
      } else {
        newResults = [...currentResults, { itemId, passed }]
      }

      return {
        pendingRecord: {
          ...state.pendingRecord,
          checkResults: newResults
        }
      }
    })
  },

  setPhotoUrl: (photoId, url) => {
    set((state) => {
      if (!state.pendingRecord) return state

      const photoLabel = mockPhotoItems.find((p) => p.id === photoId)?.label || photoId
      const currentPhotos = state.pendingRecord.photos
      const existingIdx = currentPhotos.findIndex((p) => p.label === photoLabel)
      let newPhotos

      if (existingIdx >= 0) {
        newPhotos = [...currentPhotos]
        if (url) {
          newPhotos[existingIdx] = { label: photoLabel, url }
        } else {
          newPhotos.splice(existingIdx, 1)
        }
      } else if (url) {
        newPhotos = [...currentPhotos, { label: photoLabel, url }]
      } else {
        newPhotos = currentPhotos
      }

      return {
        pendingRecord: {
          ...state.pendingRecord,
          photos: newPhotos
        }
      }
    })
  },

  submitAcceptance: (status, conclusion, receiverNameInput, receiverDeptInput) => {
    const state = get()
    const { pendingRecord, shipmentInfo } = state

    if (!pendingRecord || !shipmentInfo) {
      return { success: false, message: '请先扫描运单' }
    }

    const finalReceiverName = (receiverNameInput || '').trim()
    const finalReceiverDept = (receiverDeptInput || '').trim()

    if (!finalReceiverName) {
      return { success: false, message: '请填写签收人姓名' }
    }

    const photoItems = createEmptyPhotoItems()
    photoItems.forEach((item) => {
      const uploaded = pendingRecord.photos.find((p) => p.label === item.label)
      if (uploaded) {
        item.imageUrl = uploaded.url
      }
    })

    const requiredPhotoItems = photoItems.filter((item) => item.required)
    const allPhotosUploaded = requiredPhotoItems.every((item) => item.imageUrl)
    if (!allPhotosUploaded) {
      const missing = requiredPhotoItems.filter((item) => !item.imageUrl).map((item) => item.label)
      return { success: false, message: `请补齐照片：${missing.join('、')}` }
    }

    const checkResults = pendingRecord.checkResults
    const allRequiredChecked = mockCheckItems
      .filter((item) => item.required)
      .every((item) => checkResults.some((r) => r.itemId === item.id))

    if (!allRequiredChecked) {
      return { success: false, message: '请完成所有验收项的合格/不合格选择' }
    }

    if (status === 'passed') {
      const allPassed = mockCheckItems
        .filter((item) => item.required)
        .every((item) => {
          const result = checkResults.find((r) => r.itemId === item.id)
          return result?.passed === true
        })
      if (!allPassed) {
        return { success: false, message: '存在不合格项，无法签收合格，请选择验收不合格' }
      }
    }

    if (status === 'rejected' && !conclusion.trim()) {
      return { success: false, message: '请填写异常说明' }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const finalRecord: AcceptanceRecord = {
      id: `acc${Date.now()}`,
      waybillNo: shipmentInfo.waybillNo,
      batchNo: shipmentInfo.batchNo,
      vaccineName: shipmentInfo.vaccineName,
      quantity: shipmentInfo.quantity,
      arrivalTime: shipmentInfo.actualArrival,
      receiverName: finalReceiverName,
      receiverDept: finalReceiverDept || '预防接种门诊',
      checkResults: checkResults,
      photos: photoItems
        .filter((item) => item.imageUrl)
        .map((item) => ({ label: item.label, url: item.imageUrl! })),
      abnormalConclusion: conclusion.trim() || '验收合格，无异常情况。',
      status,
      signTime: now
    }

    set((s) => ({
      acceptanceRecord: finalRecord,
      acceptanceHistory: [finalRecord, ...s.acceptanceHistory],
      pendingRecord: null,
      shipmentInfo: null,
      tracePoints: []
    }))

    console.log('[VaccineStore] submitAcceptance success:', finalRecord.id, finalRecord.receiverName, finalRecord.receiverDept)
    return { success: true, message: '' }
  },

  resetAcceptance: () => {
    set({
      pendingRecord: null,
      shipmentInfo: null,
      tracePoints: [],
      acceptanceRecord: null
    })
  },

  getAcceptanceById: (id) => {
    return get().acceptanceHistory.find((item) => item.id === id)
  },

  getCheckItemLabels: () => {
    return mockCheckItems.map((item) => ({ id: item.id, label: item.label }))
  }
}))

export { createEmptyCheckResults, createEmptyPhotoItems }
