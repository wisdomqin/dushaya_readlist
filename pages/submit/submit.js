Page({
  data: {
    url: '',
    bookData: null,
    showConfirmation: false,
    typingFields: ['review', 'title', 'author', 'description', 'tags', 'grade'],
    currentTypingField: '',
    typingIndex: 0,
    originalBookData: null,
    isSubmitting: false,
    isTypingComplete: false,
  },

  inputUrl(e) {
    console.log('输入的URL:', e.detail.value);
    this.setData({ url: e.detail.value });
  },

  // 步骤1：用户输入网址，点击提交按钮，使用云函数解析网址中的内容
  submitBookList(e) {
    if (!this.data.url) {
      wx.showToast({ title: '请输入网址', icon: 'none' });
      return;
    }

    console.log('开始调用云函数，URL:', this.data.url);
    wx.showLoading({ title: '处理中...' });

    wx.cloud.callFunction({
      name: 'processBookList',
      data: { url: this.data.url }
    }).then(res => {
      wx.hideLoading();
      console.log('云函数返回原始结果:', res);
      console.log('云函数返回的 result:', res.result);
      if (res.result.success) {
        console.log('准备设置数据:', res.result.data);
        this.setData({
          originalBookData: res.result.data,
          bookData: {
            review: res.result.data.review,
            title: '',
            author: '',
            description: '',
            tags: '',
            grade: res.result.data.grade,
            url: this.data.url  // 添加 URL
          },
          showConfirmation: true,
          isTypingComplete: false
        }, () => {
          console.log('数据设置完成，开始打字机效果');
          this.startTypingEffect();
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
      console.error('云函数调用失败:', err);
      wx.showModal({
        title: '错误',
        content: '处理失败，请稍后重试',
        showCancel: false
      });
    });
  },

  updateBookData(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    // 只允许更新可编辑字段
    if (['title', 'author', 'description', 'tags'].includes(field)) {
      this.setData({
        [`bookData.${field}`]: value
      });
    }
  },

  // 步骤2：拿到内容后用打字机的形式展示获取的内容
  startTypingEffect() {
    console.log('开始打字机效果');
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

      wx.vibrateShort({ type: 'medium' });

      const delay = Math.random() * 50 + 30;
      setTimeout(() => this.typeNextCharacter(), delay);
    } else {
      const nextFieldIndex = typingFields.indexOf(currentTypingField) + 1;
      if (nextFieldIndex < typingFields.length) {
        this.setData({
          currentTypingField: typingFields[nextFieldIndex],
          typingIndex: 0
        });
        setTimeout(() => this.typeNextCharacter(), 500);
      } else {
        console.log('打字机效果完成');
        this.setData({ isTypingComplete: true });
      }
    }
  },

  // 步骤3：打字机完成后用户点击确认，检查重复并提交
  confirmSubmit() {
    if (!this.data.isTypingComplete) {
      wx.showToast({
        title: '请等待内容加载完成',
        icon: 'none'
      });
      return;
    }

    if (this.data.isSubmitting) return;
    this.setData({ isSubmitting: true });

    console.log('开始检查重复数据');
    wx.showLoading({ title: '检查中...' });
    
    const db = wx.cloud.database();
    
    db.collection('bookLists').where({
      title: this.data.bookData.title,
      author: this.data.bookData.author
    }).get().then(res => {
      wx.hideLoading();
      console.log('数据库查询结果:', res);
      if (res.data.length > 0) {
        console.log('检测到重复书单:', res.data);
        wx.showModal({
          title: '提示',
          content: '该书单已存在，请勿重复提交',
          showCancel: false
        });
        return; // 确保在检测到重复数据时，直接返回
      } else {
        console.log('未检测到重复书单，准备提交');
        this.submitToDatabase();
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('数据库查询失败:', err);
      wx.showModal({
        title: '错误',
        content: '检查失败，请稍后重试',
        showCancel: false
      });
    }).finally(() => {
      this.setData({ isSubmitting: false });
    });
  },

  submitToDatabase() {
    console.log('开始提交数据到数据库');
    wx.showLoading({ title: '提交中...' });
  
    const db = wx.cloud.database();
    db.collection('bookLists').add({
      data: {
        ...this.data.bookData,
        review: this.data.originalBookData.review,
        bookListContent: this.data.originalBookData.bookListContent,
        url: this.data.url,  // 添加 URL 字段
        createdAt: db.serverDate(),
      }
    }).then(() => {
      wx.hideLoading();
      console.log('数据提交成功');
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 1500
      });
      setTimeout(() => {
        wx.navigateBack({
          delta: 1
        });
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      console.error('数据提交失败:', err);
      wx.showModal({
        title: '错误',
        content: '提交失败，请稍后重试',
        showCancel: false
      });
    });
  },


  cancelSubmit() {
    console.log('取消提交');
    this.setData({
      showConfirmation: false,
      bookData: null,
      originalBookData: null,
      url: ''
    });
    wx.navigateBack({
      delta: 1
    });
  },
});
