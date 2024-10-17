// app.js
App({
  globalData: {
    statusBarHeight: 0,
    navBarHeight: 0,
    cloudReady: false
  },
  cloudReadyCallback: null,

  onLaunch: async function () {
    console.log('App onLaunch 开始');
    
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.statusBarHeight = systemInfo.statusBarHeight;

    // 获取胶囊按钮位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    
    // 计算导航栏高度
    this.globalData.navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height;

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    try {
      await wx.cloud.init({
        env: 'qinrui-6galokevca4bf72d',
        traceUser: true
      });
      console.log('云开发初始化成功');
      this.globalData.cloudReady = true;
      if (this.cloudReadyCallback) {
        this.cloudReadyCallback();
      }
    } catch (err) {
      console.error('云开发初始化失败', err);
    }
  },

  onShow: function() {
    // 添加这个新方法来启用分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 保留原有的 initCloud 方法
  initCloud: function(retryCount = 0) {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    console.log('开始初始化云环境，尝试次数：', retryCount + 1);
    wx.cloud.init({
      env: 'qinrui-6galokevca4bf72d',
      traceUser: true,
      success: (res) => {
        this.globalData.cloudReady = true;
        console.log('云开发初始化成功', res);
        if (this.cloudReadyCallback) {
          this.cloudReadyCallback();
        }
      },
      fail: (err) => {
        console.error('云开发初始化失败', err);
        if (retryCount < 3) {
          console.log('尝试重新初始化云环境');
          setTimeout(() => this.initCloud(retryCount + 1), 1000);
        } else {
          console.error('云开发初始化多次失败，请检查网络和环境配置');
        }
      },
      complete: () => {
        console.log('云开发初始化完成');
      }
    });

    // 添加超时检查
    setTimeout(() => {
      if (!this.globalData.cloudReady) {
        console.error('云开发初始化超时');
        if (this.cloudReadyCallback) {
          this.cloudReadyCallback();
        }
      }
    }, 5000);
  }
});
