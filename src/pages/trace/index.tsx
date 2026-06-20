import React, { useState, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { useVaccineStore } from '@/store/vaccineStore'
import Timeline from '@/components/Timeline'
import { mockShipmentInfo, mockTracePoints } from '@/data/mockVaccine'
import dayjs from 'dayjs'
import styles from './index.module.scss'

const TracePage: React.FC = () => {
  const { tracePoints, shipmentInfo, scanned } = useVaccineStore()
  const [filter, setFilter] = useState<'all' | 'abnormal'>('all')

  const displayPoints = useMemo(() => {
    const points = tracePoints.length > 0 ? tracePoints : mockTracePoints
    if (filter === 'abnormal') {
      return points.filter(
        (p) => p.type === 'door_open' || p.type === 'temperature_abnormal'
      )
    }
    return points
  }, [tracePoints, filter])

  const displayShipment = shipmentInfo || mockShipmentInfo

  const handleScan = async () => {
    try {
      await Taro.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode', 'barCode']
      })
      Taro.switchTab({ url: '/pages/scan/index' })
    } catch (err) {
      console.log('[TracePage] scan cancelled')
    }
  }

  const calculateDuration = () => {
    if (!displayShipment) return '--'
    const start = dayjs(displayShipment.startTime)
    const end = dayjs(displayShipment.actualArrival)
    const hours = end.diff(start, 'hour')
    const minutes = end.diff(start, 'minute') % 60
    return `${hours}小时${minutes}分`
  }

  const abnormalCount = displayPoints.filter(
    (p) => p.type === 'door_open' || p.type === 'temperature_abnormal'
  ).length

  const tempBars = useMemo(() => {
    const points = tracePoints.length > 0 ? tracePoints : mockTracePoints
    const temps = points.map((p) => p.temperature)
    const min = Math.min(...temps) - 1
    const max = Math.max(...temps) + 1
    const range = max - min || 1
    return points.map((p) => ({
      height: ((p.temperature - min) / range) * 100,
      isAbnormal: p.type === 'temperature_abnormal',
      isWarning: p.type === 'door_open',
      time: p.time.slice(11, 16)
    }))
  }, [tracePoints])

  return (
    <View className={styles.page}>
      <View className={styles.overviewCard}>
        <View className={styles.routeLine}>
          <View className={styles.routePoint}>
            <View className={styles.pointLabel}>起运</View>
            <View className={styles.pointName}>{displayShipment.originWarehouse}</View>
          </View>
          <View className={styles.routeConnector}>
            <View className={styles.routeArrow} />
          </View>
          <View className={styles.routePoint}>
            <View className={styles.pointLabel}>到达</View>
            <View className={styles.pointName}>{displayShipment.destinationClinic}</View>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <View className={styles.statValue}>{calculateDuration()}</View>
            <View className={styles.statLabel}>全程时长</View>
          </View>
          <View className={styles.statItem}>
            <View
              className={classnames(styles.statValue, {
                [styles.statValueWarning]: abnormalCount > 0
              })}
            >
              {abnormalCount}次
            </View>
            <View className={styles.statLabel}>异常记录</View>
          </View>
          <View className={styles.statItem}>
            <View className={styles.statValue}>
              {displayShipment.temperatureMin}~
              {displayShipment.temperatureMax}℃
            </View>
            <View className={styles.statLabel}>温度区间</View>
          </View>
        </View>
      </View>

      <View className={styles.temperatureChart}>
        <View className={styles.chartTitle}>温度趋势</View>
        <View className={styles.tempBars}>
          {tempBars.map((bar, idx) => (
            <View
              key={idx}
              className={classnames(styles.tempBar, {
                [styles.barAbnormal]: bar.isAbnormal,
                [styles.barWarning]: bar.isWarning
              })}
            >
              <View className={styles.tempFill} style={{ height: `${bar.height}%` }} />
            </View>
          ))}
        </View>
        <View className={styles.tempLabels}>
          {tempBars.map((bar, idx) => (
            <View key={idx} className={styles.tempLabel}>
              {bar.time}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.sectionTitle}>运输轨迹</View>

      <View className={styles.filterTabs}>
        <View
          className={classnames(styles.filterTab, { [styles.active]: filter === 'all' })}
          onClick={() => setFilter('all')}
        >
          全部节点
        </View>
        <View
          className={classnames(styles.filterTab, { [styles.active]: filter === 'abnormal' })}
          onClick={() => setFilter('abnormal')}
        >
          仅看异常
        </View>
      </View>

      <View className={styles.legendRow}>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.dotSuccess}`} />
          <Text>关键节点</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.dotNormal}`} />
          <Text>运输途中</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.dotWarning}`} />
          <Text>开门记录</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.dotError}`} />
          <Text>温度异常</Text>
        </View>
      </View>

      {displayPoints.length > 0 ? (
        <View className={styles.timelineCard}>
          <Timeline points={displayPoints} />
        </View>
      ) : (
        <View className={styles.emptyBox}>
          <View className={styles.emptyIcon}>📭</View>
          <View className={styles.emptyText}>暂无异常记录</View>
          <View className={styles.emptyHint}>运输过程全程正常，请放心验收</View>
        </View>
      )}

      {!scanned && tracePoints.length === 0 && (
        <View className={styles.emptyBox}>
          <View className={styles.emptyIcon}>📷</View>
          <View className={styles.emptyText}>请先扫描运单码</View>
          <View className={styles.emptyHint}>扫描箱码或运单码后查看运输轨迹</View>
          <View className={styles.scanBtn} onClick={handleScan}>
            去扫码
          </View>
        </View>
      )}
    </View>
  )
}

export default TracePage
