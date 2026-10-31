const store = require('../../utils/store');

Page({
  data: {
    goal: store.DEFAULT_GOAL,
    reminder: false,
    count: 0,
    days: 0,
    since: '',
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const s = store.stats();
    this.setData({
      goal: store.getGoal(),
      count: s.count,
      days: s.days,
      since: s.since,
    });
  },

  onGoalChange(e) {
    const goal = store.setGoal(e.detail.value);
    this.setData({ goal });
    wx.showToast({ title: '目标改成 ' + goal + ' ml', icon: 'none' });
  },

  // 提醒功能故意只做了开关，没有接订阅消息。
  // 真实的订阅消息要在阶段 6 申请模板、拿模板 ID、用户每次授权一次只能推一条，
  // 示例里做半套反而会让人以为「开了就能收到」。
  onReminderChange(e) {
    const on = e.detail.value;
    this.setData({ reminder: on });
    wx.showToast({
      title: on ? '示例未接订阅消息，仅演示开关' : '已关闭',
      icon: 'none',
    });
  },

  onClear() {
    wx.showModal({
      title: '清空全部记录？',
      content: '共 ' + this.data.count + ' 条，删掉不能恢复。',
      confirmText: '清空',
      confirmColor: '#EE0A24',
      success: res => {
        if (!res.confirm) return;
        store.clear();
        this.refresh();
        wx.showToast({ title: '已清空', icon: 'none' });
      },
    });
  },

  onAbout() {
    wx.showModal({
      title: '关于这个示例',
      content: '小程序开工包 v2.3 的示例项目。三页、零依赖、数据存本机。\n\n它只用来记录喝水，不构成任何医疗或健康建议。',
      showCancel: false,
    });
  },
});
