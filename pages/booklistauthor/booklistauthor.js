const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    safeAreaTopHeight: 0,
    author: '',
    bookLists: []
  },
  onLoad(options) {
    this.setData({
      safeAreaTopHeight: app.globalData.statusBarHeight + app.globalData.navBarHeight
    });

    const author = decodeURIComponent(options.author);
    console.log('接收到的作者名称:', author);
    if (!author) {
      console.error('作者名称未传递');
      wx.showToast({
        title: '作者信息不可用',
        icon: 'none'
      });
      return;
    }
    this.setData({ author: author });
    this.fetchAuthorBookLists(author);
  },

  fetchAuthorBookLists(author) {
    wx.showLoading({ title: '加载中...' });
    
    console.log('开始获取作者书单，作者名称:', author);
    db.collection('bookLists').where({
      author: author
    }).get().then(res => {
      console.log('获取到的作者书单:', res.data);
      if (res.data.length > 0) {
        this.setData({ 
          bookLists: res.data
        });
      } else {
        console.log('该作者没有书单');
      }
      wx.hideLoading();
    }).catch(err => {
      console.error('获取作者书单失败：', err);
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
