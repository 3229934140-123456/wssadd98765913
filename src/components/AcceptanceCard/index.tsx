import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { AcceptanceRecord } from '@/types/vaccine'

interface AcceptanceCardProps {
  record: AcceptanceRecord
  checkItemLabels?: { id: string; label: string }[]
  showPhotos?: boolean
}

const AcceptanceCard: React.FC<AcceptanceCardProps> = ({ record, checkItemLabels = [], showPhotos = false }) => {
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

      <View className={styles.cardBody}>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <View className={styles.infoLabel}>疫苗名称</View>
            <View className={styles.infoValue}>{record.vaccineName}</View>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoLabel}>批号</View>
            <View className={styles.infoValue}>{record.batchNo}</View>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoLabel}>运单号</View>
            <View className={styles.infoValue}>{record.waybillNo}</View>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoLabel}>到货时间</View>
            <View className={styles.infoValue}>{record.arrivalTime.slice(5, 16)}</View>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoLabel}>签收人</View>
            <View className={styles.infoValue}>{record.receiverName}</View>
          </View>
          <View className={styles.infoItem}>
            <View className={styles.infoLabel}>部门</View>
            <View className={styles.infoValue}>{record.receiverDept || '预防接种门诊'}</View>
          </View>
        </View>

        <View className={styles.divider} />

        <View className={styles.sectionTitle}>验收项目</View>
        <View className={styles.checkResultList}>
          {record.checkResults.map((item) => (
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
          ))}
        </View>

        {showPhotos && record.photos.length > 0 && (
          <View className={styles.photosSection}>
            <View className={styles.photosTitle}>留证照片</View>
            <View className={styles.photosGrid}>
              {record.photos.map((photo, idx) => (
                <View key={idx} className={styles.photoItem}>
                  <Image
                    className={styles.photoImage}
                    src={photo.url}
                    mode="aspectFill"
                  />
                  <View className={styles.photoLabel}>{photo.label}</View>
                </View>
              ))}
            </View>
          </View>
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
          <Text className={styles.conclusionText}>{record.abnormalConclusion}</Text>
        </View>
      </View>

      <View className={styles.cardFooter}>
        <View className={styles.signInfo}>
          签收人：{record.receiverName}（{record.receiverDept || '预防接种门诊'}）
        </View>
        <View className={styles.signTime}>{record.signTime.slice(5, 16)}</View>
      </View>
    </View>
  )
}

export default AcceptanceCard
