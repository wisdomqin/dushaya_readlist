import { gradeImages } from '../../config.js';

const app = getApp()

Page({
    data: {
      bookLists: [],
      isRefreshing: false,
      allTags: [],
      randomTags: [],
      selectedTag: null,
      gradeImages: gradeImages,
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
      this.getRandomTags(); // 添加这行来刷新标签
    },

    getBookLists: function(tag = null) {
      console.log('开始获取书单数据');
      wx.showLoading({
        title: '加载中...',
      });

      const db = wx.cloud.database();
      let query = db.collection('bookLists').orderBy('createdAt', 'desc');

      if (tag) {
        query = query.where({
          tags: db.command.all([tag])
        });
      }

      query.limit(30).get().then(res => {
        console.log('获取书单数据成功:', res);
        if (res.data && res.data.length > 0) {
          const updatedBookLists = res.data.map(item => {
            const localData = wx.getStorageSync(`bookList_${item._id}`);
            if (localData) {
              item.rating = localData.rating;
              item.ratingCount = localData.ratingCount;
            }
            return item;
          });
          this.setData({
            bookLists: updatedBookLists
          });
        } else {
          console.log('获取到的书单数据为空');
        }
      }).catch(err => {
        console.error('获取书单失败：', err);
      }).finally(() => {
        wx.hideLoading();
        this.setData({ isRefreshing: false });
        wx.stopPullDownRefresh();
      });
    },

    getRandomTags: function() {
      const db = wx.cloud.database();
      db.collection('bookLists').field({
        tags: true
      }).get().then(res => {
        let allTags = [];
        res.data.forEach(item => {
          allTags = allTags.concat(item.tags);
        });
        allTags = [...new Set(allTags)]; // 去重
        const randomTags = this.getRandomElements(allTags, 3);
        this.setData({
          allTags,
          randomTags
        });
      }).catch(err => {
        console.error('获取标签失败：', err);
      });
    },

    getRandomElements: function(arr, count) {
      let shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
      while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
      }
      return shuffled.slice(min);
    },

    onTagTap: function(e) {
      const tag = e.currentTarget.dataset.tag;
      if (this.data.selectedTag === tag) {
        this.setData({ selectedTag: null });
        this.getBookLists();
      } else {
        this.setData({ selectedTag: tag });
        this.getBookLists(tag);
      }
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
      this.getRandomTags();
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
    },

    goToSearch() {
      wx.navigateTo({
        url: '/pages/search/search'
      });
    }
});
