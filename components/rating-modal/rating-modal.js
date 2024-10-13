
Component({
  properties: {
    isVisible: {
      type: Boolean,
      value: false
    }
  },
  data: {
    rating: 5,
    comment: ''
  },
  methods: {
    onRatingChange(e) {
      this.setData({ rating: e.detail.value });
    },
    onCommentInput(e) {
      this.setData({ comment: e.detail.value });
    },
    onCancel() {
      this.triggerEvent('cancel');
    },
    onConfirm() {
      this.triggerEvent('confirm', {
        rating: this.data.rating,
        comment: this.data.comment
      });
    }
  }
});