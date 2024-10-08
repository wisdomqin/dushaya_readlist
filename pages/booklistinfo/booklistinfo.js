const app = getApp();

Page({
  data: {
    safeAreaTopHeight: 0,
    bookDetail: {}
  },

  onLoad(options) {
    this.setData({
      safeAreaTopHeight: app.globalData.statusBarHeight + app.globalData.navBarHeight
    });

    const id = options.id;
    // 模拟从API获取数据
    this.setData({
      bookDetail: {
        id: id,
        title: "2023年度最佳科幻小说",
        author: "科幻迷小王",
        authorId: "author123",
        description: "本年度最值得一读的科幻作品集锦，涵盖了硬科幻、软科幻、赛博朋克等多个子类型。",
        tags: ["科幻", "2023", "小说"],
        rating: 9.2,
        ratingCount: 328,
        review: "这份书单汇集了2023年最优秀的科幻作品,每一本都值得一读。从宏大的太空歌剧到深刻的人性探讨，应有尽有。"
      }
    });
  },

  goToTag(e) {
    const tag = e.currentTarget.dataset.tag;
    wx.navigateTo({
      url: `/pages/booklistlabel/booklistlabel?tag=${tag}`
    });
  },

  goToAuthor() {
    wx.navigateTo({
      url: `/pages/booklistauthor/booklistauthor?id=${this.data.bookDetail.authorId}`
    });
  },

  goToSource() {
    // TODO: 跳转到源地址
  },

  showRatingModal() {
    // TODO: 显示评分弹窗
  }
});