import type { ShipmentInfo, TracePoint, CheckItem, PhotoItem, AcceptanceRecord } from '@/types/vaccine'

export const mockShipmentInfo: ShipmentInfo = {
  waybillNo: 'YL2024061500128',
  batchNo: 'B20240518A03',
  vaccineName: '乙型肝炎疫苗（重组）',
  vaccineType: '一类疫苗',
  quantity: 240,
  spec: '10μg/0.5ml/支',
  originWarehouse: '省疾控中心冷链仓库（A区）',
  destinationClinic: '朝阳社区卫生服务中心',
  carrier: '康泰冷链物流有限公司',
  vehicleNo: '粤A·D8526冷',
  driverName: '张建国',
  driverPhone: '138****2567',
  startTime: '2024-06-15 08:30:00',
  estimatedArrival: '2024-06-15 14:30:00',
  actualArrival: '2024-06-15 14:18:00',
  temperatureMin: 2.1,
  temperatureMax: 7.8,
  temperatureStandard: '2℃~8℃',
  hasDoorOpen: true,
  doorOpenCount: 2,
  status: 'warning'
}

export const mockTracePoints: TracePoint[] = [
  {
    id: 't1',
    time: '2024-06-15 08:30:00',
    location: '省疾控中心冷链仓库（A区）',
    temperature: 3.5,
    type: 'departure',
    description: '疫苗出库装车，开始运输'
  },
  {
    id: 't2',
    time: '2024-06-15 09:45:00',
    location: 'G4京港澳高速韶关段',
    temperature: 4.2,
    type: 'normal',
    description: '运输途中，温度正常'
  },
  {
    id: 't3',
    time: '2024-06-15 10:20:00',
    location: 'G4京港澳高速清远服务区',
    temperature: 6.8,
    type: 'door_open',
    description: '车厢门开启',
    duration: 8,
    carrierRemark: '司机中途补充冷媒干冰，属正常操作'
  },
  {
    id: 't4',
    time: '2024-06-15 11:30:00',
    location: '广州绕城高速',
    temperature: 3.8,
    type: 'normal',
    description: '运输途中，温度正常'
  },
  {
    id: 't5',
    time: '2024-06-15 12:55:00',
    location: '天河区配送中转站',
    temperature: 7.2,
    type: 'temperature_abnormal',
    description: '温度接近上限阈值',
    duration: 12,
    carrierRemark: '中转站装卸货时环境温度高，开门时间较长，温度短暂升高但未超出标准范围'
  },
  {
    id: 't6',
    time: '2024-06-15 13:30:00',
    location: '天河区配送中转站',
    temperature: 4.5,
    type: 'normal',
    description: '温度恢复正常，继续运输'
  },
  {
    id: 't7',
    time: '2024-06-15 14:18:00',
    location: '朝阳社区卫生服务中心',
    temperature: 5.1,
    type: 'arrival',
    description: '运抵目的地，等待验收'
  }
]

export const mockCheckItems: CheckItem[] = [
  {
    id: 'c1',
    label: '外包装完整',
    description: '箱体无破损、无渗漏、无受潮',
    required: true
  },
  {
    id: 'c2',
    label: '温度计读数一致',
    description: '温控仪显示温度与系统记录相符',
    required: true
  },
  {
    id: 'c3',
    label: '数量无误',
    description: '实际到货数量与运单数量一致',
    required: true
  }
]

export const mockPhotoItems: PhotoItem[] = [
  {
    id: 'p1',
    label: '箱体照片',
    description: '拍摄疫苗箱外观全貌',
    required: true
  },
  {
    id: 'p2',
    label: '温度显示屏',
    description: '拍摄温控仪屏幕读数',
    required: true
  },
  {
    id: 'p3',
    label: '签收单',
    description: '拍摄纸质签收单据',
    required: true
  }
]

export const mockAcceptanceRecord: AcceptanceRecord = {
  id: 'acc20240615001',
  waybillNo: 'YL2024061500128',
  batchNo: 'B20240518A03',
  vaccineName: '乙型肝炎疫苗（重组）',
  quantity: 240,
  arrivalTime: '2024-06-15 14:18:00',
  receiverName: '李护士',
  receiverDept: '预防接种门诊',
  checkResults: [
    { itemId: 'c1', passed: true },
    { itemId: 'c2', passed: true },
    { itemId: 'c3', passed: true }
  ],
  photos: [
    { label: '箱体照片', url: 'https://picsum.photos/id/201/300/300' },
    { label: '温度显示屏', url: 'https://picsum.photos/id/160/300/300' },
    { label: '签收单', url: 'https://picsum.photos/id/20/300/300' }
  ],
  abnormalConclusion: '运输过程中有2次开门记录，均为正常作业操作，温度全程在2℃~8℃标准范围内，验收合格。',
  status: 'passed',
  signTime: '2024-06-15 14:35:22'
}

export const mockAcceptanceHistory: AcceptanceRecord[] = [
  mockAcceptanceRecord,
  {
    id: 'acc20240614003',
    waybillNo: 'YL2024061400087',
    batchNo: 'B20240422C01',
    vaccineName: '麻腮风联合减毒活疫苗',
    quantity: 180,
    arrivalTime: '2024-06-14 10:25:00',
    receiverName: '王药械',
    receiverDept: '药剂科',
    checkResults: [
      { itemId: 'c1', passed: true },
      { itemId: 'c2', passed: true },
      { itemId: 'c3', passed: true }
    ],
    photos: [],
    abnormalConclusion: '运输全程温度正常，无异常开门记录，验收合格。',
    status: 'passed',
    signTime: '2024-06-14 10:42:15'
  },
  {
    id: 'acc20240612005',
    waybillNo: 'YL2024061200156',
    batchNo: 'B20240315B02',
    vaccineName: '百白破联合疫苗',
    quantity: 300,
    arrivalTime: '2024-06-12 15:40:00',
    receiverName: '李护士',
    receiverDept: '预防接种门诊',
    checkResults: [
      { itemId: 'c1', passed: true },
      { itemId: 'c2', passed: true },
      { itemId: 'c3', passed: true }
    ],
    photos: [],
    abnormalConclusion: '运输全程温度正常，无异常开门记录，验收合格。',
    status: 'passed',
    signTime: '2024-06-12 16:05:33'
  }
]
