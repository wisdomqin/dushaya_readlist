const app = getApp();

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
    // 模拟从API获取数据
    this.setData({
      tag: {
        name: tag,
        description: `与"${tag}"相关的精选书单合集。`
      },
      bookLists: [
        {id: 1, title: "2023年度最佳科幻小说", author: "科幻迷小王", rating: 9.2, ratingCount: 328},
        {id: 2, title: "经典科幻必读清单", author: "科幻评论家", rating: 9.5, ratingCount: 512},
        {id: 3, title: "硬科幻佳作选", author: "物理学爱好者", rating: 8.9, ratingCount: 246}
      ]
    });
  },

  goToBookList(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/booklistinfo/booklistinfo?id=${id}`
    });
  }
});