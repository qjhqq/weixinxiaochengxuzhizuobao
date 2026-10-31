# 设计 token

> 阶段 2 的产出物之一。**定一次，写进 `app.wxss`，全项目照抄。**
> 本项目红线：不用 CSS 变量（`var(--x)` 在 WXSS 里风险高，一旦失效整页样式全丢），
> 全部写字面值，靠这一页统一口径。

---

## 一、尺寸基准

- 设计稿宽度按 **750rpx**，1rpx = 屏宽/750
- 所有数值取 **4 的倍数**，间距取 **8 的倍数**
- 逻辑像素换算：`1px ≈ 2rpx`

---

## 二、字号阶梯

只用这 6 档，不要发明第 7 档。

| 级别 | 字号 | 行高 | 字重 | 用途 |
|---|---|---|---|---|
| `t-display` | 52rpx | 1.25 | 700 | 金额、核心数字、结果页大标题 |
| `t-title` | 40rpx | 1.3 | 600 | 页面内主标题 |
| `t-subtitle` | 36rpx | 1.35 | 600 | 卡片标题、列表主信息 |
| `t-body` | 28rpx | 1.55 | 400 | 正文、列表描述（**最小值**） |
| `t-caption` | 24rpx | 1.5 | 400 | 辅助说明、时间戳、标签 |
| `t-mini` | 20rpx | 1.4 | 400 | 角标、仅限非关键信息 |

医疗 / 政务 / 中老年品类：`t-body` 提到 32rpx，`t-caption` 提到 26rpx。

---

## 三、间距

| token | 值 | 用途 |
|---|---|---|
| `s-1` | 8rpx | 图标与文字之间 |
| `s-2` | 16rpx | 行内元素间距、标签内边距 |
| `s-3` | 24rpx | 卡片之间、列表行上下 |
| `s-4` | 32rpx | **页面左右边距**、卡片内边距 |
| `s-5` | 48rpx | 区块之间 |
| `s-6` | 64rpx | 大区块、页面顶部留白 |

铁律：**页面左右边距永远是 32rpx**。任何页面都不要出现 20 / 25 / 30。

---

## 四、圆角

只有三档：

| 用途 | 值 |
|---|---|
| 图片、输入框、小标签 | 12rpx |
| 卡片、弹层、按钮 | 16rpx |
| 头像、胶囊、圆形按钮 | 999rpx |

---

## 五、阴影与描边

二选一，不要叠加：

```css
/* 有浮起感的元素（卡片、底部栏） */
box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);

/* 贴地的元素（列表分组、表格） */
border: 1rpx solid #EDEDED;

/* 强调浮起（弹窗、浮层） */
box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.10);
```

---

## 六、颜色

### 中性色（所有项目通用）

| 用途 | 值 |
|---|---|
| 页面背景 | `#F5F6F8` |
| 卡片 / 内容区背景 | `#FFFFFF` |
| 主文字 | `#1A1A1A` |
| 次文字 | `#5A5A5A` |
| 辅助文字 | `#8A8A8A` |
| 占位符 | `#B0B0B0` |
| 分割线 | `#EDEDED` |
| 遮罩 | `rgba(0,0,0,0.5)` |

注意 `#F5F6F8` 不是纯灰，带一点点冷调，比 `#F5F5F5` 干净。
纯白卡片落在 `#F5F6F8` 上才有层次，两个都白就糊成一片。

### 功能色

| 语义 | 值 | 说明 |
|---|---|---|
| 成功 / 通过 | `#07C160` | 微信绿，做品牌色也可直接用 |
| 警告 | `#FF976A` | 待处理、即将过期 |
| 危险 / 删除 | `#EE0A24` | 只在破坏性操作上出现 |
| 信息 | `#1989FA` | 提示、链接 |
| 禁用 | `#C8C8C8` 底 + `#FFF` 字 | |

---

## 七、导航与安全区

| 项 | 值 |
|---|---|
| 系统导航栏高度 | 44px（iPhone）/ 48px（部分安卓） |
| 状态栏高度 | 20px（iPhone 刘海屏 44px） |
| tabBar 高度 | 50px + 安全区 |
| 底部固定栏内容高度 | 100rpx |
| 安全区 | `env(safe-area-inset-bottom)` |

自定义导航栏必须自己算状态栏高度，否则顶部内容会被刘海遮住：

```js
// app.js —— 只在 navigationStyle: custom 时需要
const info = wx.getWindowInfo()
this.globalData.statusBarHeight = info.statusBarHeight
this.globalData.navBarHeight = 44
```

```css
.nav-bar { height: 88rpx; padding-top: 0; }  /* 88rpx ≈ 44px */
```

**默认不要用自定义导航栏。** 只有三种情况值得：
顶部要放搜索框、顶部要放品牌视觉、页面是沉浸式（地图、视频、商品大图）。

---

## 八、直接抄进 app.wxss 的基础块

```css
/* ============ 基础重置 ============ */
page {
  background: #F5F6F8;
  color: #1A1A1A;
  font-size: 28rpx;
  line-height: 1.55;
  font-family: -apple-system, "PingFang SC", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
}

view, text, scroll-view { box-sizing: border-box; }

/* ============ 排版 ============ */
.t-display  { font-size:52rpx; line-height:1.25; font-weight:700; }
.t-title    { font-size:40rpx; line-height:1.3;  font-weight:600; }
.t-subtitle { font-size:36rpx; line-height:1.35; font-weight:600; }
.t-body     { font-size:28rpx; line-height:1.55; }
.t-caption  { font-size:24rpx; line-height:1.5;  color:#8A8A8A; }
.t-mini     { font-size:20rpx; line-height:1.4;  color:#8A8A8A; }

.c-main  { color:#1A1A1A; }
.c-sub   { color:#5A5A5A; }
.c-hint  { color:#8A8A8A; }
.c-brand { color:#07C160; }
.c-danger{ color:#EE0A24; }

.ellipsis { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ellipsis-2 {
  display:-webkit-box; -webkit-box-orient:vertical;
  -webkit-line-clamp:2; overflow:hidden;
}

/* ============ 布局 ============ */
.row     { display:flex; align-items:center; }
.row-sb  { display:flex; align-items:center; justify-content:space-between; }
.col     { display:flex; flex-direction:column; }
.flex-1  { flex:1; min-width:0; }   /* min-width:0 是省略号生效的关键 */
.gap-8   { gap:8rpx; }
.gap-16  { gap:16rpx; }
.gap-24  { gap:24rpx; }

.page-pad { padding:0 32rpx; }      /* 页面左右边距，统一用它 */

/* ============ 卡片 ============ */
.card {
  background:#fff;
  border-radius:16rpx;
  padding:32rpx;
  box-shadow:0 4rpx 16rpx rgba(0,0,0,0.06);
}
.card + .card { margin-top:24rpx; }

/* ============ 按钮 ============ */
.btn-primary {
  height:88rpx;
  line-height:88rpx;
  text-align:center;
  border-radius:16rpx;
  background:#07C160;
  color:#fff;
  font-size:32rpx;
  font-weight:500;
}
.btn-primary.is-disabled { background:#C8C8C8; color:#fff; }
.btn-primary--active { opacity:.85; }

.btn-secondary {
  height:88rpx;
  line-height:88rpx;
  text-align:center;
  border-radius:16rpx;
  background:#fff;
  color:#07C160;
  border:1rpx solid #07C160;
  font-size:32rpx;
}

/* 微信原生 button 要去掉默认边框和背景 */
button::after { border:none; }

/* ============ 底部固定栏 ============ */
.footer-bar {
  position:fixed;
  left:0; right:0; bottom:0;
  padding:16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  background:#fff;
  border-top:1rpx solid #EDEDED;
  z-index:100;
}
/* 有底部栏的页面，滚动区要留出等高的 padding-bottom */
.has-footer { padding-bottom:200rpx; }
```

---

## 九、层级 z-index

不要出现 9999。只有四层：

| 层 | z-index | 内容 |
|---|---|---|
| 内容 | 0 | 正常流 |
| 吸顶 / 悬浮按钮 | 10 | 悬浮客服、回到顶部 |
| 底部固定栏 | 100 | 主操作栏、tabBar |
| 弹层 / 遮罩 | 1000 | 弹窗、半屏面板、toast |

---

## 十、检查

写完 `app.wxss` 后，`node 04-工具/check.js .` 会检查：

- 是否用了 `var(--x)`
- 是否有 `page` 类被误用到非沉浸式页面
- 图片是否超过 300KB

数值统一、层级干净，后面 20 个页面的成本会降一半。
