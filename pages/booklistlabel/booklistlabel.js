const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    safeAreaTopHeight: 0,
    tag: {},
    bookLists: []
  },
  onLoad(options) {
    this.setData({
      safeAreaTopHeight: app.globalData.statusBarHeight + app.globalData.navBarHeight
    });

    const tag = options.tag;
    this.setData({
      tag: {
        name: tag,
        description: `与"${tag}"相关的精选书单合集。`
      }
    });
    this.fetchTaggedBookLists(tag);
  },

  fetchTaggedBookLists(tag) {
    wx.showLoading({ title: '加载中...' });
    
    db.collection('bookLists').where({
      tags: db.command.all([tag])
    }).get().then(res => {
      this.setData({ bookLists: res.data });
      wx.hideLoading();
    }).catch(err => {
      console.error('获取标签书单失败：', err);
      wx.hideLoading();
      wx.showToast({ title: '获取数据失败', icon: 'none' });
    });
  },

  goToBookList(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/booklistinfo/booklistinfo?id=${id}`
    });
  }
});
