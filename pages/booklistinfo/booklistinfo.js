const app = getApp();

Page({
  data: {
    safeAreaTopHeight: 0,
    bookDetail: {},
    authorAvatar: '',
    isRatingModalVisible: false,
    comments: [],
    localRating: 0,
    localRatingCount: 0,
    isLoading: true,
  },

  onLoad(options) {
    this.setData({
      safeAreaTopHeight: app.globalData.statusBarHeight + app.globalData.navBarHeight
    });

    const id = options.id;
    this.bookListId = id;
    this.loadBookListData(id);
  },

  onShow() {
    if (this.bookListId) {
      this.loadBookListData(this.bookListId);
    }
  },

  loadBookListData(id) {
    console.log('加载书单数据，ID:', id);
    this.getBookDetail(id, true).then(() => {
      return this.getComments(id);
    }).catch(err => {
      console.error('加载页面数据失败：', err);
    });
  },

  getBookDetail(id, forceRefresh = false) {
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });

    const db = wx.cloud.database();
    return db.collection('bookLists').doc(id).get().then(res => {
      const bookDetail = res.data;
      console.log('获取到的书单详情:', bookDetail);
      
      // 从地缓存获取评分数据
      const localData = wx.getStorageSync(`bookList_${id}`);
      const localRating = localData ? localData.rating : (bookDetail.rating || 0);
      const localRatingCount = localData ? localData.ratingCount : (bookDetail.ratingCount || 0);
      
      console.log('本地缓存数据:', localData);
      console.log('设置的评分:', localRating);
      console.log('设置的评分人数:', localRatingCount);

      const authorAvatar = this.generateAuthorAvatar(bookDetail.author);
      
      this.setData({
        bookDetail,
        authorAvatar,
        localRating,
        localRatingCount,
        isLoading: false
      });
      wx.hideLoading();
      return bookDetail;
    }).catch(err => {
      console.error('获取书单详情失败：', err);
      this.setData({ isLoading: false });
      wx.hideLoading();
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      throw err;
    });
  },

  getComments(bookListId) {
    const db = wx.cloud.database();
    db.collection('comments').where({
      bookListId: bookListId
    }).get().then(res => {
      this.setData({ comments: res.data });
    }).catch(err => {
      console.error('获取评论失败：', err);
    });
  },

  generateAuthorAvatar(authorName) {
    const hue = this.getHashOfString(authorName) % 360;
    const gradient = `linear-gradient(135deg, hsl(${hue}, 100%, 70%), hsl(${(hue + 40) % 360}, 100%, 50%))`;
    return gradient;
  },

  getHashOfString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  },

  goToTag(e) {
    const tag = e.currentTarget.dataset.tag;
    wx.navigateTo({
      url: `/pages/booklistlabel/booklistlabel?tag=${tag}`
    });
  },

  goToAuthor() {
    if (this.data.bookDetail.author) {
      wx.navigateTo({
        url: `/pages/booklistauthor/booklistauthor?author=${encodeURIComponent(this.data.bookDetail.author)}`
      });
    } else {
      console.error('作者信息不可用:', this.data.bookDetail);
      wx.showToast({
        title: '作者信息不可用',
        icon: 'none'
      });
    }
  },

  goToSource() {
    const sourceUrl = this.data.bookDetail.url;
    if (sourceUrl) {
      wx.setClipboardData({
        data: sourceUrl,
        success: () => {
          wx.showModal({
            title: '链接已复制',
            content: '由于小程序限制，链接已复制到剪贴板。请在浏览器中粘贴并访问。',
            showCancel: false,
            confirmText: '知道了'
          });
        },
        fail: () => {
          wx.showToast({
            title: '复制链接失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    } else {
      wx.showToast({
        title: '源地址不可用',
        icon: 'none',
        duration: 2000
      });
    }
  },

  showRatingModal() {
    this.setData({ isRatingModalVisible: true });
  },

  hideRatingModal() {
    this.setData({ isRatingModalVisible: false });
  },

  submitRating(e) {
    const { rating, comment } = e.detail;
    const db = wx.cloud.database();
    
    wx.showLoading({ title: '提交中...' });
    
    db.collection('comments').add({
      data: {
        bookListId: this.data.bookDetail._id,
        author: 'Anonymous', // 可以替换为实际用户名
        rating: rating,
        content: comment,
        createdAt: db.serverDate()
      }
    }).then(() => {
      this.hideRatingModal();
      return this.updateBookListRating(rating);
    }).then(() => {
      console.log('评分更新完成，刷新页面显示');
      return this.getComments(this.data.bookDetail._id);
    }).then(() => {
      return this.getBookDetail(this.data.bookDetail._id, true);
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '评分成功', icon: 'success' });
    }).catch(err => {
      console.error('提交评分失败：', err);
      wx.hideLoading();
      wx.showToast({ title: '评分失败，请重试', icon: 'none' });
    });
  },

  updateBookListRating(newRating) {
    const db = wx.cloud.database();
    
    console.log('开始更新书单评分');
    
    // 更新本地数据
    const currentRating = this.data.localRating || 0;
    const currentCount = this.data.localRatingCount || 0;
    const newCount = currentCount + 1;
    const newAverageRating = ((currentRating * currentCount + newRating) / newCount).toFixed(1);
    
    const localData = {
      rating: parseFloat(newAverageRating),
      ratingCount: newCount
    };
    
    // 保存到本地缓存
    wx.setStorageSync(`bookList_${this.data.bookDetail._id}`, localData);
    
    this.setData({
      localRating: localData.rating,
      localRatingCount: localData.ratingCount
    });
    
    console.log('更新后的本地评分数据:', this.data.localRating, this.data.localRatingCount);
    
    return db.collection('bookLists').doc(this.data.bookDetail._id).update({
      data: {
        rating: localData.rating,
        ratingCount: localData.ratingCount
      }
    }).then((updateResult) => {
      console.log('更新书单评分成功:', updateResult);
    }).catch(err => {
      console.error('更新书单评分失败：', err);
      throw err;
    });
  },

  onUnload() {
    // 页面卸载时不清除本地缓存
    // wx.removeStorageSync(`bookList_${this.bookListId}`);
  }
});
