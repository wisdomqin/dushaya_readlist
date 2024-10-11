const app = getApp();

Page({
  data: {
    url: '',
    bookData: null,
    showConfirmation: false,
    typingFields: ['title', 'author', 'description', 'tags'],
    currentTypingField: '',
    typingIndex: 0,
    originalBookData: null  // 添加这行来保存原始数据
  },

  inputUrl(e) {
    this.setData({
      url: e.detail.value
    });
  },

  submitBookList() {
    if (!this.data.url.trim()) {
      wx.showToast({
        title: '请输入书单网址',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '处理中...',
    });

    wx.cloud.callFunction({
      name: 'processBookList',
      data: {
        url: this.data.url
      },
      timeout: 60000 // 设置 60 秒超时
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        this.setData({
          originalBookData: res.result.data,
          bookData: {
            title: '',
            author: '',
            description: '',
            tags: '',
            bookListContent: res.result.data.bookListContent // 新增字段
          },
          showConfirmation: true
        }, () => {
          this.startTypingEffect(); // 开始打字机效果
        });
      } else {
        wx.showModal({
          title: '提示',
          content: res.result.message,
          showCancel: false
        });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showModal({
        title: '错误',
        content: '处理异常,请稍后重试或换其他网址重试',
        showCancel: false
      });
      console.error(err);
    });
  },

  startTypingEffect() {
    this.setData({
      currentTypingField: this.data.typingFields[0],
      typingIndex: 0
    });
    this.typeNextCharacter();
  },

  typeNextCharacter() {
    const { currentTypingField, typingIndex, originalBookData, typingFields } = this.data;
    const fieldContent = originalBookData[currentTypingField];

    if (typingIndex < fieldContent.length) {
      this.setData({
        [`bookData.${currentTypingField}`]: fieldContent.slice(0, typingIndex + 1),
        typingIndex: typingIndex + 1
      });

      // 触发短震动
      wx.vibrateShort({
        type: 'medium' // 适中的震动强度
      });

      // 随机延迟，模拟真实打字节奏
      const delay = Math.random() * 50 + 30; // 30-80ms 的随机延迟
      setTimeout(() => this.typeNextCharacter(), delay);
    } else {
      const nextFieldIndex = typingFields.indexOf(currentTypingField) + 1;
      if (nextFieldIndex < typingFields.length) {
        this.setData({
          currentTypingField: typingFields[nextFieldIndex],
          typingIndex: 0
        });
        setTimeout(() => this.typeNextCharacter(), 500);
      }
    }
  },

  updateBookData(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`bookData.${field}`]: e.detail.value
    });
  },

  confirmSubmit() {
    wx.showLoading({
      title: '提交中...',
    });
    
    const db = wx.cloud.database();
    db.collection('bookLists').add({
      data: {
        ...this.data.bookData,
        bookListContent: this.data.originalBookData.bookListContent // 确保保存书单内容
      }
    }).then(res => {
      wx.hideLoading();
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showModal({
        title: '错误',
        content: '提交失败，请稍后重试',
        showCancel: false
      });
      console.error(err);
    });
  },

  cancelSubmit() {
    this.setData({
      showConfirmation: false,
      bookData: null,
      originalBookData: null,
      url: ''
    });
  }
});