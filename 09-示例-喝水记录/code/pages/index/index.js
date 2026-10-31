const store = require('../../utils/store');

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

Page({
  data: {
    todayLabel: '',
    total: 0,
    goal: store.DEFAULT_GOAL,
    percent: 0,
    hint: '',
    recent: [],
    streak: 0,
  },

  // 用 onShow 而不是 onLoad：从记录页删完回来，数字要立刻变
  onShow() {
    this.refresh();
  },

  refresh() {
    const total = store.todayTotal();
    const goal = store.getGoal();
    const percent = Math.min(100, Math.round((total / goal) * 100));

    const now = new Date();
    const todayLabel = (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日 ' + WEEK[now.getDay()];

    const recent = store.todayRecords().slice(0, 3).map(item => ({
      id: item.id,
      amount: item.amount,
      time: store.timeLabel(item.at),
      ago: agoText(item.at),
    }));

    this.setData({
      todayLabel,
      total,
      goal,
      percent,
      hint: hintText(total, goal),
      recent,
      streak: store.streak(),
    });
  },

  onAdd(e) {
    const amount = Number(e.currentTarget.dataset.amount);
    if (!amount) return;
    store.add(amount);
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
    this.refresh();
    wx.showToast({ title: '记下 ' + amount + ' ml', icon: 'none' });
  },

  // 撤销：只删最近一条，给一个反悔的机会。没有这个，用户点错就只能去记录页删
  onUndo() {
    const list = store.todayRecords();
    if (!list.length) return;
    const last = list[0];
    wx.showModal({
      title: '撤销上一条？',
      content: '会删掉 ' + store.timeLabel(last.at) + ' 记录的 ' + last.amount + ' ml',
      confirmText: '撤销',
      confirmColor: '#EE0A24',
      success: res => {
        if (!res.confirm) return;
        store.remove(last.id);
        this.refresh();
      },
    });
  },

  goHistory() {
    wx.switchTab({ url: '/pages/history/history' });
  },
});

function hintText(total, goal) {
  if (total === 0) return '还没开始，先来一杯。';
  if (total >= goal) return '今天达标了，别再硬灌。';
  const left = goal - total;
  if (left > goal / 2) return '今天还差 ' + left + ' ml，慢慢来。';
  return '快到了，还差 ' + left + ' ml。';
}

function agoText(ts) {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return min + ' 分钟前';
  return Math.floor(min / 60) + ' 小时前';
}
