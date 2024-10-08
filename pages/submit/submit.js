Page({
  submitBookList(e) {
    const { url } = e.detail.value;
    if (!url) {
      wx.showToast({
        title: '请输入书单网址',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '提交中...',
    });

    // 模拟API调用
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 2000
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }, 1500);
  }
});