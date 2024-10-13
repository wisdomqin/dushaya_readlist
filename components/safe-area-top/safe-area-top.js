// components/safe-area-top/safe-area-top.js
const app = getApp();

Component({
  data: {
    height: 0
  },
  attached() {
    this.setData({
      height: app.globalData.statusBarHeight + app.globalData.navBarHeight
    });
  }
});