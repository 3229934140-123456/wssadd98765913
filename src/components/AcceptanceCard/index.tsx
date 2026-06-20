import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { AcceptanceRecord, VaccineBatch } from '@/types/vaccine'
import { mockPhotoItems } from '@/data/mockVaccine'

interface AcceptanceCardProps {
  record: AcceptanceRecord
  checkItemLabels?: { id: string; label: string }[]
  showPhotos?: boolean
  showTraceSummary?: boolean
  showBatches?: boolean
  photoPlaceholders?: boolean
  onExport?: () => void
  onShare?: () => void
  onMakeupPhoto?: (label: string) => void
}

const AcceptanceCard: React.FC<AcceptanceCardProps> = ({
  record,
  checkItemLabels = [],
  showPhotos = false,
  showTraceSummary = false,
  showBatches = false,
  photoPlaceholders = false,
  onExport,
  onShare,
  onMakeupPhoto
}) => {
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

      {(onExport || onShare) && (
        <View className={styles.actionRow}>
          {onExport && (
            <View className={styles.actionBtn} onClick={onExport}>
              <Text className={styles.actionIcon}>📥</Text>
              <Text>导出凭证</Text>
            </View>
          )}
          {onShare && (
            <View className={styles.actionBtn} onClick={onShare}>
              <Text className={styles.actionIcon}>📤</Text>
              <Text>分享</Text>
            </View>
          )}
        </View>
      )}

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
    </View>
  )
}

export default AcceptanceCard
