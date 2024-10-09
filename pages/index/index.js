const app = getApp()

Page({
    data: {
      bookLists: [],
      isRefreshing: false
    },

    onLoad: function() {
      console.log('页面加载开始');
      const app = getApp();
      if (app.globalData.cloudReady) {
        console.log('云环境已就绪，直接获取书单');
        this.getBookLists();
      } else {
        console.log('等待云环境准备完成');
        app.cloudReadyCallback = () => {
          console.log('收到云环境准备完成回调');
          this.getBookLists();
        };

        // 添加超时检查
        setTimeout(() => {
          console.log('检查云环境准备状态:', app.globalData.cloudReady);
          if (!app.globalData.cloudReady) {
            console.warn('等待云环境准备超时，尝试直接获取书单');
            this.getBookLists();
          }
        }, 6000);
      }
    },

    onPullDownRefresh: function() {
      console.log('下拉刷新触发');
      this.setData({ isRefreshing: true });
      this.getBookLists();
    },

    getBookLists: function() {
      console.log('开始获取书单数据');
      wx.showLoading({
        title: '加载中...',
      });
    
      const db = wx.cloud.database();
      console.log('开始调用数据库查询');
      db.collection('bookLists').orderBy('createdAt', 'desc').limit(20).get().then(res => {
        console.log('获取书单数据成功:', res);
        if (res.data && res.data.length > 0) {
          this.setData({
            bookLists: res.data
          });
          console.log('设置书单数据成功，数量:', res.data.length);
        } else {
          console.log('获取到的书单数据为空');
        }
      }).catch(err => {
        console.error('获取书单失败：', err);
      }).finally(() => {
        wx.hideLoading();
        this.setData({ isRefreshing: false });
      });
    },

    goToDetail(e) {
      const id = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `/pages/booklistinfo/booklistinfo?id=${id}`
      });
    },

    goToSubmit() {
      wx.navigateTo({
        url: '/pages/submit/submit'
      });
    },

    onUnload: function() {
      // 移除这个函数，因为我们不再使用 wx.event
    },

    onShow: function() {
      this.getBookLists();
    },

    onReady: function() {
      this.setContainerHeight();
    },

    setContainerHeight: function() {
      // 如果不再需要动态设置容器高度，可以移除这个函数
      // 或者保留它，但不设置 containerStyle
      this.setData({
        containerStyle: '' // 清空之前设置的样式
      });
    }
});