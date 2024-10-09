const app = getApp();

Page({
  data: {
    url: ''
  },

  inputUrl(e) {
    this.setData({
      url: e.detail.value
    });
  },

  submitBookList() {
    if (!this.data.url.trim()) {
      wx.showToast({
        title: '请输入书单网址',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '处理中...',
    });

    wx.cloud.callFunction({
      name: 'processBookList',
      data: {
        url: this.data.url
      },
      timeout: 60000 // 设置 60 秒超时
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });
        // 可以在这里进行页面跳转或其他操作
      } else {
        wx.showModal({
          title: '提示',
          content: res.result.message,
          showCancel: false
        });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showModal({
        title: '错误',
        content: '处理异常,请稍后重试或换其他网址重试',
        showCancel: false
      });
      console.error(err);
    });
  }
});