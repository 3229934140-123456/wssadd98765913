import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { ShipmentInfo } from '@/types/vaccine'

interface StatusCardProps {
  shipmentInfo: ShipmentInfo
}

const StatusCard: React.FC<StatusCardProps> = ({ shipmentInfo }) => {
  const statusText = {
    normal: '运输正常',
    warning: '存在异常',
    error: '温度超标'
  }

  return (
    <View className={styles.statusCard}>
      <View className={styles.statusHeader}>
        <Text className={styles.waybillNo}>运单号：{shipmentInfo.waybillNo}</Text>
        <View
          className={classnames(styles.statusBadge, {
            [styles.statusNormal]: shipmentInfo.status === 'normal',
            [styles.statusWarning]: shipmentInfo.status === 'warning',
            [styles.statusError]: shipmentInfo.status === 'error'
          })}
        >
          {statusText[shipmentInfo.status]}
        </View>
      </View>

      <Text className={styles.vaccineName}>{shipmentInfo.vaccineName}</Text>
      <View className={styles.vaccineInfo}>
        <Text>{shipmentInfo.vaccineType}</Text>
        <Text> · </Text>
        <Text>{shipmentInfo.spec}</Text>
        <Text> · </Text>
        <Text>{shipmentInfo.quantity}支</Text>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <View className={styles.statValue}>
            {shipmentInfo.temperatureMin}~{shipmentInfo.temperatureMax}℃
          </View>
          <View className={styles.statLabel}>温度区间</View>
        </View>
        <View className={styles.statItem}>
          <View className={styles.statValue}>{shipmentInfo.temperatureStandard}</View>
          <View className={styles.statLabel}>标准范围</View>
        </View>
        <View className={styles.statItem}>
          <View className={styles.statValue}>{shipmentInfo.doorOpenCount}次</View>
          <View className={styles.statLabel}>开门记录</View>
        </View>
      </View>

      <View className={styles.infoSection}>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>起运仓库</Text>
          <Text className={styles.infoValue}>{shipmentInfo.originWarehouse}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>承运车辆</Text>
          <Text className={styles.infoValue}>{shipmentInfo.vehicleNo}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>司机</Text>
          <Text className={styles.infoValue}>
            {shipmentInfo.driverName}（{shipmentInfo.driverPhone}）
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>承运方</Text>
          <Text className={styles.infoValue}>{shipmentInfo.carrier}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>起运时间</Text>
          <Text className={styles.infoValue}>{shipmentInfo.startTime}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>到达时间</Text>
          <Text className={styles.infoValue}>{shipmentInfo.actualArrival}</Text>
        </View>
      </View>
    </View>
  )
}

export default StatusCard
