import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

interface CheckItemProps {
  label: string
  description: string
  required?: boolean
  checked: boolean
  onChange: (checked: boolean) => void
}

const CheckItem: React.FC<CheckItemProps> = ({
  label,
  description,
  required = false,
  checked,
  onChange
}) => {
  const handleClick = () => {
    onChange(!checked)
  }

  return (
    <View className={styles.checkItem} onClick={handleClick}>
      <View className={classnames(styles.checkbox, { [styles.checked]: checked })}>
        <View className={styles.checkIcon} />
      </View>
      <View className={styles.checkContent}>
        <View className={styles.checkLabel}>
          {required && <Text className={styles.requiredTag}>*</Text>}
          {label}
        </View>
        <Text className={styles.checkDesc}>{description}</Text>
      </View>
    </View>
  )
}

export default CheckItem
