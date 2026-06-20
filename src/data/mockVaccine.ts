import type {
  ShipmentInfo,
  VaccineBatch,
  TracePoint,
  CheckItem,
  PhotoItem,
  AcceptanceRecord,
  TraceSummary
} from '@/types/vaccine'

export const mockShipmentInfo: ShipmentInfo = {
  waybillNo: 'YL2024061500128',
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

export const mockVaccineBatches: VaccineBatch[] = [
  {
    id: 'b1',
    batchNo: 'B20240518A03',
    vaccineName: '乙型肝炎疫苗（重组）',
    vaccineType: '一类疫苗',
    spec: '10μg/0.5ml/支',
    expectedQuantity: 240,
    actualQuantity: undefined,
    quantityPassed: null,
    batchRemark: ''
  },
  {
    id: 'b2',
    batchNo: 'B20240420C01',
    vaccineName: '麻腮风联合减毒活疫苗',
    vaccineType: '一类疫苗',
    spec: '0.5ml/支',
    expectedQuantity: 120,
    actualQuantity: undefined,
    quantityPassed: null,
    batchRemark: ''
  },
  {
    id: 'b3',
    batchNo: 'B20240315B02',
    vaccineName: '百白破联合疫苗',
    vaccineType: '一类疫苗',
    spec: '0.5ml/支',
    expectedQuantity: 180,
    actualQuantity: undefined,
    quantityPassed: null,
    batchRemark: ''
  }
]

export const mockTraceSummary: TraceSummary = {
  totalDuration: '5小时48分',
  totalPoints: 7,
  abnormalCount: 2,
  doorOpenCount: 2,
  temperatureRange: '2.1~7.8℃',
  routeText: '省疾控中心冷链仓库（A区）→ 朝阳社区卫生服务中心'
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

export const mockAcceptanceHistory: AcceptanceRecord[] = [
  {
    id: 'acc20240615001',
    waybillNo: 'YL2024061500128',
    vaccineBatches: [
      {
        id: 'b1',
        batchNo: 'B20240518A03',
        vaccineName: '乙型肝炎疫苗（重组）',
        vaccineType: '一类疫苗',
        spec: '10μg/0.5ml/支',
        expectedQuantity: 240,
        actualQuantity: 240,
        quantityPassed: true
      }
    ],
    arrivalTime: '2024-06-15 14:18:00',
    receiverName: '李护士',
    receiverDept: '预防接种门诊',
    checkResults: [
      { itemId: 'c1', passed: true },
      { itemId: 'c2', passed: true }
    ],
    photos: [
      { label: '箱体照片', url: 'https://picsum.photos/id/201/300/300' },
      { label: '温度显示屏', url: 'https://picsum.photos/id/160/300/300' },
      { label: '签收单', url: 'https://picsum.photos/id/20/300/300' }
    ],
    abnormalConclusion: '运输过程中有2次开门记录，均为正常作业操作，温度全程在2℃~8℃标准范围内，验收合格。',
    status: 'passed',
    signTime: '2024-06-15 14:35:22',
    traceSummary: mockTraceSummary
  },
  {
    id: 'acc20240614003',
    waybillNo: 'YL2024061400087',
    vaccineBatches: [
      {
        id: 'b1',
        batchNo: 'B20240422C01',
        vaccineName: '麻腮风联合减毒活疫苗',
        vaccineType: '一类疫苗',
        spec: '0.5ml/支',
        expectedQuantity: 180,
        actualQuantity: 180,
        quantityPassed: true
      }
    ],
    arrivalTime: '2024-06-14 10:25:00',
    receiverName: '王药械',
    receiverDept: '药剂科',
    checkResults: [
      { itemId: 'c1', passed: true },
      { itemId: 'c2', passed: true }
    ],
    photos: [
      { label: '箱体照片', url: 'https://picsum.photos/id/105/300/300' }
    ],
    abnormalConclusion: '运输全程温度正常，无异常开门记录，验收合格。',
    status: 'passed',
    signTime: '2024-06-14 10:42:15',
    traceSummary: {
      totalDuration: '3小时55分',
      totalPoints: 5,
      abnormalCount: 0,
      doorOpenCount: 0,
      temperatureRange: '2.5~5.8℃',
      routeText: '省疾控中心冷链仓库（A区）→ 朝阳社区卫生服务中心'
    }
  },
  {
    id: 'acc20240612005',
    waybillNo: 'YL2024061200156',
    vaccineBatches: [
      {
        id: 'b1',
        batchNo: 'B20240315B02',
        vaccineName: '百白破联合疫苗',
        vaccineType: '一类疫苗',
        spec: '0.5ml/支',
        expectedQuantity: 300,
        actualQuantity: 295,
        quantityPassed: false
      }
    ],
    arrivalTime: '2024-06-12 15:40:00',
    receiverName: '李护士',
    receiverDept: '预防接种门诊',
    checkResults: [
      { itemId: 'c1', passed: true },
      { itemId: 'c2', passed: true }
    ],
    photos: [],
    abnormalConclusion: '百白破疫苗到货295支，较运单300支少5支，已联系承运方核实，后续补寄。其余检查项合格，按不合格单留档。',
    status: 'rejected',
    signTime: '2024-06-12 16:05:33',
    traceSummary: {
      totalDuration: '6小时10分',
      totalPoints: 6,
      abnormalCount: 1,
      doorOpenCount: 1,
      temperatureRange: '3.0~6.9℃',
      routeText: '市疾控中心冷链仓库→ 朝阳社区卫生服务中心'
    }
  },
  {
    id: 'acc20240528012',
    waybillNo: 'YL2024052800098',
    vaccineBatches: [
      {
        id: 'b1',
        batchNo: 'B20240212A01',
        vaccineName: '乙型肝炎疫苗（重组）',
        vaccineType: '一类疫苗',
        spec: '10μg/0.5ml/支',
        expectedQuantity: 200,
        actualQuantity: 200,
        quantityPassed: true
      },
      {
        id: 'b2',
        batchNo: 'B20240208D04',
        vaccineName: '脊髓灰质炎灭活疫苗',
        vaccineType: '一类疫苗',
        spec: '0.5ml/支',
        expectedQuantity: 150,
        actualQuantity: 150,
        quantityPassed: true
      }
    ],
    arrivalTime: '2024-05-28 09:20:00',
    receiverName: '张主任',
    receiverDept: '儿童保健科',
    checkResults: [
      { itemId: 'c1', passed: true },
      { itemId: 'c2', passed: true }
    ],
    photos: [
      { label: '箱体照片', url: 'https://picsum.photos/id/301/300/300' },
      { label: '温度显示屏', url: 'https://picsum.photos/id/305/300/300' },
      { label: '签收单', url: 'https://picsum.photos/id/225/300/300' }
    ],
    abnormalConclusion: '运抵2种疫苗共350支，运输全程正常，全部验收合格。',
    status: 'passed',
    signTime: '2024-05-28 09:42:10',
    traceSummary: {
      totalDuration: '4小时30分',
      totalPoints: 5,
      abnormalCount: 0,
      doorOpenCount: 0,
      temperatureRange: '2.2~5.5℃',
      routeText: '省疾控中心冷链仓库（A区）→ 朝阳社区卫生服务中心'
    }
  },
  {
    id: 'acc20240515008',
    waybillNo: 'YL2024051500067',
    vaccineBatches: [
      {
        id: 'b1',
        batchNo: 'B20240120E02',
        vaccineName: 'A群C群脑膜炎球菌多糖疫苗',
        vaccineType: '一类疫苗',
        spec: '0.5ml/支',
        expectedQuantity: 100,
        actualQuantity: 100,
        quantityPassed: true
      }
    ],
    arrivalTime: '2024-05-15 16:05:00',
    receiverName: '王药械',
    receiverDept: '药剂科',
    checkResults: [
      { itemId: 'c1', passed: false },
      { itemId: 'c2', passed: true }
    ],
    photos: [
      { label: '箱体照片', url: 'https://picsum.photos/id/240/300/300' },
      { label: '温度显示屏', url: 'https://picsum.photos/id/250/300/300' }
    ],
    abnormalConclusion: '箱体一角有轻微挤压变形，内部疫苗经检查完好无破损。运输温度正常，经门诊主任评估后可正常使用，留档记录。',
    status: 'rejected',
    signTime: '2024-05-15 16:30:22',
    traceSummary: {
      totalDuration: '5小时20分',
      totalPoints: 6,
      abnormalCount: 0,
      doorOpenCount: 0,
      temperatureRange: '2.8~6.2℃',
      routeText: '市疾控中心冷链仓库→ 朝阳社区卫生服务中心'
    }
  }
]
