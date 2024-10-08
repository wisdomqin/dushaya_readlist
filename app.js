// app.js
App({
  // ... 其他代码

  globalData: {
    statusBarHeight: 0,
    navBarHeight: 0,
  },

  onLaunch() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    // 获取胶囊按钮位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();

    // 计算导航栏高度
    this.globalData.statusBarHeight = systemInfo.statusBarHeight;
    this.globalData.navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height;
  },
});
