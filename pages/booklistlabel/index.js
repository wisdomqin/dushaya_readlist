Page({
  data: {
    tag: {},
    bookLists: []
  },
  onLoad(options) {
    const tag = options.tag;
    this.getTagDetail(tag);
    this.getTagBookLists(tag);
  },
  getTagDetail(tag) {
    // TODO: 从API获取标签详情
  },
  getTagBookLists(tag) {
    // TODO: 从API获取标签相关书单
  }
});