const store = require('../../utils/store');

Page({
  data: {
    days: [],
    weekTotal: 0,
    weekAvg: 0,
    groups: [],
    goal: store.DEFAULT_GOAL,
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const raw = store.lastDays(7);
    const max = Math.max(1, ...raw.map(d => d.total));
    const days = raw.map(d => ({
      key: d.key,
      label: d.label,
      total: d.total,
      isToday: d.isToday,
      // 有记录就至少给 8% 高度，否则 50ml 的柱子会看不见
      height: d.total === 0 ? 2 : Math.max(8, Math.round((d.total / max) * 100)),
    }));
    const weekTotal = days.reduce((sum, d) => sum + d.total, 0);

    this.setData({
      days,
      weekTotal,
      weekAvg: Math.round(weekTotal / 7),
      groups: store.grouped(14),
      goal: store.getGoal(),
    });
  },

  // 删除入口放在点击里，而不是左滑：左滑要额外写一套手势，
  // 三页示例不值得为它增加复杂度。真实项目里左滑更好，但要自己实现。
  onItemTap(e) {
    const { id, amount } = e.currentTarget.dataset;
    wx.showActionSheet({
      itemList: ['删除这条记录'],
      itemColor: '#EE0A24',
      success: res => {
        if (res.tapIndex !== 0) return;
        wx.showModal({
          title: '删除 ' + amount + ' ml？',
          content: '删了就没了，不能恢复。',
          confirmText: '删除',
          confirmColor: '#EE0A24',
          success: r => {
            if (!r.confirm) return;
            store.remove(Number(id));
            this.refresh();
          },
        });
      },
    });
  },
});
