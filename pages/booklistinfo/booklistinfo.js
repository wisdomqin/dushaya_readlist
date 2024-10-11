const app = getApp();

Page({
  data: {
    safeAreaTopHeight: 0,
    bookDetail: {},
    authorAvatar: ''
  },

  onLoad(options) {
    this.setData({
      safeAreaTopHeight: app.globalData.statusBarHeight + app.globalData.navBarHeight
    });

    const id = options.id;
    this.getBookDetail(id);
  },

  getBookDetail(id) {
    wx.showLoading({
      title: '加载中...',
    });

    const db = wx.cloud.database();
    db.collection('bookLists').doc(id).get().then(res => {
      const bookDetail = res.data;
      const authorAvatar = this.generateAuthorAvatar(bookDetail.author);
      this.setData({
        bookDetail,
        authorAvatar
      });
      wx.hideLoading();
    }).catch(err => {
      console.error('获取书单详情失败：', err);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
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
    wx.navigateTo({
      url: `/pages/booklistauthor/booklistauthor?id=${this.data.bookDetail.authorId}`
    });
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
            confirmText: '我知道了'
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
    // TODO: 显示评分弹窗
  }
});