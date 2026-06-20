import { create } from 'zustand'
import type {
  ShipmentInfo,
  VaccineBatch,
  TracePoint,
  CheckItem,
  PhotoItem,
  AcceptanceRecord,
  TraceSummary,
  Handover,
  RejectTracking
} from '@/types/vaccine'
import {
  mockShipmentInfo,
  mockTracePoints,
  mockCheckItems,
  mockPhotoItems,
  mockAcceptanceHistory,
  mockVaccineBatches,
  mockTraceSummary,
  mockHandovers,
  mockRejectTrackings
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
  handovers: Handover[]
  rejectTrackings: RejectTracking[]

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
    handoverStatus?: string
    rejectStatus?: string
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

  createHandover: (
    recordIds: string[],
    dept: string,
    month: string,
    creatorName: string
  ) => Handover | null
  getHandoverById: (id: string) => Handover | undefined
  getHandoversByDept: (dept?: string) => Handover[]
  confirmHandover: (
    handoverId: string,
    confirmerName: string
  ) => { success: boolean; message: string }
  getRejectTrackingById: (id: string) => RejectTracking | undefined
  getRejectTrackingByAcceptanceId: (acceptanceId: string) => RejectTracking | undefined
  updateRejectTracking: (
    acceptanceId: string,
    data: Partial<Omit<RejectTracking, 'id' | 'acceptanceId'>>,
    reviewerName: string
  ) => { success: boolean; message: string }
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
  handovers: mockHandovers,
  rejectTrackings: mockRejectTrackings,

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
  },

  getFilteredHistory: (filters) => {
    const { acceptanceHistory, handovers, rejectTrackings } = get()
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
    if (filters.handoverStatus && filters.handoverStatus !== 'all') {
      const handoverMap = new Map(handovers.map((h) => [h.id, h]))
      result = result.filter((r) => {
        const h = r.handoverId ? handoverMap.get(r.handoverId) : undefined
        if (filters.handoverStatus === 'done') return !!h && h.confirmStatus === 'confirmed'
        if (filters.handoverStatus === 'pending') return !!h && h.confirmStatus === 'pending'
        if (filters.handoverStatus === 'none') return !h
        return true
      })
    }
    if (filters.rejectStatus && filters.rejectStatus !== 'all') {
      const rejectMap = new Map(rejectTrackings.map((rt) => [rt.acceptanceId, rt]))
      result = result.filter((r) => {
        if (r.status !== 'rejected') return false
        const rt = rejectMap.get(r.id)
        if (filters.rejectStatus === 'closed') return !!rt && rt.reviewResult === 'closed'
        if (filters.rejectStatus === 'processing') return !!rt && rt.reviewResult === 'processing'
        if (filters.rejectStatus === 'pending') return !rt || rt.reviewResult === 'pending'
        return true
      })
    }

    return result
  },

  createHandover: (recordIds, dept, month, creatorName) => {
    if (!recordIds || recordIds.length === 0) return null
    const history = get().acceptanceHistory
    const records = recordIds.map((id) => history.find((r) => r.id === id)).filter(Boolean) as AcceptanceRecord[]
    if (records.length === 0) return null

    let passedCount = 0
    let rejectedCount = 0
    let totalQty = 0
    let rejectedQty = 0
    records.forEach((r) => {
      const qty = r.vaccineBatches.reduce((sum, b) => sum + (b.actualQuantity || b.expectedQuantity), 0)
      totalQty += qty
      if (r.status === 'passed') passedCount += 1
      else { rejectedCount += 1; rejectedQty += qty }
    })

    const newHandover: Handover = {
      id: `hd${Date.now()}`,
      title: `${month}年${dept}交接清单`,
      dept,
      month,
      recordIds: [...recordIds],
      passedCount,
      rejectedCount,
      totalQty,
      rejectedQty,
      createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      creatorName: creatorName || '系统',
      confirmStatus: 'pending'
    }

    set((state) => ({
      handovers: [newHandover, ...state.handovers],
      acceptanceHistory: state.acceptanceHistory.map((r) =>
        recordIds.includes(r.id) ? { ...r, handoverId: newHandover.id } : r
      )
    }))

    return newHandover
  },

  getHandoverById: (id) => {
    return get().handovers.find((h) => h.id === id)
  },

  getHandoversByDept: (dept) => {
    const list = [...get().handovers]
    if (dept && dept !== 'all') return list.filter((h) => h.dept === dept)
    return list.sort((a, b) => (a.createTime < b.createTime ? 1 : -1))
  },

  confirmHandover: (handoverId, confirmerName) => {
    if (!confirmerName || !confirmerName.trim()) {
      return { success: false, message: '请填写科室负责人姓名' }
    }
    const handover = get().getHandoverById(handoverId)
    if (!handover) return { success: false, message: '交接单不存在' }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    set((state) => ({
      handovers: state.handovers.map((h) =>
        h.id === handoverId
          ? { ...h, confirmStatus: 'confirmed', confirmerName: confirmerName.trim(), confirmTime: now }
          : h
      )
    }))
    return { success: true, message: '' }
  },

  getRejectTrackingById: (id) => {
    return get().rejectTrackings.find((rt) => rt.id === id)
  },

  getRejectTrackingByAcceptanceId: (acceptanceId) => {
    return get().rejectTrackings.find((rt) => rt.acceptanceId === acceptanceId)
  },

  updateRejectTracking: (acceptanceId, data, reviewerName) => {
    if (!reviewerName || !reviewerName.trim()) {
      return { success: false, message: '请填写复核人姓名' }
    }
    const existing = get().getRejectTrackingByAcceptanceId(acceptanceId)
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    if (existing) {
      set((state) => ({
        rejectTrackings: state.rejectTrackings.map((rt) =>
          rt.id === existing.id
            ? { ...rt, ...data, reviewTime: now, reviewerName: reviewerName.trim() }
            : rt
        )
      }))
    } else {
      const newTracking: RejectTracking = {
        id: `rt${Date.now()}`,
        acceptanceId,
        carrierRemark: data.carrierRemark || '',
        replenishQty: data.replenishQty || 0,
        reviewResult: data.reviewResult || 'pending',
        reviewRemark: data.reviewRemark || '',
        reviewTime: now,
        reviewerName: reviewerName.trim()
      }
      set((state) => ({
        rejectTrackings: [newTracking, ...state.rejectTrackings],
        acceptanceHistory: state.acceptanceHistory.map((r) =>
          r.id === acceptanceId ? { ...r, rejectTrackingId: newTracking.id } : r
        )
      }))
    }
    return { success: true, message: '' }
  }
}))
