const app = getApp();

// index.js
Page({
    data: {
      safeAreaTopHeight: 0,
      bookLists: [
        {
          id: 1,
          title: "2023年度最佳科幻小说",
          author: "科幻迷小王",
          description: "本书单收录了2023年最值得一读的科幻作品，涵盖硬科幻、软科幻等多个子类型。",
          duckReview: "这些所谓的'最佳'科幻,究竟是预言还是警告?也许未来的我们会笑着回忆今天的天真。",
          rating: 9.2,
          ratingCount: 328
        },
        {
          id: 2,
          title: "经典文学必读清单",
          author: "文学评论家老张",
          description: "精选世界文学经典作品，带你领略不同时代的文学魅力。",
          duckReview: "所谓经典,不过是一代代人的共同幻觉。但谁能说,这幻觉不值得一试?",
          rating: 9.5,
          ratingCount: 512
        },
        {
          id: 3,
          title: "年度励志畅销书榜单",
          author: "成功学大师王老师",
          description: "汇集年度最受欢迎的励志书籍，助你成为人生赢家。",
          duckReview: "又一批教你如何成功的书。真正的秘诀?大概是别把时间都花在看这些书上。",
          rating: 8.7,
          ratingCount: 246
        },
        {
          id: 4,
          title: "烹饪入门书籍推荐",
          author: "美食博主小李",
          description: "为初学者精心挑选的烹饪书籍，从零开始学做菜。",
          duckReview: "这些书能让你的厨房充满美食的香气,还是烟雾报警器的尖叫?只有试过才知道。",
          rating: 9.0,
          ratingCount: 189
        },
        {
          id: 5,
          title: "2023年最佳悬疑推理小说",
          author: "推理迷大卫",
          description: "精选2023年最扣人心弦的悬疑推理作品，让你欲罢不能。",
          duckReview: "这些故事的最大悬疑,可能是为什么它们被称为'最佳'。不过,真相可能比小说更精彩。",
          rating: 9.3,
          ratingCount: 407
        }
      ]
    },

    onLoad() {
      this.setData({
        safeAreaTopHeight: app.globalData.statusBarHeight + app.globalData.navBarHeight
      });
      // 页面加载时的逻辑
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
    }
  });