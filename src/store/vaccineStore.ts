import { create } from 'zustand'
import type {
  ShipmentInfo,
  VaccineBatch,
  TracePoint,
  CheckItem,
  PhotoItem,
  AcceptanceRecord,
  TraceSummary
} from '@/types/vaccine'
import {
  mockShipmentInfo,
  mockTracePoints,
  mockCheckItems,
  mockPhotoItems,
  mockAcceptanceHistory,
  mockVaccineBatches,
  mockTraceSummary
} from '@/data/mockVaccine'
import dayjs from 'dayjs'

export interface VaccineStore {
  checkItems: CheckItem[]
  photoTemplates: PhotoItem[]
  pendingRecord: AcceptanceRecord | null
  shipmentInfo: ShipmentInfo | null
  tracePoints: TracePoint[]
  traceSummary: TraceSummary | null
  vaccineBatches: VaccineBatch[]
  acceptanceRecord: AcceptanceRecord | null
  acceptanceHistory: AcceptanceRecord[]

  scanWaybill: (waybillNo: string) => void
  scanWaybillDirect: (waybillNo: string) => { success: boolean }
  setCheckResult: (itemId: string, passed: boolean) => void
  setBatchQuantity: (batchId: string, actualQty: number, passed: boolean | null, remark: string) => void
  setPhotoUrl: (photoId: string, url: string) => void
  addPhotoToRecord: (recordId: string, label: string, url: string) => void
  submitAcceptance: (
    status: 'passed' | 'rejected',
    conclusion: string,
    receiverName: string,
    receiverDept: string
  ) => { success: boolean; message: string }
  resetAcceptance: () => void
  getAcceptanceById: (id: string) => AcceptanceRecord | undefined
  getCheckItemLabels: () => { id: string; label: string }[]
  getFilteredHistory: (filters: {
    month?: string
    dept?: string
    status?: string
  }) => AcceptanceRecord[]
  getHistoryStats: (filters?: {
    month?: string
    dept?: string
    status?: string
  }) => {
    total: number
    totalQty: number
    rejectedCount: number
    rejectedQty: number
  }
  getAvailableDepts: () => string[]
  getAvailableMonths: () => string[]
}

export const useVaccineStore = create<VaccineStore>((set, get) => ({
  checkItems: mockCheckItems,
  photoTemplates: mockPhotoItems,
  pendingRecord: null,
  shipmentInfo: null,
  tracePoints: [],
  traceSummary: null,
  vaccineBatches: [],
  acceptanceRecord: null,
  acceptanceHistory: mockAcceptanceHistory,

  scanWaybill: (waybillNo) => {
    if (!waybillNo || !waybillNo.trim()) {
      return
    }
    const existingPending = get().pendingRecord
    if (existingPending && existingPending.waybillNo === waybillNo.trim()) {
      return
    }

    const pending: AcceptanceRecord = {
      id: `pending_${Date.now()}`,
      waybillNo: waybillNo.trim(),
      vaccineBatches: mockVaccineBatches.map((b) => ({ ...b })),
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
      traceSummary: mockTraceSummary,
      vaccineBatches: mockVaccineBatches.map((b) => ({ ...b })),
      acceptanceRecord: null
    })
  },

  scanWaybillDirect: (waybillNo) => {
    if (!waybillNo || !waybillNo.trim()) {
      return { success: false }
    }
    get().scanWaybill(waybillNo.trim())
    return { success: true }
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

  setBatchQuantity: (batchId, actualQty, passed, remark) => {
    set((state) => {
      if (!state.pendingRecord) return state

      const newBatches = state.pendingRecord.vaccineBatches.map((b) =>
        b.id === batchId
          ? {
              ...b,
              actualQuantity: actualQty,
              quantityPassed: passed,
              batchRemark: remark
            }
          : b
      )

      const newStateBatches = state.vaccineBatches.map((b) =>
        b.id === batchId
          ? {
              ...b,
              actualQuantity: actualQty,
              quantityPassed: passed,
              batchRemark: remark
            }
          : b
      )

      return {
        pendingRecord: {
          ...state.pendingRecord,
          vaccineBatches: newBatches
        },
        vaccineBatches: newStateBatches
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

  addPhotoToRecord: (recordId, label, url) => {
    set((state) => {
      const newHistory = state.acceptanceHistory.map((r) => {
        if (r.id !== recordId) return r
        const existing = r.photos.findIndex((p) => p.label === label)
        let newPhotos
        if (existing >= 0) {
          newPhotos = [...r.photos]
          newPhotos[existing] = { label, url }
        } else {
          newPhotos = [...r.photos, { label, url }]
        }
        return { ...r, photos: newPhotos }
      })
      return { acceptanceHistory: newHistory }
    })
  },

  submitAcceptance: (status, conclusion, receiverNameInput, receiverDeptInput) => {
    const state = get()
    const { pendingRecord, shipmentInfo, traceSummary } = state

    if (!pendingRecord || !shipmentInfo) {
      return { success: false, message: '请先扫描运单' }
    }

    const finalReceiverName = (receiverNameInput || '').trim()
    const finalReceiverDept = (receiverDeptInput || '').trim()

    if (!finalReceiverName) {
      return { success: false, message: '请填写签收人姓名' }
    }

    const photoTemplates = mockPhotoItems
    const requiredPhotoItems = photoTemplates.filter((item) => item.required)
    const currentPhotos = pendingRecord.photos
    const allPhotosUploaded = requiredPhotoItems.every((item) =>
      currentPhotos.some((p) => p.label === item.label && p.url)
    )
    if (!allPhotosUploaded) {
      const missing = requiredPhotoItems
        .filter((item) => !currentPhotos.some((p) => p.label === item.label))
        .map((item) => item.label)
      return { success: false, message: `请补齐照片：${missing.join('、')}` }
    }

    const checkResults = pendingRecord.checkResults
    const checkItems = mockCheckItems
    const allRequiredChecked = checkItems
      .filter((item) => item.required)
      .every((item) => checkResults.some((r) => r.itemId === item.id))

    if (!allRequiredChecked) {
      return { success: false, message: '请完成外包装、温度计等所有验收项的选择' }
    }

    const batches = pendingRecord.vaccineBatches
    const allBatchesChecked = batches.every((b) => b.quantityPassed !== null && b.quantityPassed !== undefined)
    if (!allBatchesChecked) {
      return { success: false, message: '请完成每种疫苗的数量验收' }
    }

    if (status === 'passed') {
      const allPassed = checkItems
        .filter((item) => item.required)
        .every((item) => {
          const result = checkResults.find((r) => r.itemId === item.id)
          return result?.passed === true
        })
      if (!allPassed) {
          return { success: false, message: '存在不合格项，无法签收合格，请选择验收不合格' }
        }
      const allBatchesPassed = batches.every((b) => b.quantityPassed === true)
      if (!allBatchesPassed) {
        return { success: false, message: '有疫苗数量不合格，无法签收合格，请选择验收不合格' }
      }
    }

    if (status === 'rejected' && !conclusion.trim()) {
      return { success: false, message: '请填写异常说明' }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const finalRecord: AcceptanceRecord = {
      id: `acc${Date.now()}`,
      waybillNo: shipmentInfo.waybillNo,
      vaccineBatches: batches.map((b) => ({ ...b })),
      arrivalTime: shipmentInfo.actualArrival,
      receiverName: finalReceiverName,
      receiverDept: finalReceiverDept || '预防接种门诊',
      checkResults: checkResults,
      photos: currentPhotos.filter((p) => p.url),
      abnormalConclusion: conclusion.trim() || '验收合格，无异常情况。',
      status,
      signTime: now,
      traceSummary: traceSummary || undefined
    }

    set((s) => ({
      acceptanceRecord: finalRecord,
      acceptanceHistory: [finalRecord, ...s.acceptanceHistory],
      pendingRecord: null,
      shipmentInfo: null,
      tracePoints: [],
      traceSummary: null,
      vaccineBatches: []
    }))

    return { success: true, message: '' }
  },

  resetAcceptance: () => {
    set({
      pendingRecord: null,
      shipmentInfo: null,
      tracePoints: [],
      traceSummary: null,
      vaccineBatches: [],
      acceptanceRecord: null
    })
  },

  getAcceptanceById: (id) => {
    return get().acceptanceHistory.find((item) => item.id === id)
  },

  getCheckItemLabels: () => {
    return mockCheckItems.map((item) => ({ id: item.id, label: item.label }))
  },

  getFilteredHistory: (filters) => {
    const { acceptanceHistory } = get()
    let result = [...acceptanceHistory]

    if (filters.month && filters.month !== 'all') {
      result = result.filter((r) =>
        dayjs(r.signTime).format('YYYY-MM') === filters.month
      )
    }
    if (filters.dept && filters.dept !== 'all') {
      result = result.filter((r) => (r.receiverDept || '预防接种门诊') === filters.dept)
    }
    if (filters.status && filters.status !== 'all') {
      result = result.filter((r) => r.status === filters.status)
    }

    return result
  },

  getHistoryStats: (filters) => {
    const records = get().getFilteredHistory(filters || {})
    const total = records.length
    let totalQty = 0
    let rejectedCount = 0
    let rejectedQty = 0

    records.forEach((r) => {
      const batchQty = r.vaccineBatches.reduce((sum, b) => sum + (b.actualQuantity || b.expectedQuantity), 0)
      totalQty += batchQty
      if (r.status === 'rejected') {
        rejectedCount += 1
        rejectedQty += batchQty
      }
    })

    return { total, totalQty, rejectedCount, rejectedQty }
  },

  getAvailableDepts: () => {
    const { acceptanceHistory } = get()
    const depts = new Set<string>()
    acceptanceHistory.forEach((r) => {
      depts.add(r.receiverDept || '预防接种门诊')
    })
    return Array.from(depts)
  },

  getAvailableMonths: () => {
    const { acceptanceHistory } = get()
    const months = new Set<string>()
    acceptanceHistory.forEach((r) => {
      if (r.signTime) {
        months.add(dayjs(r.signTime).format('YYYY-MM'))
      }
    })
    return Array.from(months).sort().reverse()
  }
}))
