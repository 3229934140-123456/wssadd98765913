export default defineAppConfig({
  pages: [
    'pages/scan/index',
    'pages/trace/index',
    'pages/receipt/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1677ff',
    navigationBarTitleText: '疫苗冷链监管',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f5f7fa'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#1677ff',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/scan/index',
        text: '扫码验收'
      },
      {
        pagePath: 'pages/trace/index',
        text: '轨迹回看'
      },
      {
        pagePath: 'pages/receipt/index',
        text: '签收留痕'
      }
    ]
  }
})
