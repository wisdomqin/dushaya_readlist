import { gradeImages } from '../../config.js';

const app = getApp()

Page({
  data: {
    searchQuery: '',
    searchResults: [],
    gradeImages: gradeImages,
  },

  onSearch(e) {
    const query = e.detail.value;
    this.setData({ searchQuery: query });
    this.performSearch(query);
  },

  onSearchConfirm(e) {
    const query = e.detail.value;
    this.performSearch(query);
  },

  performSearch(query) {
    if (!query) {
      this.setData({ searchResults: [] });
      return;
    }

    const db = wx.cloud.database();
    const _ = db.command;
    const regExp = db.RegExp({
      regexp: query,
      options: 'i'
    });

    db.collection('bookLists').where(_.or([
      { author: regExp },
      { bookListContent: regExp },
      { description: regExp },
      { tags: regExp },
      { review: regExp },
      { title: regExp }
    ])).get().then(res => {
      const results = res.data.map(item => {
        return {
          ...item,
          highlightedTitle: this.highlightText(item.title, query),
          highlightedAuthor: this.highlightText(item.author, query),
          highlightedDescription: this.highlightText(item.description, query),
          highlightedReview: this.highlightText(item.review, query),
          highlightedTags: item.tags.map(tag => this.highlightText(tag, query))
        };
      });
      this.setData({ searchResults: results });
    }).catch(err => {
      console.error('搜索失败：', err);
    });
  },

  highlightText(text, query) {
    if (!text) return '';
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? `<span class="highlight">${part}</span>` 
        : part
    ).join('');
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/booklistinfo/booklistinfo?id=${id}`
    });
  },

  onShareAppMessage: function () {
    return {
      title: '搜索书单',
      path: '/pages/search/search',
      imageUrl: '/path/to/share/image.jpg' // 可选，自定义分享图片
    }
  },

  onShareTimeline: function () {
    return {
      title: '搜索精彩书单',
      query: '',
      imageUrl: '/path/to/share/image.jpg' // 可选，自定义分享图片
    }
  }
});
