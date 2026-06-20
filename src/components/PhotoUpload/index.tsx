import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

interface PhotoUploadProps {
  photos: { id: string; label: string; description: string; required: boolean; imageUrl?: string }[]
  onUpload: (id: string, url: string) => void
  onRemove: (id: string) => void
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ photos, onUpload, onRemove }) => {
  const handleChooseImage = async (photoId: string) => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album']
      })
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        onUpload(photoId, res.tempFilePaths[0])
      }
    } catch (err) {
      console.error('[PhotoUpload] chooseImage error:', err)
    }
  }

  const handleRemove = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation()
    onRemove(photoId)
  }

  return (
    <View className={styles.photoUpload}>
      {photos.map((photo) => (
        <View key={photo.id} className={styles.photoGroup}>
          {photo.imageUrl ? (
            <View className={styles.photoItem}>
              <Image
                className={styles.photoImage}
                src={photo.imageUrl}
                mode='aspectFill'
                onClick={() => handleChooseImage(photo.id)}
              />
              <View className={styles.removeBtn} onClick={(e) => handleRemove(e as any, photo.id)}>
                ×
              </View>
            </View>
          ) : (
            <View className={styles.photoAdd} onClick={() => handleChooseImage(photo.id)}>
              <Text className={styles.addIcon}>+</Text>
              <Text className={styles.addText}>{photo.label}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  )
}

export default PhotoUpload
