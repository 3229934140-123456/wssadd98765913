import React, { useState, useMemo } from 'react'
import { View, Text, Input, Textarea, Image, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useVaccineStore } from '@/store/vaccineStore'
import CheckItem from '@/components/CheckItem'
import PhotoUpload from '@/components/PhotoUpload'
import AcceptanceCard from '@/components/AcceptanceCard'
import { mockPhotoItems } from '@/data/mockVaccine'
import type { Handover, AcceptanceRecord, RejectTracking } from '@/types/vaccine'
import styles from './index.module.scss'

type ReceiptTab = 'records' | 'handovers'

const ReceiptPage: React.FC = () => {
  const {
    pendingRecord,
    shipmentInfo,
    checkItems,
    acceptanceRecord,
    setCheckResult,
    setBatchQuantity,
    setPhotoUrl,
    submitAcceptance,
    resetAcceptance,
    getCheckItemLabels,
    getFilteredHistory,
    getHistoryStats,
    getAvailableDepts,
    getAvailableMonths,
    scanWaybillDirect,
    addPhotoToRecord,
    getAcceptanceById,
    createHandover,
    getHandoversByDept,
    getHandoverById,
    confirmHandover,
    getRejectTrackingByAcceptanceId
  } = useVaccineStore()

  const [activeTab, setActiveTab] = useState<ReceiptTab>('records')
  const [receiverName, setReceiverName] = useState('')
  const [receiverDept, setReceiverDept] = useState('预防接种门诊')
  const [conclusion, setConclusion] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [detailRecord, setDetailRecord] = useState<AcceptanceRecord | null>(null)
  const [detailTrackingRefresh, setDetailTrackingRefresh] = useState(0)

  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterHandover, setFilterHandover] = useState<string>('all')
  const [filterReject, setFilterReject] = useState<string>('all')
  const [monthIndex, setMonthIndex] = useState(0)
  const [deptIndex, setDeptIndex] = useState(0)
  const [statusIndex, setStatusIndex] = useState(0)
  const [handoverIndex, setHandoverIndex] = useState(0)
  const [rejectIndex, setRejectIndex] = useState(0)

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showHandoverCreate, setShowHandoverCreate] = useState(false)
  const [creatorName, setCreatorName] = useState('')
  const [createdHandover, setCreatedHandover] = useState<Handover | null>(null)

  const [showHandoverDetail, setShowHandoverDetail] = useState<Handover | null>(null)
  const [handoverDetailIdx, setHandoverDetailIdx] = useState(0)
  const [confirmerName, setConfirmerName] = useState('')
  const [handoverFilterDept, setHandoverFilterDept] = useState('all')
  const [handoverDeptIdx, setHandoverDeptIdx] = useState(0)

  const availableMonths = useMemo(() => getAvailableMonths(), [getAvailableMonths])
  const availableDepts = useMemo(() => getAvailableDepts(), [getAvailableDepts])
  const monthOptions = ['全部月份', ...availableMonths]
  const deptOptions = ['全部科室', ...availableDepts]
  const statusOptions = ['全部结果', '验收合格', '验收不合格']
  const statusValues = ['all', 'passed', 'rejected']
  const handoverOptions = ['全部交接', '已交接', '待确认', '未交接']
  const handoverValues = ['all', 'done', 'pending', 'none']
  const rejectOptions = ['全部处理状态', '已闭环', '处理中', '待处理']
  const rejectValues = ['all', 'closed', 'processing', 'pending']

  const checkItemLabels = getCheckItemLabels()

  const filteredHistory = useMemo(() => {
    const res = getFilteredHistory({
      month: filterMonth,
      dept: filterDept,
      status: filterStatus,
      handoverStatus: filterHandover,
      rejectStatus: filterReject
    })
    return res
  }, [getFilteredHistory, filterMonth, filterDept, filterStatus, filterHandover, filterReject, detailTrackingRefresh])

  const stats = useMemo(() => {
    return getHistoryStats({
      month: filterMonth,
      dept: filterDept,
      status: filterStatus
    })
  }, [getHistoryStats, filterMonth, filterDept, filterStatus])

  const filteredHandovers = useMemo(() => getHandoversByDept(handoverFilterDept), [getHandoversByDept, handoverFilterDept])

  const photoItemsWithState = useMemo(() => {
    if (!pendingRecord) {
      return mockPhotoItems.map((item) => ({ ...item, imageUrl: undefined }))
    }
    return mockPhotoItems.map((item) => {
      const uploaded = pendingRecord.photos.find((p) => p.label === item.label)
      return { ...item, imageUrl: uploaded?.url }
    })
  }, [pendingRecord])

  const checkResultsMap = useMemo(() => {
    if (!pendingRecord) return {}
    const map: Record<string, boolean | null> = {}
    checkItems.forEach((item) => {
      const result = pendingRecord.checkResults.find((r) => r.itemId === item.id)
      map[item.id] = result ? result.passed : null
    })
    return map
  }, [pendingRecord, checkItems])

  const hasPending = !!pendingRecord && !!shipmentInfo

  const allChecksTouched = useMemo(() => {
    return checkItems
      .filter((item) => item.required)
      .every((item) => checkResultsMap[item.id] !== null && checkResultsMap[item.id] !== undefined)
  }, [checkItems, checkResultsMap])

  const allChecksPassed = useMemo(() => {
    return checkItems
      .filter((item) => item.required)
      .every((item) => checkResultsMap[item.id] === true)
  }, [checkItems, checkResultsMap])

  const currentHandoverRecord = useMemo(() => {
    if (!showHandoverDetail) return null
    const id = showHandoverDetail.recordIds[handoverDetailIdx]
    return getAcceptanceById(id) || null
  }, [showHandoverDetail, handoverDetailIdx, getAcceptanceById])

  const handleMonthChange = (e: any) => {
    const idx = Number(e.detail.value)
    setMonthIndex(idx)
    setFilterMonth(idx === 0 ? 'all' : availableMonths[idx - 1])
  }

  const handleDeptChange = (e: any) => {
    const idx = Number(e.detail.value)
    setDeptIndex(idx)
    setFilterDept(idx === 0 ? 'all' : availableDepts[idx - 1])
  }

  const handleStatusChange = (e: any) => {
    const idx = Number(e.detail.value)
    setStatusIndex(idx)
    setFilterStatus(statusValues[idx])
  }

  const handleHandoverFilterChange = (e: any) => {
    const idx = Number(e.detail.value)
    setHandoverIndex(idx)
    setFilterHandover(handoverValues[idx])
  }

  const handleRejectFilterChange = (e: any) => {
    const idx = Number(e.detail.value)
    setRejectIndex(idx)
    setFilterReject(rejectValues[idx])
  }

  const handleScan = async () => {
    try {
      const res = await Taro.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode', 'barCode']
      })
      if (res.result && res.result.trim()) {
        const result = scanWaybillDirect(res.result.trim())
        if (result.success) {
          console.log('[ReceiptPage] 扫码已直接衔接运单')
        }
      }
    } catch (err) {
      console.log('[ReceiptPage] scan cancelled')
    }
  }

  const handleCheckChange = (itemId: string, value: boolean) => {
    setCheckResult(itemId, value)
  }

  const handlePhotoUpload = (photoId: string, url: string) => {
    setPhotoUrl(photoId, url)
  }

  const handlePhotoRemove = (photoId: string) => {
    setPhotoUrl(photoId, '')
  }

  const handleBatchQtyChange = (batchId: string, actualQty: number, passed: boolean | null, remark: string) => {
    setBatchQuantity(batchId, actualQty, passed, remark)
  }

  const handleBatchInputChange = (batchId: string, value: string) => {
    const batch = pendingRecord?.vaccineBatches.find((b) => b.id === batchId)
    if (!batch) return
    const num = parseInt(value) || 0
    const passed = isNaN(parseInt(value)) ? null : num === batch.expectedQuantity
    setBatchQuantity(batchId, num, passed, batch.batchRemark || '')
  }

  const handleBatchRemarkChange = (batchId: string, value: string) => {
    const batch = pendingRecord?.vaccineBatches.find((b) => b.id === batchId)
    if (!batch) return
    setBatchQuantity(batchId, batch.actualQuantity || 0, batch.quantityPassed ?? null, value)
  }

  const handleBatchPassedClick = (batchId: string, passed: boolean) => {
    const batch = pendingRecord?.vaccineBatches.find((b) => b.id === batchId)
    if (!batch) return
    setBatchQuantity(batchId, batch.actualQuantity || batch.expectedQuantity, passed, batch.batchRemark || '')
  }

  const handleSubmit = (status: 'passed' | 'rejected') => {
    if (!hasPending) {
      Taro.showToast({ title: '请先扫描运单', icon: 'none' })
      return
    }

    let finalConclusion = conclusion.trim()
    if (status === 'passed' && !finalConclusion && shipmentInfo) {
      const abnormalCount = shipmentInfo.hasDoorOpen ? shipmentInfo.doorOpenCount : 0
      if (abnormalCount > 0) {
        finalConclusion = `运输过程中有${abnormalCount}次开门记录，均为正常作业操作，温度全程在${shipmentInfo.temperatureStandard}标准范围内，验收合格。`
      } else {
        finalConclusion = `运输全程温度正常（${shipmentInfo.temperatureMin}~${shipmentInfo.temperatureMax}℃），无异常开门记录，验收合格。`
      }
    }

    const result = submitAcceptance(status, finalConclusion, receiverName, receiverDept)
    if (result.success) {
      setShowSuccess(true)
      console.log('[ReceiptPage] 验收提交成功')
    } else {
      Taro.showToast({ title: result.message || '提交失败，请重试', icon: 'none', duration: 2500 })
    }
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false)
    setReceiverName('')
    setReceiverDept('预防接种门诊')
    setConclusion('')
    resetAcceptance()
  }

  const handleViewDetail = (record: any) => {
    const fullRecord = getAcceptanceById(record.id) || record
    setDetailRecord(fullRecord)
  }

  const handleCloseDetail = () => {
    setDetailRecord(null)
    setDetailTrackingRefresh((x) => x + 1)
  }

  const handleMakeupPhoto = async (recordId: string, label: string) => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album']
      })
      if (res.tempFilePaths && res.tempFilePaths[0]) {
        addPhotoToRecord(recordId, label, res.tempFilePaths[0])
        const updated = getAcceptanceById(recordId)
        if (updated) setDetailRecord({ ...updated })
        Taro.showToast({ title: '照片补录成功', icon: 'success' })
      }
    } catch (err) {
      console.log('[ReceiptPage] makeup photo cancelled')
    }
  }

  const computeTotalQty = (record: any) => {
    if (!record?.vaccineBatches) return 0
    return record.vaccineBatches.reduce(
      (sum: number, b: any) => sum + (b.actualQuantity || b.expectedQuantity || 0), 0
    )
  }

  const computeFirstBatch = (record: any) => {
    if (!record?.vaccineBatches || record.vaccineBatches.length === 0) return { name: '-', batchNo: '-' }
    const first = record.vaccineBatches[0]
    return { name: first.vaccineName, batchNo: first.batchNo }
  }

  const getHandoverTag = (record: AcceptanceRecord) => {
    if (!record.handoverId) return { text: '未交接', cls: styles.tagNone }
    const h = getHandoverById(record.handoverId)
    if (!h) return { text: '未交接', cls: styles.tagNone }
    if (h.confirmStatus === 'confirmed') return { text: `已交接（${h.confirmerName}）`, cls: styles.tagDone }
    return { text: '待负责人确认', cls: styles.tagPending }
  }

  const getRejectTag = (record: AcceptanceRecord) => {
    if (record.status !== 'rejected') return null
    const t = getRejectTrackingByAcceptanceId(record.id)
    if (!t || t.reviewResult === 'pending') return { text: '待处理', cls: styles.rejPending }
    if (t.reviewResult === 'processing') return { text: '处理中', cls: styles.rejProcessing }
    return { text: '已闭环', cls: styles.rejClosed }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredHistory.length) setSelectedIds([])
    else setSelectedIds(filteredHistory.map((r) => r.id))
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds([])
  }

  const handleOpenHandoverCreate = () => {
    if (selectedIds.length === 0) {
      Taro.showToast({ title: '请先勾选记录', icon: 'none' })
      return
    }
    const records = selectedIds.map((id) => getAcceptanceById(id)).filter(Boolean) as AcceptanceRecord[]
    const deptSet = new Set(records.map((r) => r.receiverDept || '预防接种门诊'))
    if (deptSet.size > 1) {
      Taro.showToast({ title: '请勾选同一科室的记录', icon: 'none' })
      return
    }
    const monthSet = new Set(records.map((r) => (r.signTime || '').slice(0, 7)))
    if (monthSet.size > 1) {
      Taro.showToast({ title: '请勾选同一月份的记录', icon: 'none' })
      return
    }
    setShowHandoverCreate(true)
  }

  const handleCreateHandover = () => {
    if (!creatorName.trim()) {
      Taro.showToast({ title: '请填写制表人姓名', icon: 'none' })
      return
    }
    const records = selectedIds.map((id) => getAcceptanceById(id)).filter(Boolean) as AcceptanceRecord[]
    const dept = records[0]?.receiverDept || '预防接种门诊'
    const month = (records[0]?.signTime || '').slice(0, 7)
    const h = createHandover(selectedIds, dept, month, creatorName.trim())
    if (h) {
      setCreatedHandover(h)
      setShowHandoverCreate(false)
      setSelectMode(false)
      setSelectedIds([])
      setCreatorName('')
      setTimeout(() => {
        setActiveTab('handovers')
        Taro.showToast({ title: '交接清单已生成', icon: 'success' })
        setTimeout(() => {
          if (h) setShowHandoverDetail(h)
          setCreatedHandover(null)
        }, 800)
      }, 400)
    } else {
      Taro.showToast({ title: '生成失败', icon: 'none' })
    }
  }

  const handleViewHandover = (h: Handover) => {
    setShowHandoverDetail(h)
    setHandoverDetailIdx(0)
    setConfirmerName('')
  }

  const handleConfirmHandover = () => {
    if (!showHandoverDetail) return
    const res = confirmHandover(showHandoverDetail.id, confirmerName)
    if (res.success) {
      const h = getHandoverById(showHandoverDetail.id)
      if (h) setShowHandoverDetail(h)
      Taro.showToast({ title: '交接已确认', icon: 'success' })
    } else {
      Taro.showToast({ title: res.message, icon: 'none' })
    }
  }

  const rejectedOnly = filterStatus === 'rejected' || filterReject !== 'all'

  return (
    <View className={styles.page}>
      {hasPending ? (
        <>
          <View className={styles.shipmentSummary}>
            <View className={styles.summaryInfo}>
              <View className={styles.summaryName}>
                {shipmentInfo?.destinationClinic || '待验收运单'}
              </View>
              <View className={styles.summaryNo}>
                运单：{shipmentInfo?.waybillNo} · 到货：{(shipmentInfo?.actualArrival || '').slice(5, 16)}
              </View>
            </View>
            <View className={styles.summaryBtn} onClick={handleScan}>重新扫码</View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>💉</Text>疫苗批号验收
            </View>
            <View className={styles.sectionDesc}>
              本运单共 {pendingRecord?.vaccineBatches?.length || 0} 种疫苗，请逐批核对数量
            </View>
            <View className={styles.batchList}>
              {pendingRecord?.vaccineBatches?.map((batch) => {
                const passed = batch.quantityPassed
                const diff = (batch.actualQuantity || 0) - batch.expectedQuantity
                return (
                  <View key={batch.id} className={styles.batchCard}>
                    <View className={styles.batchHeader}>
                      <View className={styles.batchName}>{batch.vaccineName}</View>
                      <View className={classnames(styles.batchStatus, {
                        [styles.batchStatusPassed]: passed === true,
                        [styles.batchStatusFailed]: passed === false,
                        [styles.batchStatusPending]: passed === null || passed === undefined
                      })}>
                        {passed === true ? '数量一致' : passed === false ? '数量异常' : '待核对'}
                      </View>
                    </View>
                    <View className={styles.batchInfoRow}>
                      <Text className={styles.batchLabel}>批号</Text>
                      <Text className={styles.batchValue}>{batch.batchNo}</Text>
                      <Text className={styles.batchLabel} style={{ marginLeft: 24 }}>规格</Text>
                      <Text className={styles.batchValue}>{batch.spec}</Text>
                    </View>
                    <View className={styles.batchInfoRow}>
                      <Text className={styles.batchLabel}>类别</Text>
                      <Text className={styles.batchValue}>{batch.vaccineType}</Text>
                      <Text className={styles.batchLabel} style={{ marginLeft: 24 }}>应到</Text>
                      <Text className={styles.batchValue}>{batch.expectedQuantity}支</Text>
                    </View>
                    <View className={styles.batchQtyRow}>
                      <Text className={styles.batchLabel}>实到数量*</Text>
                      <Input className={styles.qtyInput} type='number'
                        value={batch.actualQuantity?.toString() || ''}
                        placeholder='请输入实到数量'
                        onInput={(e) => handleBatchInputChange(batch.id, e.detail.value)} />
                      <Text className={styles.qtyUnit}>支</Text>
                      {diff !== 0 && (batch.actualQuantity !== undefined) && (
                        <Text className={classnames(styles.qtyDiff, {
                          [styles.diffWarn]: diff < 0, [styles.diffOver]: diff > 0
                        })}>{diff > 0 ? `多${diff}` : `少${Math.abs(diff)}`}</Text>
                      )}
                    </View>
                    <View className={styles.batchCheckRow}>
                      <View className={classnames(styles.batchCheckBtn, { [styles.checkBtnActive]: passed === true })}
                        onClick={() => handleBatchPassedClick(batch.id, true)}>✓ 数量一致</View>
                      <View className={classnames(styles.batchCheckBtn, styles.checkBtnReject, { [styles.checkBtnActive]: passed === false })}
                        onClick={() => handleBatchPassedClick(batch.id, false)}>✕ 数量异常</View>
                    </View>
                    <View className={styles.batchRemarkRow}>
                      <Text className={styles.batchLabel}>异常说明</Text>
                      <Textarea className={styles.remarkTextarea}
                        placeholder='如有数量差异或其他异常，请在此说明（选填）'
                        value={batch.batchRemark || ''}
                        onInput={(e) => handleBatchRemarkChange(batch.id, e.detail.value)} maxlength={200} />
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>✅</Text>验收项目
            </View>
            <View className={styles.checkList}>
              {checkItems.map((item) => (
                <CheckItem key={item.id} label={item.label} description={item.description}
                  required={item.required} value={checkResultsMap[item.id] ?? null}
                  onChange={(value) => handleCheckChange(item.id, value)} />
              ))}
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📷</Text>拍照留证
            </View>
            <PhotoUpload photos={photoItemsWithState} onUpload={handlePhotoUpload} onRemove={handlePhotoRemove} />
          </View>

          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>👤</Text>签收人信息
            </View>
            <View className={styles.inputGroup}>
              <View className={styles.inputRow}>
                <Text className={styles.inputLabel}>签收人*</Text>
                <Input className={styles.inputField} placeholder='请输入签收人姓名'
                  value={receiverName} onInput={(e) => setReceiverName(e.detail.value)} />
              </View>
              <View className={styles.inputRow}>
                <Text className={styles.inputLabel}>部门</Text>
                <Input className={styles.inputField} placeholder='默认为预防接种门诊'
                  value={receiverDept} onInput={(e) => setReceiverDept(e.detail.value)} />
              </View>
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📝</Text>验收结论
            </View>
            <Textarea className={styles.conclusionTextarea}
              placeholder={allChecksPassed ? '请填写验收结论（选填）...' : '请填写异常情况说明（必填）...'}
              value={conclusion} onInput={(e) => setConclusion(e.detail.value)} maxlength={500} />
          </View>

          <View className={styles.actionBar}>
            <View className={styles.btnReject} onClick={() => handleSubmit('rejected')}>验收不合格</View>
            <View className={styles.btnPrimary} onClick={() => handleSubmit('passed')}>确认签收</View>
          </View>
        </>
      ) : (
        <>
          <View className={styles.tabBar}>
            <View className={classnames(styles.tabItem, { [styles.tabActive]: activeTab === 'records' })}
              onClick={() => setActiveTab('records')}>
              📋 验收记录
            </View>
            <View className={classnames(styles.tabItem, { [styles.tabActive]: activeTab === 'handovers' })}
              onClick={() => setActiveTab('handovers')}>
              📑 交接清单
            </View>
          </View>

          {activeTab === 'records' ? (
            <>
              <View className={styles.filterSection}>
                <View className={styles.filterTitle}>
                  <Text className={styles.filterIcon}>🔍</Text>查档筛选
                </View>
                <View className={styles.filterRow}>
                  <View className={styles.filterItem}>
                    <Text className={styles.filterLabel}>月份</Text>
                    <Picker mode='selector' range={monthOptions} value={monthIndex} onChange={handleMonthChange}>
                      <View className={styles.filterPicker}>
                        {monthOptions[monthIndex]}<Text className={styles.pickerArrow}>▾</Text>
                      </View>
                    </Picker>
                  </View>
                  <View className={styles.filterItem}>
                    <Text className={styles.filterLabel}>科室</Text>
                    <Picker mode='selector' range={deptOptions} value={deptIndex} onChange={handleDeptChange}>
                      <View className={styles.filterPicker}>
                        {deptOptions[deptIndex]}<Text className={styles.pickerArrow}>▾</Text>
                      </View>
                    </Picker>
                  </View>
                </View>
                <View className={styles.filterRow}>
                  <View className={styles.filterItem}>
                    <Text className={styles.filterLabel}>验收结果</Text>
                    <Picker mode='selector' range={statusOptions} value={statusIndex} onChange={handleStatusChange}>
                      <View className={styles.filterPicker}>
                        {statusOptions[statusIndex]}<Text className={styles.pickerArrow}>▾</Text>
                      </View>
                    </Picker>
                  </View>
                  <View className={styles.filterItem}>
                    <Text className={styles.filterLabel}>交接状态</Text>
                    <Picker mode='selector' range={handoverOptions} value={handoverIndex} onChange={handleHandoverFilterChange}>
                      <View className={styles.filterPicker}>
                        {handoverOptions[handoverIndex]}<Text className={styles.pickerArrow}>▾</Text>
                      </View>
                    </Picker>
                  </View>
                </View>
                {rejectedOnly && (
                  <View className={styles.filterRow}>
                    <View className={styles.filterItem} style={{ flex: 1 }}>
                      <Text className={styles.filterLabel}>不合格处理状态</Text>
                      <Picker mode='selector' range={rejectOptions} value={rejectIndex} onChange={handleRejectFilterChange}>
                        <View className={styles.filterPicker}>
                          {rejectOptions[rejectIndex]}<Text className={styles.pickerArrow}>▾</Text>
                        </View>
                      </Picker>
                    </View>
                  </View>
                )}
              </View>

              <View className={styles.statsSection}>
                <View className={styles.statsTitle}>
                  <Text className={styles.statsIcon}>📊</Text>筛选统计
                </View>
                <View className={styles.statsGrid}>
                  <View className={styles.statsCard}>
                    <View className={styles.statsNum}>{stats.total}</View>
                    <View className={styles.statsUnit}>单</View>
                    <View className={styles.statsLabel}>运单总数</View>
                  </View>
                  <View className={styles.statsCard}>
                    <View className={styles.statsNum}>{stats.totalQty}</View>
                    <View className={styles.statsUnit}>支</View>
                    <View className={styles.statsLabel}>合计数量</View>
                  </View>
                  <View className={classnames(styles.statsCard, styles.statsCardRejected)}>
                    <View className={styles.statsNum}>{stats.rejectedCount}</View>
                    <View className={styles.statsUnit}>单</View>
                    <View className={styles.statsLabel}>不合格单</View>
                  </View>
                  <View className={classnames(styles.statsCard, styles.statsCardRejected)}>
                    <View className={styles.statsNum}>{stats.rejectedQty}</View>
                    <View className={styles.statsUnit}>支</View>
                    <View className={styles.statsLabel}>不合格数</View>
                  </View>
                </View>
              </View>

              <View className={styles.listSection}>
                <View className={styles.listToolbar}>
                  <Text className={styles.listTitle}>
                    记录列表<Text className={styles.listCount}>({filteredHistory.length})</Text>
                  </Text>
                  {selectMode ? (
                    <View className={styles.selectTools}>
                      <Text className={styles.selectLink} onClick={toggleSelectAll}>
                        {selectedIds.length === filteredHistory.length ? '取消全选' : '全选'}
                      </Text>
                      <Text className={styles.selectLink} onClick={exitSelectMode}>退出</Text>
                    </View>
                  ) : (
                    <Text className={styles.selectLink} onClick={() => setSelectMode(true)}>批量交接</Text>
                  )}
                </View>

                {selectMode && (
                  <View className={styles.selectHint}>
                    已选 {selectedIds.length} 张，点击条目左侧勾选/取消
                  </View>
                )}

                {filteredHistory.length > 0 ? (
                  filteredHistory.map((record) => {
                    const first = computeFirstBatch(record)
                    const total = computeTotalQty(record)
                    const hTag = getHandoverTag(record)
                    const rTag = getRejectTag(record)
                    const checked = selectedIds.includes(record.id)
                    return (
                      <View key={record.id} className={styles.historyItem}
                        onClick={() => selectMode ? toggleSelect(record.id) : handleViewDetail(record)}>
                        {selectMode && (
                          <View className={classnames(styles.checkBox, { [styles.checkBoxActive]: checked })}>
                            {checked && <Text className={styles.checkMark}>✓</Text>}
                          </View>
                        )}
                        <View className={styles.historyContent}>
                          <View className={styles.historyHeader}>
                            <Text className={styles.historyName} numberOfLines={1}>
                              {first.name}
                              {record.vaccineBatches?.length > 1 && ` 等${record.vaccineBatches.length}种`}
                            </Text>
                            <View className={classnames(styles.historyStatus, {
                              [styles.statusRejected]: record.status === 'rejected'
                            })}>
                              {record.status === 'passed' ? '验收合格' : '验收不合格'}
                            </View>
                          </View>
                          <View className={styles.historyInfo}>
                            批号：{first.batchNo} · 共{total}支
                          </View>
                          <View className={styles.historyInfo}>运单号：{record.waybillNo}</View>
                          <View className={styles.historyTags}>
                            <View className={classnames(styles.tagItem, hTag.cls)}>{hTag.text}</View>
                            {rTag && <View className={classnames(styles.tagItem, rTag.cls)}>
                              不合格：{rTag.text}
                            </View>}
                          </View>
                          <View className={styles.historySign}>
                            <Text>签收人：{record.receiverName}（{record.receiverDept || '预防接种门诊'}）</Text>
                            <Text>{(record.signTime || '').slice(5, 16)}</Text>
                          </View>
                        </View>
                      </View>
                    )
                  })
                ) : (
                  <View className={styles.noRecordHint}>当前筛选条件下暂无记录</View>
                )}
              </View>

              {selectMode && selectedIds.length > 0 && (
                <View className={styles.floatingBar}>
                  <View className={styles.floatInfo}>
                    已选 <Text className={styles.floatNum}>{selectedIds.length}</Text> 张
                  </View>
                  <View className={styles.floatBtn} onClick={handleOpenHandoverCreate}>
                    生成交接清单
                  </View>
                </View>
              )}

              {!selectMode && (
                <View className={styles.emptyBox}>
                  <View className={styles.emptyIcon}>📋</View>
                  <View className={styles.emptyText}>开始新的验收</View>
                  <View className={styles.emptyHint}>扫描箱码或运单码后进行验收签收</View>
                  <View className={styles.scanBtn} onClick={handleScan}>去扫码</View>
                </View>
              )}
            </>
          ) : (
            <>
              <View className={styles.filterSection}>
                <View className={styles.filterTitle}>
                  <Text className={styles.filterIcon}>📑</Text>交接清单
                </View>
                <View className={styles.filterRow}>
                  <View className={styles.filterItem}>
                    <Text className={styles.filterLabel}>科室</Text>
                    <Picker mode='selector' range={deptOptions} value={handoverDeptIdx}
                      onChange={(e) => { setHandoverDeptIdx(Number(e.detail.value)); setHandoverFilterDept(Number(e.detail.value) === 0 ? 'all' : availableDepts[Number(e.detail.value) - 1]) }}>
                      <View className={styles.filterPicker}>
                        {deptOptions[handoverDeptIdx]}<Text className={styles.pickerArrow}>▾</Text>
                      </View>
                    </Picker>
                  </View>
                  <View className={styles.filterItem}>
                    <Text className={styles.filterLabel}>共</Text>
                    <View className={styles.filterPicker}>
                      {filteredHandovers.length} 份清单
                    </View>
                  </View>
                </View>
              </View>

              <View className={styles.listSection}>
                {filteredHandovers.length > 0 ? (
                  filteredHandovers.map((h) => (
                    <View key={h.id} className={styles.handoverItem} onClick={() => handleViewHandover(h)}>
                      <View className={styles.handoverHeader}>
                        <Text className={styles.handoverTitle} numberOfLines={1}>{h.title}</Text>
                        <View className={classnames(styles.handoverStatus, {
                          [styles.hsDone]: h.confirmStatus === 'confirmed',
                          [styles.hsPending]: h.confirmStatus === 'pending'
                        })}>
                          {h.confirmStatus === 'confirmed' ? '已确认' : '待确认'}
                        </View>
                      </View>
                      <View className={styles.handoverStats}>
                        <Text>合格 {h.passedCount} 单</Text>
                        <Text className={styles.statRejected}>不合格 {h.rejectedCount} 单</Text>
                        <Text>共 {h.totalQty} 支</Text>
                      </View>
                      <View className={styles.handoverInfo}>
                        <Text>制表人：{h.creatorName}</Text>
                        <Text>{h.createTime.slice(5, 16)}</Text>
                      </View>
                      {h.confirmStatus === 'confirmed' && h.confirmerName && (
                        <View className={styles.handoverConfirmed}>
                          科室负责人 {h.confirmerName} 于 {h.confirmTime?.slice(5, 16)} 确认
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <View className={styles.noRecordHint}>暂无交接清单，请先勾选记录生成</View>
                )}
              </View>
            </>
          )}
        </>
      )}

      {showSuccess && acceptanceRecord && (
        <View className={styles.successModal}>
          <View className={styles.modalContent}>
            <View className={styles.modalTitle}>
              {acceptanceRecord.status === 'passed' ? '🎉 验收成功' : '已提交验收'}
            </View>
            <AcceptanceCard record={acceptanceRecord} checkItemLabels={checkItemLabels}
              showPhotos showTraceSummary showBatches photoPlaceholders showRejectTracking />
            <View className={styles.modalActions}>
              <View className={`${styles.modalBtn} ${styles.modalBtnOutline}`} onClick={handleCloseSuccess}>
                继续验收
              </View>
              <View className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={handleCloseSuccess}>
                完成
              </View>
            </View>
          </View>
        </View>
      )}

      {detailRecord && (
        <View className={styles.successModal} onClick={handleCloseDetail}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalTitle}>验收记录详情</View>
            <AcceptanceCard record={detailRecord} checkItemLabels={checkItemLabels}
              showPhotos showTraceSummary showBatches photoPlaceholders showRejectTracking
              onMakeupPhoto={(label) => handleMakeupPhoto(detailRecord.id, label)}
              onTrackingUpdate={() => setDetailTrackingRefresh((x) => x + 1)} />
            <View className={styles.modalActions}>
              <View className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                onClick={handleCloseDetail} style={{ flex: 1 }}>关闭</View>
            </View>
          </View>
        </View>
      )}

      {showHandoverCreate && (
        <View className={styles.successModal} onClick={() => setShowHandoverCreate(false)}>
          <View className={styles.smallModal} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalTitle}>生成交接清单</View>
            <View className={styles.createHint}>
              勾选 {selectedIds.length} 张记录，将生成一份交接清单供科室负责人确认
            </View>
            <View className={styles.inputRow} style={{ marginTop: 16 }}>
              <Text className={styles.inputLabel}>制表人*</Text>
              <Input className={styles.inputField} placeholder='请输入制表人姓名'
                value={creatorName} onInput={(e) => setCreatorName(e.detail.value)} />
            </View>
            <View className={styles.modalActions}>
              <View className={`${styles.modalBtn} ${styles.modalBtnOutline}`}
                onClick={() => setShowHandoverCreate(false)}>取消</View>
              <View className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                onClick={handleCreateHandover}>确认生成</View>
            </View>
          </View>
        </View>
      )}

      {showHandoverDetail && (
        <View className={styles.successModal} onClick={() => setShowHandoverDetail(null)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalTitle}>{showHandoverDetail.title}</View>

            <View className={styles.handoverSummary}>
              <View className={styles.hsRow}>
                <Text className={styles.hsLabel}>科室</Text>
                <Text className={styles.hsValue}>{showHandoverDetail.dept}</Text>
                <Text className={styles.hsLabel} style={{ marginLeft: 24 }}>月份</Text>
                <Text className={styles.hsValue}>{showHandoverDetail.month}</Text>
              </View>
              <View className={styles.hsGrid}>
                <View className={styles.hsCard}><Text className={styles.hsNum}>{showHandoverDetail.passedCount}</Text><Text className={styles.hsLabel}>合格单</Text></View>
                <View className={classnames(styles.hsCard, styles.hsCardRej)}><Text className={styles.hsNum}>{showHandoverDetail.rejectedCount}</Text><Text className={styles.hsLabel}>不合格单</Text></View>
                <View className={styles.hsCard}><Text className={styles.hsNum}>{showHandoverDetail.totalQty}</Text><Text className={styles.hsLabel}>总数量</Text></View>
                <View className={styles.hsCard}><Text className={styles.hsNum}>{showHandoverDetail.rejectedQty}</Text><Text className={styles.hsLabel}>不合格数</Text></View>
              </View>
              <View className={styles.hsFooter}>
                <Text>制表人：{showHandoverDetail.creatorName} · {showHandoverDetail.createTime.slice(5, 16)}</Text>
              </View>
            </View>

            <View className={styles.handoverRecords}>
              <View className={styles.hrHeader}>
                <Text className={styles.hrTitle}>逐单凭证预览</Text>
                <Text className={styles.hrIdx}>
                  {handoverDetailIdx + 1} / {showHandoverDetail.recordIds.length}
                </Text>
              </View>
              <View className={styles.hrNav}>
                <View className={classnames(styles.hrNavBtn, { [styles.navDisabled]: handoverDetailIdx === 0 })}
                  onClick={() => setHandoverDetailIdx((x) => Math.max(0, x - 1))}>上一单</View>
                <View className={classnames(styles.hrNavBtn, {
                  [styles.navDisabled]: handoverDetailIdx >= showHandoverDetail.recordIds.length - 1
                })} onClick={() => setHandoverDetailIdx((x) => Math.min(showHandoverDetail.recordIds.length - 1, x + 1))}>下一单</View>
              </View>
              {currentHandoverRecord ? (
                <AcceptanceCard record={currentHandoverRecord} checkItemLabels={checkItemLabels}
                  showPhotos showTraceSummary showBatches photoPlaceholders showRejectTracking />
              ) : (
                <View className={styles.noRecordHint}>该记录详情缺失</View>
              )}
            </View>

            {showHandoverDetail.confirmStatus === 'pending' ? (
              <View className={styles.confirmSection}>
                <View className={styles.confirmTitle}>📌 科室负责人确认</View>
                <View className={styles.inputRow}>
                  <Text className={styles.inputLabel}>负责人*</Text>
                  <Input className={styles.inputField} placeholder='请输入科室负责人姓名'
                    value={confirmerName} onInput={(e) => setConfirmerName(e.detail.value)} />
                </View>
                <View className={styles.modalActions}>
                  <View className={`${styles.modalBtn} ${styles.modalBtnOutline}`}
                    onClick={() => setShowHandoverDetail(null)}>返回</View>
                  <View className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                    onClick={handleConfirmHandover}>确认交接</View>
                </View>
              </View>
            ) : (
              <View className={styles.confirmSection}>
                <View className={styles.confirmDone}>
                  ✓ {showHandoverDetail.confirmerName} 已于 {showHandoverDetail.confirmTime?.slice(5, 16)} 确认交接
                </View>
                <View className={styles.modalActions}>
                  <View className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                    onClick={() => setShowHandoverDetail(null)} style={{ flex: 1 }}>关闭</View>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

export default ReceiptPage
