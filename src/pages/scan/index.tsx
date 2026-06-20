import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useVaccineStore } from '@/store/vaccineStore'
import StatusCard from '@/components/StatusCard'
import { mockAcceptanceHistory } from '@/data/mockVaccine'
import styles from './index.module.scss'

const ScanPage: React.FC = () => {
  const { pendingRecord, shipmentInfo, acceptanceHistory, scanWaybill } = useVaccineStore()
  const hasPending = !!pendingRecord && !!shipmentInfo

  const handleScan = async () => {
    try {
      const res = await Taro.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode', 'barCode']
      })
      console.log('[ScanPage] scan result:', res.result)
      if (res.result && res.result.trim()) {
        scanWaybill(res.result.trim())
      }
    } catch (err) {
      console.log('[ScanPage] scan cancelled or failed:', err)
    }
  }

  const handleGoTrace = () => {
    Taro.switchTab({
      url: '/pages/trace/index'
    })
  }

  const handleGoReceipt = () => {
    Taro.switchTab({
      url: '/pages/receipt/index'
    })
  }

  const handleViewRecord = () => {
    Taro.switchTab({
      url: '/pages/receipt/index'
    })
  }

  return (
    <View className={styles.page}>
      <View className={styles.scanSection}>
        <Text className={styles.scanTitle}>疫苗冷链验收</Text>
        <Text className={styles.scanSubtitle}>扫描箱码或运单码，快速核验运输轨迹</Text>
        <View className={styles.scanBtn} onClick={handleScan}>
          <Text className={styles.scanIcon}>📷</Text>
          <Text className={styles.scanBtnText}>扫码验收</Text>
        </View>
        <Text className={styles.scanHint}>支持箱码、运单二维码扫描</Text>
      </View>

      <View className={styles.quickActions}>
        <View className={styles.quickCard} onClick={handleGoTrace}>
          <View className={styles.quickIcon}>📍</View>
          <Text className={styles.quickLabel}>轨迹回看</Text>
        </View>
        <View className={styles.quickCard} onClick={handleGoReceipt}>
          <View className={styles.quickIcon}>📋</View>
          <Text className={styles.quickLabel}>签收留痕</Text>
        </View>
      </View>

      <View className={`${styles.content} ${hasPending ? styles.contentWithActionBar : ''}`}>
        {hasPending ? (
          <>
            <Text className={styles.sectionTitle}>运单信息</Text>
            <StatusCard shipmentInfo={shipmentInfo} />
          </>
        ) : (
          <>
            <Text className={styles.sectionTitle}>最近验收</Text>
            <View className={styles.recentList}>
              {acceptanceHistory.slice(0, 3).map((item) => (
                <View
                  key={item.id}
                  className={styles.recentItem}
                  onClick={handleViewRecord}
                >
                  <View className={styles.recentInfo}>
                    <View className={styles.recentTitle}>{item.vaccineName}</View>
                    <View className={styles.recentSub}>
                      批号：{item.batchNo} · {item.arrivalTime.slice(5, 16)}
                    </View>
                  </View>
                  <View
                    className={`${styles.recentStatus} ${
                      item.status === 'passed' ? '' : styles.statusWarning
                    }`}
                  >
                    {item.status === 'passed' ? '已验收' : '待处理'}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {hasPending && (
        <View className={styles.actionBar}>
          <View className={styles.btnSecondary} onClick={handleGoTrace}>
            查看轨迹
          </View>
          <View className={styles.btnPrimary} onClick={handleGoReceipt}>
            去签收
          </View>
        </View>
      )}
    </View>
  )
}

export default ScanPage
