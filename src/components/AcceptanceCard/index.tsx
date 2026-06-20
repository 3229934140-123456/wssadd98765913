import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { AcceptanceRecord } from '@/types/vaccine'

interface AcceptanceCardProps {
  record: AcceptanceRecord
  checkItemLabels?: { id: string; label: string }[]
}

const AcceptanceCard: React.FC<AcceptanceCardProps> = ({ record, checkItemLabels = [] }) => {
  const statusText = {
    passed: '验收合格',
    rejected: '验收不合格',
    pending: '待验收'
  }

  const getCheckLabel = (itemId: string) => {
    const item = checkItemLabels.find((i) => i.id === itemId)
    return item?.label || itemId
  }

  return (
    <View className={styles.card}>
      <View className={styles.cardHeader}>
        <View className={styles.headerTitle}>验收合格单</View>
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
              <Text className={styles.resultText}>
                {getCheckLabel(item.itemId)}：{item.passed ? '合格' : '不合格'}
              </Text>
            </View>
          ))}
        </View>

        <View className={styles.conclusionBox}>
          <View className={styles.conclusionTitle}>异常结论</View>
          <Text className={styles.conclusionText}>{record.abnormalConclusion}</Text>
        </View>
      </View>

      <View className={styles.cardFooter}>
        <View className={styles.signInfo}>
          签收人：{record.receiverName}（{record.receiverDept}）
        </View>
        <View className={styles.signTime}>{record.signTime.slice(5, 16)}</View>
      </View>
    </View>
  )
}

export default AcceptanceCard
