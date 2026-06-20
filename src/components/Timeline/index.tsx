import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { TracePoint } from '@/types/vaccine'

interface TimelineProps {
  points: TracePoint[]
}

const Timeline: React.FC<TimelineProps> = ({ points }) => {
  const getDotType = (type: TracePoint['type']) => {
    switch (type) {
      case 'temperature_abnormal':
        return 'error'
      case 'door_open':
        return 'warning'
      case 'arrival':
      case 'departure':
        return 'success'
      default:
        return 'normal'
    }
  }

  const getTypeLabel = (type: TracePoint['type']) => {
    switch (type) {
      case 'departure':
        return '起运'
      case 'arrival':
        return '到达'
      case 'door_open':
        return '开门记录'
      case 'temperature_abnormal':
        return '温度异常'
      default:
        return '运输中'
    }
  }

  return (
    <View className={styles.timeline}>
      {points.map((point) => {
        const dotType = getDotType(point.type)
        const hasWarning = point.type === 'door_open' || point.type === 'temperature_abnormal'
        const typeLabel = getTypeLabel(point.type)

        return (
          <View
            key={point.id}
            className={classnames(styles.timelineItem, {
              [styles.tempWarning]: point.type === 'door_open',
              [styles.tempError]: point.type === 'temperature_abnormal'
            })}
          >
            <View className={styles.timelineLine} />
            <View
              className={classnames(styles.timelineDot, {
                [styles.dotNormal]: dotType === 'normal',
                [styles.dotSuccess]: dotType === 'success',
                [styles.dotWarning]: dotType === 'warning',
                [styles.dotError]: dotType === 'error'
              })}
            />
            <View
              className={classnames(styles.timelineContent, {
                [styles.contentWarning]: point.type === 'door_open',
                [styles.contentError]: point.type === 'temperature_abnormal',
                [styles.contentSuccess]: point.type === 'arrival' || point.type === 'departure'
              })}
            >
              <View className={styles.itemHeader}>
                <Text className={styles.itemTime}>{point.time.slice(5, 16)}</Text>
                <Text className={styles.itemTemp}>{point.temperature}℃</Text>
              </View>
              <View className={styles.itemLocation}>{point.location}</View>
              <View className={styles.itemDesc}>
                <View
                  className={classnames(styles.itemTag, {
                    [styles.tagWarning]: dotType === 'warning',
                    [styles.tagError]: dotType === 'error',
                    [styles.tagSuccess]: dotType === 'success'
                  })}
                >
                  {typeLabel}
                </View>
                {hasWarning && point.duration && (
                  <Text style={{ fontSize: '24rpx', color: '#ff7d00' }}>
                    持续约 {point.duration} 分钟
                  </Text>
                )}
                {!hasWarning && (
                  <Text style={{ fontSize: '24rpx', color: '#86909c' }}>{point.description}</Text>
                )}
              </View>
              {hasWarning && <Text className={styles.itemDesc}>{point.description}</Text>}
              {point.carrierRemark && (
                <View className={styles.remarkBox}>
                  <Text className={styles.remarkLabel}>承运方说明：</Text>
                  <Text>{point.carrierRemark}</Text>
                </View>
              )}
            </View>
          </View>
        )
      })}
    </View>
  )
}

export default Timeline
