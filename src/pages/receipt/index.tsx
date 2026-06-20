import React, { useState, useMemo } from 'react'
import { View, Text, Input, Textarea, Image, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useVaccineStore } from '@/store/vaccineStore'
import CheckItem from '@/components/CheckItem'
import PhotoUpload from '@/components/PhotoUpload'
import AcceptanceCard from '@/components/AcceptanceCard'
import { mockPhotoItems } from '@/data/mockVaccine'
import styles from './index.module.scss'

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
    getAcceptanceById
  } = useVaccineStore()

  const [receiverName, setReceiverName] = useState('')
  const [receiverDept, setReceiverDept] = useState('预防接种门诊')
  const [conclusion, setConclusion] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [detailRecord, setDetailRecord] = useState<any>(null)

  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [monthIndex, setMonthIndex] = useState(0)
  const [deptIndex, setDeptIndex] = useState(0)
  const [statusIndex, setStatusIndex] = useState(0)

  const availableMonths = useMemo(() => getAvailableMonths(), [getAvailableMonths])
  const availableDepts = useMemo(() => getAvailableDepts(), [getAvailableDepts])
  const monthOptions = ['全部月份', ...availableMonths]
  const deptOptions = ['全部科室', ...availableDepts]
  const statusOptions = ['全部结果', '验收合格', '验收不合格']
  const statusValues = ['all', 'passed', 'rejected']

  const checkItemLabels = getCheckItemLabels()

  const filteredHistory = useMemo(() => {
    return getFilteredHistory({
      month: filterMonth,
      dept: filterDept,
      status: filterStatus
    })
  }, [getFilteredHistory, filterMonth, filterDept, filterStatus])

  const stats = useMemo(() => {
    return getHistoryStats({
      month: filterMonth,
      dept: filterDept,
      status: filterStatus
    })
  }, [getHistoryStats, filterMonth, filterDept, filterStatus])

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
      Taro.showToast({
        title: '请先扫描运单',
        icon: 'none'
      })
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
      Taro.showToast({
        title: result.message || '提交失败，请重试',
        icon: 'none',
        duration: 2500
      })
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
  }

  const handleExportCard = () => {
    Taro.showToast({
      title: '已生成凭证图，可保存/分享',
      icon: 'success'
    })
  }

  const handleShareCard = () => {
    Taro.showToast({
      title: '已生成分享卡片',
      icon: 'success'
    })
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
        if (updated) {
          setDetailRecord({ ...updated })
        }
        Taro.showToast({ title: '照片补录成功', icon: 'success' })
      }
    } catch (err) {
      console.log('[ReceiptPage] makeup photo cancelled')
    }
  }

  const computeTotalQty = (record: any) => {
    if (!record?.vaccineBatches) return 0
    return record.vaccineBatches.reduce(
      (sum: number, b: any) => sum + (b.actualQuantity || b.expectedQuantity || 0),
      0
    )
  }

  const computeFirstBatch = (record: any) => {
    if (!record?.vaccineBatches || record.vaccineBatches.length === 0) return { name: '-', batchNo: '-' }
    const first = record.vaccineBatches[0]
    return { name: first.vaccineName, batchNo: first.batchNo }
  }

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
            <View className={styles.summaryBtn} onClick={handleScan}>
              重新扫码
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>💉</Text>
              疫苗批号验收
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
                      <View
                        className={classnames(styles.batchStatus, {
                          [styles.batchStatusPassed]: passed === true,
                          [styles.batchStatusFailed]: passed === false,
                          [styles.batchStatusPending]: passed === null || passed === undefined
                        })}
                      >
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
                      <Input
                        className={styles.qtyInput}
                        type='number'
                        value={batch.actualQuantity?.toString() || ''}
                        placeholder='请输入实到数量'
                        onInput={(e) => handleBatchInputChange(batch.id, e.detail.value)}
                      />
                      <Text className={styles.qtyUnit}>支</Text>
                      {diff !== 0 && (batch.actualQuantity !== undefined) && (
                        <Text
                          className={classnames(styles.qtyDiff, {
                            [styles.diffWarn]: diff < 0,
                            [styles.diffOver]: diff > 0
                          })}
                        >
                          {diff > 0 ? `多${diff}` : `少${Math.abs(diff)}`}
                        </Text>
                      )}
                    </View>
                    <View className={styles.batchCheckRow}>
                      <View
                        className={classnames(styles.batchCheckBtn, {
                          [styles.checkBtnActive]: passed === true
                        })}
                        onClick={() => handleBatchPassedClick(batch.id, true)}
                      >
                        ✓ 数量一致
                      </View>
                      <View
                        className={classnames(styles.batchCheckBtn, styles.checkBtnReject, {
                          [styles.checkBtnActive]: passed === false
                        })}
                        onClick={() => handleBatchPassedClick(batch.id, false)}
                      >
                        ✕ 数量异常
                      </View>
                    </View>
                    <View className={styles.batchRemarkRow}>
                      <Text className={styles.batchLabel}>异常说明</Text>
                      <Textarea
                        className={styles.remarkTextarea}
                        placeholder='如有数量差异或其他异常，请在此说明（选填）'
                        value={batch.batchRemark || ''}
                        onInput={(e) => handleBatchRemarkChange(batch.id, e.detail.value)}
                        maxlength={200}
                      />
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>✅</Text>
              验收项目
            </View>
            <View className={styles.sectionDesc}>请逐项检查并选择合格或不合格，带*为必选项</View>
            <View className={styles.checkList}>
              {checkItems.map((item) => (
                <CheckItem
                  key={item.id}
                  label={item.label}
                  description={item.description}
                  required={item.required}
                  value={checkResultsMap[item.id] ?? null}
                  onChange={(value) => handleCheckChange(item.id, value)}
                />
              ))}
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📷</Text>
              拍照留证
            </View>
            <View className={styles.sectionDesc}>请拍摄以下三张照片作为验收凭证，缺一不可</View>
            <PhotoUpload
              photos={photoItemsWithState}
              onUpload={handlePhotoUpload}
              onRemove={handlePhotoRemove}
            />
          </View>

          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>👤</Text>
              签收人信息
            </View>
            <View className={styles.inputGroup}>
              <View className={styles.inputRow}>
                <Text className={styles.inputLabel}>签收人*</Text>
                <Input
                  className={styles.inputField}
                  placeholder='请输入签收人姓名'
                  value={receiverName}
                  onInput={(e) => setReceiverName(e.detail.value)}
                />
              </View>
              <View className={styles.inputRow}>
                <Text className={styles.inputLabel}>部门</Text>
                <Input
                  className={styles.inputField}
                  placeholder='请输入部门，默认为预防接种门诊'
                  value={receiverDept}
                  onInput={(e) => setReceiverDept(e.detail.value)}
                />
              </View>
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📝</Text>
              验收结论
            </View>
            <View className={styles.sectionDesc}>
              {allChecksPassed
                ? '验收合格时可自动生成，也可补充说明（选填）'
                : '存在不合格项，请详细说明情况（必填）'}
            </View>
            <Textarea
              className={styles.conclusionTextarea}
              placeholder={
                allChecksPassed ? '请填写验收结论（选填）...' : '请填写异常情况说明（必填）...'
              }
              value={conclusion}
              onInput={(e) => setConclusion(e.detail.value)}
              maxlength={500}
            />
          </View>

          <View className={styles.actionBar}>
            <View className={styles.btnReject} onClick={() => handleSubmit('rejected')}>
              验收不合格
            </View>
            <View className={styles.btnPrimary} onClick={() => handleSubmit('passed')}>
              确认签收
            </View>
          </View>
        </>
      ) : (
        <>
          <View className={styles.historyHeader}>
            <View className={styles.historyTitle}>验收记录</View>
            <View className={styles.historySubtitle}>月底查档 · 科室交接</View>
          </View>

          <View className={styles.filterSection}>
            <View className={styles.filterTitle}>
              <Text className={styles.filterIcon}>🔍</Text>
              查档筛选
            </View>
            <View className={styles.filterRow}>
              <View className={styles.filterItem}>
                <Text className={styles.filterLabel}>月份</Text>
                <Picker
                  mode='selector'
                  range={monthOptions}
                  value={monthIndex}
                  onChange={handleMonthChange}
                >
                  <View className={styles.filterPicker}>
                    {monthOptions[monthIndex]}
                    <Text className={styles.pickerArrow}>▾</Text>
                  </View>
                </Picker>
              </View>
              <View className={styles.filterItem}>
                <Text className={styles.filterLabel}>科室</Text>
                <Picker
                  mode='selector'
                  range={deptOptions}
                  value={deptIndex}
                  onChange={handleDeptChange}
                >
                  <View className={styles.filterPicker}>
                    {deptOptions[deptIndex]}
                    <Text className={styles.pickerArrow}>▾</Text>
                  </View>
                </Picker>
              </View>
            </View>
            <View className={styles.filterRow}>
              <View className={styles.filterItem} style={{ flex: 1 }}>
                <Text className={styles.filterLabel}>验收结果</Text>
                <Picker
                  mode='selector'
                  range={statusOptions}
                  value={statusIndex}
                  onChange={handleStatusChange}
                >
                  <View className={styles.filterPicker}>
                    {statusOptions[statusIndex]}
                    <Text className={styles.pickerArrow}>▾</Text>
                  </View>
                </Picker>
              </View>
            </View>
          </View>

          <View className={styles.statsSection}>
            <View className={styles.statsTitle}>
              <Text className={styles.statsIcon}>📊</Text>
              筛选统计
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
            <View className={styles.listTitle}>
              记录列表
              <Text className={styles.listCount}>({filteredHistory.length})</Text>
            </View>
            {filteredHistory.length > 0 ? (
              filteredHistory.map((record) => {
                const first = computeFirstBatch(record)
                const total = computeTotalQty(record)
                return (
                  <View
                    key={record.id}
                    className={styles.historyItem}
                    onClick={() => handleViewDetail(record)}
                  >
                    <View className={styles.historyHeader}>
                      <Text className={styles.historyName} numberOfLines={1}>
                        {first.name}
                        {record.vaccineBatches?.length > 1 && ` 等${record.vaccineBatches.length}种`}
                      </Text>
                      <View
                        className={classnames(styles.historyStatus, {
                          [styles.statusRejected]: record.status === 'rejected'
                        })}
                      >
                        {record.status === 'passed' ? '验收合格' : '验收不合格'}
                      </View>
                    </View>
                    <View className={styles.historyInfo}>
                      批号：{first.batchNo} · 共{total}支
                    </View>
                    <View className={styles.historyInfo}>
                      运单号：{record.waybillNo}
                    </View>
                    <View className={styles.historySign}>
                      <Text>
                        签收人：{record.receiverName}（{record.receiverDept || '预防接种门诊'}）
                      </Text>
                      <Text>{(record.signTime || '').slice(5, 16)}</Text>
                    </View>
                  </View>
                )
              })
            ) : (
              <View className={styles.noRecordHint}>当前筛选条件下暂无记录</View>
            )}
          </View>

          <View className={styles.emptyBox}>
            <View className={styles.emptyIcon}>📋</View>
            <View className={styles.emptyText}>开始新的验收</View>
            <View className={styles.emptyHint}>扫描箱码或运单码后进行验收签收</View>
            <View className={styles.scanBtn} onClick={handleScan}>
              去扫码
            </View>
          </View>
        </>
      )}

      {showSuccess && acceptanceRecord && (
        <View className={styles.successModal}>
          <View className={styles.modalContent}>
            <View className={styles.modalTitle}>
              {acceptanceRecord.status === 'passed' ? '🎉 验收成功' : '已提交验收'}
            </View>
            <AcceptanceCard
              record={acceptanceRecord}
              checkItemLabels={checkItemLabels}
              showPhotos
              showTraceSummary
              showBatches
              onExport={handleExportCard}
              onShare={handleShareCard}
            />
            <View className={styles.modalActions}>
              <View
                className={`${styles.modalBtn} ${styles.modalBtnOutline}`}
                onClick={handleCloseSuccess}
              >
                继续验收
              </View>
              <View
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                onClick={handleCloseSuccess}
              >
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
            <AcceptanceCard
              record={detailRecord}
              checkItemLabels={checkItemLabels}
              showPhotos
              showTraceSummary
              showBatches
              photoPlaceholders
              onExport={handleExportCard}
              onShare={handleShareCard}
              onMakeupPhoto={(label) => handleMakeupPhoto(detailRecord.id, label)}
            />
            <View className={styles.modalActions}>
              <View
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                onClick={handleCloseDetail}
                style={{ flex: 1 }}
              >
                关闭
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default ReceiptPage
