import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

interface CheckItemProps {
  label: string
  description: string
  required?: boolean
  value: boolean | null
  onChange: (value: boolean) => void
}

const CheckItem: React.FC<CheckItemProps> = ({
  label,
  description,
  required = false,
  value,
  onChange
}) => {
  return (
    <View className={styles.checkItem}>
      <View className={styles.checkContent}>
        <View className={styles.checkLabel}>
          {required && <Text className={styles.requiredTag}>*</Text>}
          {label}
        </View>
        <Text className={styles.checkDesc}>{description}</Text>
        <View className={styles.optionRow}>
          <View
            className={classnames(styles.optionBtn, styles.optionPass, {
              [styles.active]: value === true
            })}
            onClick={() => onChange(true)}
          >
            <Text className={styles.optionIcon}>✓</Text>
            <Text>合格</Text>
          </View>
          <View
            className={classnames(styles.optionBtn, styles.optionFail, {
              [styles.active]: value === false
            })}
            onClick={() => onChange(false)}
          >
            <Text className={styles.optionIcon}>✕</Text>
            <Text>不合格</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default CheckItem
