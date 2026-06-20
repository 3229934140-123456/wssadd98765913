import React, { useState, useMemo } from 'react'
import { View, Text, Input, Textarea, Image } from '@tarojs/components'
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
    acceptanceHistory,
    setCheckResult,
    setPhotoUrl,
    submitAcceptance,
    resetAcceptance,
    getCheckItemLabels
  } = useVaccineStore()

  const [receiverName, setReceiverName] = useState('')
  const [receiverDept, setReceiverDept] = useState('预防接种门诊')
  const [conclusion, setConclusion] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [detailRecord, setDetailRecord] = useState<any>(null)

  const checkItemLabels = getCheckItemLabels()

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

  const handleScan = async () => {
    try {
      await Taro.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode', 'barCode']
      })
      Taro.switchTab({ url: '/pages/scan/index' })
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
    setDetailRecord(record)
  }

  const handleCloseDetail = () => {
    setDetailRecord(null)
  }

  return (
    <View className={styles.page}>
      {hasPending ? (
        <>
          <View className={styles.shipmentSummary}>
            <View className={styles.summaryInfo}>
              <View className={styles.summaryName}>{shipmentInfo.vaccineName}</View>
              <View className={styles.summaryNo}>
                批号：{shipmentInfo.batchNo} · 运单：{shipmentInfo.waybillNo}
              </View>
            </View>
            <View className={styles.summaryBtn} onClick={handleScan}>
              重新扫码
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
          <View className={styles.historyTitle}>验收记录</View>
          {acceptanceHistory.map((record) => (
            <View
              key={record.id}
              className={styles.historyItem}
              onClick={() => handleViewDetail(record)}
            >
              <View className={styles.historyHeader}>
                <Text className={styles.historyName}>{record.vaccineName}</Text>
                <View
                  className={classnames(styles.historyStatus, {
                    [styles.statusRejected]: record.status === 'rejected'
                  })}
                >
                  {record.status === 'passed' ? '验收合格' : '验收不合格'}
                </View>
              </View>
              <View className={styles.historyInfo}>
                批号：{record.batchNo} · {record.quantity}支
              </View>
              <View className={styles.historyInfo}>
                运单号：{record.waybillNo}
              </View>
              <View className={styles.historySign}>
                <Text>
                  签收人：{record.receiverName}（{record.receiverDept || '预防接种门诊'}）
                </Text>
                <Text>{record.signTime.slice(5, 16)}</Text>
              </View>
            </View>
          ))}

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
