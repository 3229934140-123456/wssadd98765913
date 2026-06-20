import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { View, Canvas, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { AcceptanceRecord } from '@/types/vaccine'
import { mockPhotoItems } from '@/data/mockVaccine'
import styles from './index.module.scss'

export interface VoucherCanvasHandle {
  generateVoucher: (record: AcceptanceRecord, checkItemLabels: { id: string; label: string }[]) => Promise<string>
  saveVoucher: () => Promise<void>
  previewVoucher: () => Promise<void>
  shareVoucher: () => void
}

interface VoucherCanvasProps {
  onGenerated?: (tempFilePath: string) => void
}

const VoucherCanvas = forwardRef<VoucherCanvasHandle, VoucherCanvasProps>(({ onGenerated }, ref) => {
  const canvasRef = useRef<any>(null)
  const [generatedImage, setGeneratedImage] = useState<string>('')
  const canvasW = 750
  const canvasH = 1600

  const loadImage = (url: string): Promise<{ img: any; w: number; h: number }> => {
    return new Promise((resolve, reject) => {
      if (!url) return reject(new Error('no url'))
      Taro.getImageInfo({
        src: url,
        success: (res) => {
          resolve({ img: res, w: res.width, h: res.height })
        },
        fail: reject
      })
    })
  }

  const drawRoundRect = (ctx: any, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2)
    ctx.lineTo(x + w, y + h - r)
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5)
    ctx.lineTo(x + r, y + h)
    ctx.arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI)
    ctx.lineTo(x, y + r)
    ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
    ctx.closePath()
  }

  useImperativeHandle(ref, () => ({
    async generateVoucher(record, checkItemLabels) {
      try {
        const query = Taro.createSelectorQuery()
        query.select('#voucherCanvas')
          .fields({ node: true, size: true })
          .exec(async (res: any) => {
            if (!res[0] || !res[0].node) {
              Taro.showToast({ title: '画布初始化失败', icon: 'none' })
              return ''
            }
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')
            const dpr = Taro.getSystemInfoSync().pixelRatio || 2
            canvas.width = canvasW * dpr
            canvas.height = canvasH * dpr
            ctx.scale(dpr, dpr)

            let y = 0

            // 1. 背景
            ctx.fillStyle = '#f5f7fa'
            ctx.fillRect(0, 0, canvasW, canvasH)

            // 2. 顶部彩条
            const isRejected = record.status === 'rejected'
            const gradient = ctx.createLinearGradient(0, 0, canvasW, 0)
            if (isRejected) {
              gradient.addColorStop(0, '#F53F3F')
              gradient.addColorStop(1, '#FF7D7D')
            } else {
              gradient.addColorStop(0, '#1677FF')
              gradient.addColorStop(1, '#4096FF')
            }
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, canvasW, 180)

            // 标题
            ctx.fillStyle = '#FFFFFF'
            ctx.font = 'bold 36px PingFangSC'
            ctx.textAlign = 'center'
            ctx.fillText(isRejected ? '疫苗冷链验收 · 不合格单' : '疫苗冷链验收 · 合格凭证', canvasW / 2, 70)
            ctx.font = '22px PingFangSC'
            ctx.globalAlpha = 0.85
            ctx.fillText('WAYBILL ACCEPTANCE VOUCHER', canvasW / 2, 108)
            ctx.globalAlpha = 1

            // 状态印章
            ctx.save()
            ctx.translate(canvasW - 110, 100)
            ctx.rotate(-Math.PI / 8)
            ctx.strokeStyle = isRejected ? 'rgba(245,63,63,0.85)' : 'rgba(22,119,255,0.85)'
            ctx.lineWidth = 4
            ctx.beginPath()
            ctx.arc(0, 0, 68, 0, Math.PI * 2)
            ctx.stroke()
            ctx.fillStyle = isRejected ? 'rgba(245,63,63,0.85)' : 'rgba(22,119,255,0.85)'
            ctx.font = 'bold 24px PingFangSC'
            ctx.textAlign = 'center'
            ctx.fillText(isRejected ? '验收不合格' : '验收合格', 0, 8)
            ctx.restore()

            y = 180 + 24

            // 白色内容容器
            drawRoundRect(ctx, 24, y, canvasW - 48, canvasH - y - 40, 16)
            ctx.fillStyle = '#FFFFFF'
            ctx.fill()
            ctx.strokeStyle = 'rgba(0,0,0,0.04)'
            ctx.lineWidth = 1
            ctx.stroke()

            y += 32
            const contentX = 56
            const contentW = canvasW - 112

            // 基本信息
            const firstBatch = record.vaccineBatches?.[0]
            const totalQty = record.vaccineBatches?.reduce(
              (s, b) => s + (b.actualQuantity || b.expectedQuantity || 0), 0
            ) || 0

            ctx.fillStyle = '#1D2129'
            ctx.font = 'bold 26px PingFangSC'
            ctx.textAlign = 'left'
            ctx.fillText('📦 运单信息', contentX, y)
            y += 40

            const infoItems = [
              ['疫苗名称', (firstBatch?.vaccineName || '-') + (record.vaccineBatches?.length > 1 ? ` 等${record.vaccineBatches.length}种` : '')],
              ['批号', firstBatch?.batchNo || '-'],
              ['合计数量', `${totalQty}支`],
              ['运单号', record.waybillNo],
              ['到货时间', (record.arrivalTime || '').slice(0, 16) || '-'],
              ['签收人', record.receiverName || '-'],
              ['所属部门', record.receiverDept || '预防接种门诊'],
              ['签收时间', (record.signTime || '').slice(0, 16) || '-']
            ]
            for (let i = 0; i < infoItems.length; i += 2) {
              const l1 = infoItems[i]
              const l2 = infoItems[i + 1]
              ctx.font = '20px PingFangSC'
              ctx.fillStyle = '#86909C'
              ctx.fillText(l1[0], contentX, y)
              ctx.fillStyle = '#1D2129'
              ctx.fillText(String(l1[1]).slice(0, 22), contentX + 120, y)
              if (l2) {
                ctx.fillStyle = '#86909C'
                ctx.fillText(l2[0], contentX + 340, y)
                ctx.fillStyle = '#1D2129'
                ctx.fillText(String(l2[1]).slice(0, 22), contentX + 460, y)
              }
              y += 36
            }

            // 轨迹摘要
            if (record.traceSummary) {
              y += 8
              ctx.fillStyle = '#1D2129'
              ctx.font = 'bold 26px PingFangSC'
              ctx.fillText('📍 运输轨迹摘要', contentX, y)
              y += 40
              // 路线
              ctx.font = '20px PingFangSC'
              ctx.fillStyle = '#4E5969'
              ctx.fillText(String(record.traceSummary.routeText).slice(0, 30), contentX, y)
              y += 36
              // 四个统计
              const traceStats = [
                [record.traceSummary.totalDuration, '全程时长'],
                [record.traceSummary.temperatureRange, '温度区间'],
                [`${record.traceSummary.abnormalCount}次`, '异常记录'],
                [`${record.traceSummary.doorOpenCount}次`, '开门记录']
              ]
              traceStats.forEach((s, idx) => {
                const x = contentX + idx * (contentW / 4)
                drawRoundRect(ctx, x, y, contentW / 4 - 8, 80, 8)
                ctx.fillStyle = '#F2F3F5'
                ctx.fill()
                ctx.fillStyle = record.traceSummary!.abnormalCount > 0 && idx === 2 ? '#F53F3F' : '#1677FF'
                ctx.font = 'bold 22px PingFangSC'
                ctx.textAlign = 'center'
                ctx.fillText(String(s[0]).slice(0, 8), x + (contentW / 4 - 8) / 2, y + 36)
                ctx.fillStyle = '#86909C'
                ctx.font = '18px PingFangSC'
                ctx.fillText(s[1], x + (contentW / 4 - 8) / 2, y + 62)
                ctx.textAlign = 'left'
              })
              y += 96
            }

            // 疫苗批次
            if (record.vaccineBatches && record.vaccineBatches.length > 0) {
              y += 8
              ctx.fillStyle = '#1D2129'
              ctx.font = 'bold 26px PingFangSC'
              ctx.fillText('💉 疫苗批次明细', contentX, y)
              y += 36
              const showBatches = record.vaccineBatches.slice(0, 3)
              for (let i = 0; i < showBatches.length; i++) {
                const b = showBatches[i]
                const passed = b.quantityPassed
                drawRoundRect(ctx, contentX, y, contentW, 92, 8)
                ctx.fillStyle = '#FAFAFA'
                ctx.fill()
                y += 28
                ctx.fillStyle = '#1D2129'
                ctx.font = 'bold 22px PingFangSC'
                ctx.fillText(`${i + 1}. ${b.vaccineName}`, contentX + 16, y)
                ctx.fillStyle = passed === true ? '#00B42A' : passed === false ? '#F53F3F' : '#FF7D00'
                ctx.font = '18px PingFangSC'
                ctx.textAlign = 'right'
                ctx.fillText(passed === true ? '✓ 数量一致' : passed === false ? '✕ 数量异常' : '待核对', contentX + contentW - 16, y)
                ctx.textAlign = 'left'
                y += 26
                ctx.fillStyle = '#86909C'
                ctx.font = '18px PingFangSC'
                ctx.fillText(`批号：${b.batchNo}  规格：${b.spec}  应到：${b.expectedQuantity}支  实到：${b.actualQuantity ?? b.expectedQuantity}支`, contentX + 16, y)
                y += 40
              }
            }

            // 验收项目
            y += 8
            ctx.fillStyle = '#1D2129'
            ctx.font = 'bold 26px PingFangSC'
            ctx.fillText('✅ 验收项目', contentX, y)
            y += 36
            record.checkResults?.forEach((res) => {
              const label = checkItemLabels.find((l) => l.id === res.itemId)?.label || res.itemId
              ctx.font = '20px PingFangSC'
              ctx.fillStyle = res.passed ? '#00B42A' : '#F53F3F'
              ctx.fillText(res.passed ? '✓' : '✕', contentX, y + 6)
              ctx.fillStyle = '#4E5969'
              ctx.fillText(`${label}：${res.passed ? '合格' : '不合格'}`, contentX + 28, y + 6)
              y += 30
            })

            // 三张照片
            y += 12
            ctx.fillStyle = '#1D2129'
            ctx.font = 'bold 26px PingFangSC'
            ctx.fillText('📷 留证照片', contentX, y)
            y += 36

            const photoLabels = mockPhotoItems.map((p) => p.label)
            const photoSize = (contentW - 2 * 16) / 3

            for (let i = 0; i < 3; i++) {
              const px = contentX + i * (photoSize + 8)
              drawRoundRect(ctx, px, y, photoSize, photoSize, 8)
              ctx.save()
              ctx.clip()
              const photo = record.photos?.find((p) => p.label === photoLabels[i])
              try {
                if (photo?.url) {
                  const info = await loadImage(photo.url).catch(() => null)
                  if (info) {
                    const imgObj = canvas.createImage()
                    await new Promise<void>((resolve) => {
                      imgObj.onload = () => resolve()
                      imgObj.onerror = () => resolve()
                      imgObj.src = info.img.path || photo.url
                    })
                    ctx.drawImage(imgObj, px, y, photoSize, photoSize)
                  } else {
                    ctx.fillStyle = '#F2F3F5'
                    ctx.fillRect(px, y, photoSize, photoSize)
                  }
                } else {
                  ctx.fillStyle = '#F2F3F5'
                  ctx.fillRect(px, y, photoSize, photoSize)
                  ctx.fillStyle = '#C9CDD4'
                  ctx.font = '40px sans-serif'
                  ctx.textAlign = 'center'
                  ctx.fillText('📷', px + photoSize / 2, y + photoSize / 2 - 10)
                  ctx.font = '18px PingFangSC'
                  ctx.fillText('暂无照片', px + photoSize / 2, y + photoSize / 2 + 24)
                  ctx.textAlign = 'left'
                }
              } catch (e) {
                ctx.fillStyle = '#F2F3F5'
                ctx.fillRect(px, y, photoSize, photoSize)
              }
              ctx.restore()
              ctx.strokeStyle = 'rgba(0,0,0,0.08)'
              ctx.lineWidth = 1
              ctx.stroke()

              // 照片标签
              ctx.fillStyle = 'rgba(0,0,0,0.55)'
              ctx.fillRect(px, y + photoSize - 36, photoSize, 36)
              ctx.fillStyle = '#FFFFFF'
              ctx.font = '16px PingFangSC'
              ctx.textAlign = 'center'
              ctx.fillText(photoLabels[i], px + photoSize / 2, y + photoSize - 12)
              ctx.textAlign = 'left'
            }
            y += photoSize + 20

            // 验收结论
            const conclusionY = y
            drawRoundRect(ctx, contentX, y, contentW, 120, 8)
            ctx.fillStyle = isRejected ? '#FFF1F0' : '#E8F3FF'
            ctx.fill()
            ctx.fillStyle = isRejected ? '#F53F3F' : '#1677FF'
            ctx.font = 'bold 22px PingFangSC'
            ctx.fillText(isRejected ? '⚠ 不合格说明' : '💡 异常结论', contentX + 16, conclusionY + 32)
            ctx.fillStyle = isRejected ? '#CD2C29' : '#2A5A9E'
            ctx.font = '20px PingFangSC'
            const conclusion = (record.abnormalConclusion || '暂无说明').split('').reduce((acc, ch) => {
              if (ctx.measureText(acc + ch).width > contentW - 32) return acc + '\n' + ch
              return acc + ch
            }, '')
            const lines = conclusion.split('\n').slice(0, 3)
            lines.forEach((ln, li) => {
              ctx.fillText(ln, contentX + 16, conclusionY + 62 + li * 26)
            })
            y += 132

            // 签名区
            ctx.strokeStyle = '#E5E6EB'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(contentX, y)
            ctx.lineTo(contentX + contentW, y)
            ctx.stroke()
            y += 20

            ctx.fillStyle = '#86909C'
            ctx.font = '18px PingFangSC'
            ctx.fillText('科室负责人签名：______________', contentX, y)
            ctx.textAlign = 'right'
            ctx.fillText('日期：' + new Date().toISOString().slice(0, 10), contentX + contentW, y)
            ctx.textAlign = 'left'

            // 生成图片
            Taro.canvasToTempFilePath({
              canvas,
              x: 0,
              y: 0,
              width: canvasW,
              height: Math.min(y + 80, canvasH),
              destWidth: canvasW * dpr,
              destHeight: Math.min(y + 80, canvasH) * dpr,
              fileType: 'png',
              quality: 1,
              success: (toRes: any) => {
                setGeneratedImage(toRes.tempFilePath)
                onGenerated?.(toRes.tempFilePath)
              },
              fail: (err) => {
                console.error('canvasToTempFilePath fail', err)
                Taro.showToast({ title: '生成失败', icon: 'none' })
              }
            })
          })
        return ''
      } catch (err: any) {
        console.error('generateVoucher error', err)
        Taro.showToast({ title: err.message || '生成失败', icon: 'none' })
        return ''
      }
      return ''
    },

    async saveVoucher() {
      if (!generatedImage) {
        Taro.showToast({ title: '请先生成凭证', icon: 'none' })
        return
      }
      try {
        const auth = await Taro.getSetting()
        if (!auth.authSetting['scope.writePhotosAlbum']) {
          const authRes = await Taro.authorize({ scope: 'scope.writePhotosAlbum' }).catch(() => null)
          if (!authRes) {
            Taro.showToast({ title: '请授权相册后重试', icon: 'none' })
            return
          }
        }
        await Taro.saveImageToPhotosAlbum({ filePath: generatedImage })
        Taro.showToast({ title: '已保存到相册', icon: 'success' })
      } catch (err) {
        console.error('saveVoucher err', err)
        Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
      }
    },

    async previewVoucher() {
      if (!generatedImage) {
        Taro.showToast({ title: '请先生成凭证', icon: 'none' })
        return
      }
      Taro.previewImage({
        urls: [generatedImage],
        current: generatedImage
      })
    },

    shareVoucher() {
      if (!generatedImage) {
        Taro.showToast({ title: '请先生成凭证', icon: 'none' })
        return
      }
      Taro.showActionSheet({
        itemList: ['保存到相册', '生成图片后转发给好友'],
        success: (res) => {
          if (res.tapIndex === 0) {
            get().saveVoucher()
          } else if (res.tapIndex === 1) {
            Taro.previewImage({
              urls: [generatedImage],
              current: generatedImage
            })
            Taro.showToast({ title: '长按图片可转发给好友', icon: 'none', duration: 2500 })
          }
        }
      })
    }
  }))

  return (
    <View className={styles.canvasWrap}>
      <Canvas
        id='voucherCanvas'
        type='2d'
        ref={canvasRef}
        className={styles.hiddenCanvas}
        style={{ width: canvasW + 'px', height: canvasH + 'px' }}
      />
      {generatedImage && (
        <View className={styles.previewBox} onClick={() => Taro.previewImage({ urls: [generatedImage] })}>
          <View className={styles.previewLabel}>📎 已生成凭证图（点击可预览）</View>
          <Image className={styles.previewImg} src={generatedImage} mode='widthFix' />
        </View>
      )}
    </View>
  )
})

VoucherCanvas.displayName = 'VoucherCanvas'

export default VoucherCanvas
