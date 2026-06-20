import React, { useRef, useState, useEffect } from 'react'
import { View, Text, Image, Input, Textarea, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useVaccineStore } from '@/store/vaccineStore'
import styles from './index.module.scss'
import type { AcceptanceRecord, VaccineBatch, RejectTracking } from '@/types/vaccine'
import { mockPhotoItems } from '@/data/mockVaccine'
import VoucherCanvas, { VoucherCanvasHandle } from '@/components/VoucherCanvas'

interface AcceptanceCardProps {
  record: AcceptanceRecord
  checkItemLabels?: { id: string; label: string }[]
  showPhotos?: boolean
  showTraceSummary?: boolean
  showBatches?: boolean
  photoPlaceholders?: boolean
  showRejectTracking?: boolean
  onExport?: () => void
  onShare?: () => void
  onMakeupPhoto?: (label: string) => void
  onTrackingUpdate?: () => void
}

const AcceptanceCard: React.FC<AcceptanceCardProps> = ({
  record,
  checkItemLabels = [],
  showPhotos = false,
  showTraceSummary = false,
  showBatches = false,
  photoPlaceholders = false,
  showRejectTracking = false,
  onMakeupPhoto,
  onTrackingUpdate
}) => {
  const { getRejectTrackingByAcceptanceId, updateRejectTracking, getHandoverById } = useVaccineStore()
  const voucherRef = useRef<VoucherCanvasHandle>(null)
  const [generating, setGenerating] = useState(false)

  const [tracking, setTracking] = useState<RejectTracking | null>(null)
  const [editable, setEditable] = useState(false)
  const [carrierRemark, setCarrierRemark] = useState('')
  const [replenishQty, setReplenishQty] = useState('0')
  const [reviewResult, setReviewResult] = useState<string>('pending')
  const [reviewRemark, setReviewRemark] = useState('')
  const [reviewerName, setReviewerName] = useState('')

  const statusText = {
    passed: '验收合格',
    rejected: '验收不合格',
    pending: '待验收'
  }

  const getCheckLabel = (itemId: string) => {
    const item = checkItemLabels.find((i) => i.id === itemId)
    return item?.label || itemId
  }

  const isRejected = record.status === 'rejected'

  const firstBatch: VaccineBatch | undefined = record?.vaccineBatches?.[0]
  const totalQty = record?.vaccineBatches?.reduce(
    (sum, b) => sum + (b.actualQuantity || b.expectedQuantity || 0),
    0
  ) || 0

  const allPhotoLabels = mockPhotoItems.map((p) => p.label)

  const getPhotoByLabel = (label: string) => {
    return record.photos?.find((p) => p.label === label)
  }

  useEffect(() => {
    if (isRejected) {
      const t = getRejectTrackingByAcceptanceId(record.id) || null
      setTracking(t)
      if (t) {
        setCarrierRemark(t.carrierRemark)
        setReplenishQty(String(t.replenishQty))
        setReviewResult(t.reviewResult)
        setReviewRemark(t.reviewRemark)
        setReviewerName(t.reviewerName)
      }
    }
  }, [isRejected, record.id, getRejectTrackingByAcceptanceId])

  const handover = record.handoverId ? getHandoverById(record.handoverId) : undefined
  const reviewStatusMap: Record<string, string> = {
    closed: '已闭环',
    processing: '处理中',
    pending: '待处理'
  }

  const handleGenerateAndExport = async () => {
    if (generating) return
    try {
      setGenerating(true)
      Taro.showLoading({ title: '生成中...', mask: true })
      if (voucherRef.current) {
        await voucherRef.current.generateVoucher(record, checkItemLabels)
        setTimeout(async () => {
          Taro.hideLoading()
          if (voucherRef.current) {
            await voucherRef.current.previewVoucher()
            setTimeout(() => {
              Taro.showActionSheet({
                itemList: ['保存到相册', '发给科室负责人/好友'],
                success: (res) => {
                  if (!voucherRef.current) return
                  if (res.tapIndex === 0) voucherRef.current.saveVoucher()
                  else if (res.tapIndex === 1) voucherRef.current.shareVoucher()
                }
              })
            }, 500)
          }
          setGenerating(false)
        }, 800)
      } else {
        Taro.hideLoading()
        setGenerating(false)
      }
    } catch (err) {
      Taro.hideLoading()
      setGenerating(false)
      Taro.showToast({ title: '生成失败', icon: 'none' })
    }
  }

  const handleSaveTracking = () => {
    if (!reviewerName.trim()) {
      Taro.showToast({ title: '请填写复核人姓名', icon: 'none' })
      return
    }
    const res = updateRejectTracking(
      record.id,
      {
        carrierRemark,
        replenishQty: parseInt(replenishQty) || 0,
        reviewResult: reviewResult as any,
        reviewRemark
      },
      reviewerName.trim()
    )
    if (res.success) {
      Taro.showToast({ title: '已更新跟踪记录', icon: 'success' })
      setEditable(false)
      setTracking(getRejectTrackingByAcceptanceId(record.id) || null)
      onTrackingUpdate?.()
    } else {
      Taro.showToast({ title: res.message, icon: 'none' })
    }
  }

  const resultOptions = ['待处理', '处理中', '已闭环']
  const resultValues = ['pending', 'processing', 'closed']

  return (
    <View className={styles.card}>
      <View
        className={classnames(styles.cardHeader, {
          [styles.headerRejected]: isRejected
        })}
      >
        <View className={styles.headerTitle}>
          {isRejected ? '验收不合格单' : '验收合格单'}
        </View>
        <View className={styles.headerSub}>疫苗冷链运输验收凭证</View>
        <View className={styles.statusBadge}>{statusText[record.status]}</View>
      </View>

      <View className={styles.actionRow}>
        <View
          className={classnames(styles.actionBtn, { [styles.actionBtnLoading]: generating })}
          onClick={handleGenerateAndExport}
        >
          <Text className={styles.actionIcon}>📥</Text>
          <Text>{generating ? '生成中...' : '导出/分享凭证'}</Text>
        </View>
        <View
          className={classnames(styles.actionBtn, styles.actionBtnPreview)}
          onClick={() => voucherRef.current?.previewVoucher()}
        >
          <Text className={styles.actionIcon}>�</Text>
          <Text>预览</Text>
        </View>
      </View>

      <View className={styles.cardBody}>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <View className={styles.infoLabel}>疫苗名称</View>
            <View className={styles.infoValue}>
              {firstBatch?.vaccineName || '-'}
              {showBatches && record.vaccineBatches?.length > 1 && (
                <Text className={styles.multiBatchTag}>
                  等{record.vaccineBatches.length}种
                </Text>
              )}
            </View>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoLabel}>批号</View>
            <View className={styles.infoValue}>
              {firstBatch?.batchNo || '-'}
            </View>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoLabel}>合计数量</View>
            <View className={styles.infoValue}>{totalQty}支</View>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoLabel}>运单号</View>
            <View className={styles.infoValue}>{record.waybillNo}</View>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoLabel}>到货时间</View>
            <View className={styles.infoValue}>
              {(record.arrivalTime || '').slice(5, 16) || '-'}
            </View>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoLabel}>签收人</View>
            <View className={styles.infoValue}>{record.receiverName || '-'}</View>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoLabel}>部门</View>
            <View className={styles.infoValue}>
              {record.receiverDept || '预防接种门诊'}
            </View>
          </View>
          {handover && (
            <View className={styles.infoItem}>
              <View className={styles.infoLabel}>交接状态</View>
              <View className={styles.infoValue}>
                <View
                  className={classnames(styles.handoverTag, {
                    [styles.handoverDone]: handover.confirmStatus === 'confirmed'
                  })}
                >
                  {handover.confirmStatus === 'confirmed'
                    ? `已交接（${handover.confirmerName}）`
                    : '待科室负责人确认'}
                </View>
              </View>
            </View>
          )}
        </View>

        {showTraceSummary && record.traceSummary && (
          <>
            <View className={styles.divider} />
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>📍</Text>
              运输轨迹摘要
            </View>
            <View className={styles.traceSummaryBox}>
              <View className={styles.traceRoute}>
                <Text className={styles.traceRouteText}>
                  {record.traceSummary.routeText}
                </Text>
              </View>
              <View className={styles.traceStatsRow}>
                <View className={styles.traceStatItem}>
                  <Text className={styles.traceStatValue}>
                    {record.traceSummary.totalDuration}
                  </Text>
                  <Text className={styles.traceStatLabel}>全程时长</Text>
                </View>
                <View className={styles.traceStatItem}>
                  <Text className={styles.traceStatValue}>
                    {record.traceSummary.temperatureRange}
                  </Text>
                  <Text className={styles.traceStatLabel}>温度区间</Text>
                </View>
                <View className={styles.traceStatItem}>
                  <Text
                    className={classnames(styles.traceStatValue, {
                      [styles.traceStatWarn]: record.traceSummary.abnormalCount > 0
                    })}
                  >
                    {record.traceSummary.abnormalCount}次
                  </Text>
                  <Text className={styles.traceStatLabel}>异常记录</Text>
                </View>
                <View className={styles.traceStatItem}>
                  <Text className={styles.traceStatValue}>
                    {record.traceSummary.doorOpenCount}次
                  </Text>
                  <Text className={styles.traceStatLabel}>开门记录</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {showBatches && record.vaccineBatches && record.vaccineBatches.length > 0 && (
          <>
            <View className={styles.divider} />
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>💉</Text>
              疫苗批次明细
              <Text className={styles.batchCountTag}>
                共{record.vaccineBatches.length}种
              </Text>
            </View>
            <View className={styles.batchList}>
              {record.vaccineBatches.map((batch, idx) => {
                const isPass = batch.quantityPassed === true
                const isFail = batch.quantityPassed === false
                const diff = (batch.actualQuantity || 0) - batch.expectedQuantity
                return (
                  <View key={batch.id} className={styles.batchItem}>
                    <View className={styles.batchItemHeader}>
                      <View className={styles.batchItemName}>
                        {idx + 1}. {batch.vaccineName}
                      </View>
                      <View
                        className={classnames(styles.batchItemStatus, {
                          [styles.batchItemStatusPass]: isPass,
                          [styles.batchItemStatusFail]: isFail,
                          [styles.batchItemStatusPending]: !isPass && !isFail
                        })}
                      >
                        {isPass ? '数量一致' : isFail ? '数量异常' : '未核对'}
                      </View>
                    </View>
                    <View className={styles.batchItemRow}>
                      <Text className={styles.batchItemLabel}>批号：</Text>
                      <Text className={styles.batchItemValue}>{batch.batchNo}</Text>
                      <Text className={styles.batchItemLabel}> 规格：</Text>
                      <Text className={styles.batchItemValue}>{batch.spec}</Text>
                    </View>
                    <View className={styles.batchItemRow}>
                      <Text className={styles.batchItemLabel}>应到：</Text>
                      <Text className={styles.batchItemValue}>
                        {batch.expectedQuantity}支
                      </Text>
                      <Text className={styles.batchItemLabel}> 实到：</Text>
                      <Text
                        className={classnames(styles.batchItemValue, {
                          [styles.batchQtyDiff]: diff !== 0
                        })}
                      >
                        {batch.actualQuantity ?? batch.expectedQuantity}支
                      </Text>
                      {diff !== 0 && (
                        <Text
                          className={classnames(styles.batchQtyDiffTag, {
                            [styles.diffNeg]: diff < 0
                          })}
                        >
                          {diff > 0 ? `多${diff}` : `少${Math.abs(diff)}`}
                        </Text>
                      )}
                    </View>
                    {batch.batchRemark && (
                      <View className={styles.batchRemarkBox}>
                        <Text className={styles.batchRemarkLabel}>备注：</Text>
                        <Text className={styles.batchRemarkText}>
                          {batch.batchRemark}
                        </Text>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          </>
        )}

        <View className={styles.divider} />

        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleIcon}>✅</Text>
          验收项目
        </View>
        <View className={styles.checkResultList}>
          {record.checkResults && record.checkResults.length > 0 ? (
            record.checkResults.map((item) => (
              <View key={item.itemId} className={styles.checkResultItem}>
                <View
                  className={classnames(styles.resultDot, {
                    [styles.dotSuccess]: item.passed,
                    [styles.dotFail]: !item.passed
                  })}
                />
                <Text
                  className={classnames(styles.resultText, {
                    [styles.resultFail]: !item.passed
                  })}
                >
                  {getCheckLabel(item.itemId)}：{item.passed ? '合格' : '不合格'}
                </Text>
              </View>
            ))
          ) : (
            <Text className={styles.noCheckHint}>暂无验收项记录</Text>
          )}
        </View>

        {showPhotos && (
          <>
            <View className={styles.divider} />
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>📷</Text>
              留证照片
            </View>
            <View className={styles.photosSection}>
              <View className={styles.photosGrid}>
                {allPhotoLabels.map((label) => {
                  const photo = getPhotoByLabel(label)
                  const hasPhoto = !!photo?.url
                  return (
                    <View key={label} className={styles.photoItem}>
                      {hasPhoto ? (
                        <>
                          <Image
                            className={styles.photoImage}
                            src={photo!.url}
                            mode="aspectFill"
                          />
                          <View className={styles.photoLabel}>{label}</View>
                        </>
                      ) : photoPlaceholders ? (
                        <View
                          className={classnames(styles.photoPlaceholder, {
                            [styles.photoPlaceholderClickable]: !!onMakeupPhoto
                          })}
                          onClick={() => onMakeupPhoto && onMakeupPhoto(label)}
                        >
                          <Text className={styles.placeholderIcon}>📷</Text>
                          <Text className={styles.placeholderText}>
                            {onMakeupPhoto ? '点击补录' : '暂无照片'}
                          </Text>
                          <View className={styles.photoLabel}>{label}</View>
                        </View>
                      ) : null}
                    </View>
                  )
                })}
              </View>
            </View>
          </>
        )}

        {isRejected && showRejectTracking && (
          <>
            <View className={styles.divider} />
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>🔄</Text>
              不合格处理跟踪
              {tracking && (
                <Text
                  className={classnames(styles.statusTag, {
                    [styles.statusTagClosed]: tracking.reviewResult === 'closed',
                    [styles.statusTagProcessing]: tracking.reviewResult === 'processing'
                  })}
                >
                  {reviewStatusMap[tracking.reviewResult]}
                </Text>
              )}
              {!editable && (
                <Text className={styles.editBtn} onClick={() => setEditable(true)}>
                  编辑
                </Text>
              )}
            </View>
            <View className={styles.trackingBox}>
              {editable || !tracking ? (
                <>
                  <View className={styles.trackingRow}>
                    <Text className={styles.trackingLabel}>承运方说明</Text>
                    <Textarea
                      className={styles.trackingTextarea}
                      placeholder='承运方对异常情况的说明'
                      value={carrierRemark}
                      onInput={(e) => setCarrierRemark(e.detail.value)}
                      maxlength={300}
                    />
                  </View>
                  <View className={styles.trackingRow}>
                    <Text className={styles.trackingLabel}>补货数量</Text>
                    <Input
                      className={styles.trackingInput}
                      type='number'
                      placeholder='承运方承诺补发数量（支）'
                      value={replenishQty}
                      onInput={(e) => setReplenishQty(e.detail.value)}
                    />
                    <Text className={styles.trackingUnit}>支</Text>
                  </View>
                  <View className={styles.trackingRow}>
                    <Text className={styles.trackingLabel}>处理结果</Text>
                    <Picker
                      mode='selector'
                      range={resultOptions}
                      value={resultValues.indexOf(reviewResult)}
                      onChange={(e) => setReviewResult(resultValues[Number(e.detail.value)])}
                    >
                      <View className={styles.trackingPicker}>
                        {resultOptions[resultValues.indexOf(reviewResult)]}
                        <Text className={styles.pickerArrow}>▾</Text>
                      </View>
                    </Picker>
                  </View>
                  <View className={styles.trackingRow}>
                    <Text className={styles.trackingLabel}>复核意见</Text>
                    <Textarea
                      className={styles.trackingTextarea}
                      placeholder='对本次不合格的复核结论'
                      value={reviewRemark}
                      onInput={(e) => setReviewRemark(e.detail.value)}
                      maxlength={400}
                    />
                  </View>
                  <View className={styles.trackingRow}>
                    <Text className={styles.trackingLabel}>复核人*</Text>
                    <Input
                      className={styles.trackingInput}
                      placeholder='请填写复核人姓名'
                      value={reviewerName}
                      onInput={(e) => setReviewerName(e.detail.value)}
                    />
                  </View>
                  <View className={styles.trackingActions}>
                    <View className={styles.trackingBtnCancel} onClick={() => {
                      setEditable(false)
                      if (tracking) {
                        setCarrierRemark(tracking.carrierRemark)
                        setReplenishQty(String(tracking.replenishQty))
                        setReviewResult(tracking.reviewResult)
                        setReviewRemark(tracking.reviewRemark)
                        setReviewerName(tracking.reviewerName)
                      }
                    }}>取消</View>
                    <View className={styles.trackingBtnSave} onClick={handleSaveTracking}>保存</View>
                  </View>
                </>
              ) : (
                <>
                  <View className={styles.trackingInfoRow}>
                    <Text className={styles.trackingK}>承运方说明：</Text>
                    <Text className={styles.trackingV}>{tracking.carrierRemark || '无'}</Text>
                  </View>
                  <View className={styles.trackingInfoRow}>
                    <Text className={styles.trackingK}>补货数量：</Text>
                    <Text className={styles.trackingV}>{tracking.replenishQty}支</Text>
                  </View>
                  <View className={styles.trackingInfoRow}>
                    <Text className={styles.trackingK}>复核意见：</Text>
                    <Text className={styles.trackingV}>{tracking.reviewRemark || '无'}</Text>
                  </View>
                  <View className={styles.trackingFooter}>
                    <Text>复核人：{tracking.reviewerName}</Text>
                    <Text>{(tracking.reviewTime || '').slice(5, 16)}</Text>
                  </View>
                </>
              )}
            </View>
          </>
        )}

        <View
          className={classnames(styles.conclusionBox, {
            [styles.conclusionRejected]: isRejected
          })}
        >
          <View
            className={classnames(styles.conclusionTitle, {
              [styles.conclusionTitleRejected]: isRejected
            })}
          >
            {isRejected ? '不合格说明' : '异常结论'}
          </View>
          <Text className={styles.conclusionText}>
            {record.abnormalConclusion || '暂无结论'}
          </Text>
        </View>
      </View>

      <View className={styles.cardFooter}>
        <View className={styles.signInfo}>
          签收人：{record.receiverName || '-'}（
          {record.receiverDept || '预防接种门诊'}）
        </View>
        <View className={styles.signTime}>
          {(record.signTime || '').slice(5, 16) || '-'}
        </View>
      </View>

      <VoucherCanvas ref={voucherRef} />
    </View>
  )
}

export default AcceptanceCard
