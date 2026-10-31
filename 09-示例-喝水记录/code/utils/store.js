/**
 * 数据层：一个文件管所有读写。
 *
 * 为什么单独抽出来：
 * 1. 页面里不出现 wx.getStorageSync，将来换云开发只改这里；
 * 2. 时间格式、分组、连续天数这些逻辑有唯一实现，不会三个页面各写一遍；
 * 3. 出错（存储异常、数据被手改坏）时统一降级成空数组，页面不会白屏。
 *
 * 换成云开发的做法：把这六个函数改成调云函数，页面代码完全不用动。
 * 详见 README 的「怎么换成云开发」。
 */

const RECORD_KEY = 'water_records_v1';
const GOAL_KEY = 'water_goal_v1';
const DEFAULT_GOAL = 1500;
const MAX_RECORDS = 800;

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

/** 本地日期键：2026-10-31。不能用 toISOString，那是 UTC，会差 8 小时。 */
function dateKey(date) {
  const d = date || new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function timeLabel(ts) {
  const d = new Date(ts);
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function agoLabel(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return min + ' 分钟前';
  const hour = Math.floor(min / 60);
  if (hour < 24) return hour + ' 小时前';
  return Math.floor(hour / 24) + ' 天前';
}

function readAll() {
  try {
    const list = wx.getStorageSync(RECORD_KEY);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('[store] 读取失败，降级为空列表', e);
    return [];
  }
}

function writeAll(list) {
  try {
    wx.setStorageSync(RECORD_KEY, list.slice(0, MAX_RECORDS));
    return true;
  } catch (e) {
    console.error('[store] 写入失败', e);
    wx.showToast({ title: '保存失败，存储空间可能满了', icon: 'none' });
    return false;
  }
}

function add(amount) {
  const value = Math.max(1, Math.round(Number(amount) || 0));
  const record = { id: Date.now(), amount: value, at: Date.now() };
  const list = readAll();
  list.unshift(record);
  writeAll(list);
  return record;
}

function remove(id) {
  const list = readAll().filter(item => item.id !== id);
  writeAll(list);
}

function clear() {
  try {
    wx.removeStorageSync(RECORD_KEY);
  } catch (e) {
    console.error('[store] 清空失败', e);
  }
}

function todayRecords() {
  const key = dateKey();
  return readAll().filter(item => dateKey(new Date(item.at)) === key);
}

function todayTotal() {
  return todayRecords().reduce((sum, item) => sum + item.amount, 0);
}

function getGoal() {
  try {
    const v = Number(wx.getStorageSync(GOAL_KEY));
    return v >= 500 && v <= 4000 ? v : DEFAULT_GOAL;
  } catch (e) {
    return DEFAULT_GOAL;
  }
}

function setGoal(value) {
  const v = Math.min(4000, Math.max(500, Math.round(Number(value) / 50) * 50));
  try {
    wx.setStorageSync(GOAL_KEY, v);
  } catch (e) {
    console.error('[store] 保存目标失败', e);
  }
  return v;
}

/** 最近 n 天，从最早到最晚，给柱状图用 */
function lastDays(n) {
  const all = readAll();
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = dateKey(d);
    const total = all
      .filter(item => dateKey(new Date(item.at)) === key)
      .reduce((sum, item) => sum + item.amount, 0);
    out.push({
      key,
      label: (d.getMonth() + 1) + '/' + d.getDate(),
      total,
      isToday: i === 0,
    });
  }
  return out;
}

/** 按天分组，最近的在前 */
function grouped(limitDays) {
  const all = readAll();
  const map = {};
  const order = [];
  for (const item of all) {
    const key = dateKey(new Date(item.at));
    if (!map[key]) {
      map[key] = { key, total: 0, items: [] };
      order.push(key);
    }
    map[key].total += item.amount;
    map[key].items.push({
      id: item.id,
      amount: item.amount,
      time: timeLabel(item.at),
      ago: agoLabel(item.at),
    });
  }
  const todayKey = dateKey();
  const yesterdayKey = dateKey(new Date(Date.now() - 86400000));
  return order.slice(0, limitDays || 14).map(key => {
    const g = map[key];
    g.label = key === todayKey ? '今天' : key === yesterdayKey ? '昨天' : key.slice(5).replace('-', ' 月 ') + ' 日';
    return g;
  });
}

/** 连续记录天数：从今天（或昨天）往前数，断一天就停 */
function streak() {
  const all = readAll();
  const days = {};
  for (const item of all) days[dateKey(new Date(item.at))] = true;

  let count = 0;
  const cursor = new Date();
  if (!days[dateKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days[dateKey(cursor)]) return 0;
  }
  while (days[dateKey(cursor)]) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

/** 汇总：总条数、有记录的天数、最早一天的日期 */
function stats() {
  const all = readAll();
  const days = {};
  for (const item of all) days[dateKey(new Date(item.at))] = true;
  const earliest = all.length ? all[all.length - 1].at : 0;
  return {
    count: all.length,
    days: Object.keys(days).length,
    since: earliest ? dateKey(new Date(earliest)) : '',
  };
}

module.exports = {
  DEFAULT_GOAL,
  dateKey,
  timeLabel,
  add,
  remove,
  clear,
  todayRecords,
  todayTotal,
  getGoal,
  setGoal,
  lastDays,
  grouped,
  streak,
  stats,
};
