const app = getApp();

Page({
  data: {
    safeAreaTopHeight: 0,
    author: {},
    bookLists: []
  },
  onLoad(options) {
    this.setData({
      safeAreaTopHeight: app.globalData.statusBarHeight + app.globalData.navBarHeight
    });

    const id = options.id;
    // 模拟从API获取数据
    this.setData({
      author: {
        id: id,
        name: "科幻迷小王",
        avatar: "/images/default-avatar.png",
        bio: "资深科幻爱好者,喜欢探索未来世界的无限可能。"
      },
      bookLists: [
        {id: 1, title: "2023年度最佳科幻小说", rating: 9.2, ratingCount: 328},
        {id: 2, title: "经典科幻必读清单", rating: 9.5, ratingCount: 512},
        {id: 3, title: "硬科幻佳作选", rating: 8.9, ratingCount: 246}
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