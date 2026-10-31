# 设计数值（速查版）

> 完整版在开工包的 `08-设计参考/`。这里只留**能直接抄进代码的数值**，
> 目的是手边没包时也能定出一套不廉价的样式。冲突时以完整版为准。

## 铁律

1. 设计稿宽度 **750rpx**，1rpx = 屏宽/750，`1px ≈ 2rpx`
2. 所有数值取 **4 的倍数**，间距取 **8 的倍数**
3. **不用 CSS 变量**（`var(--x)` 在 WXSS 里一旦失效整页样式全丢），全部写字面值
4. 页面左右边距**永远是 32rpx**，不许出现 20 / 25 / 30
5. 全站只有 **1 个主色**

---

## 字号（只有 6 档，不要发明第 7 档）

| 级别 | 字号 | 行高 | 字重 | 用途 |
|---|---|---|---|---|
| `t-display` | 52rpx | 1.25 | 700 | 金额、核心数字、结果页大标题 |
| `t-title` | 40rpx | 1.3 | 600 | 页面内主标题 |
| `t-subtitle` | 36rpx | 1.35 | 600 | 卡片标题、列表主信息 |
| `t-body` | 28rpx | 1.55 | 400 | 正文（**最小值**） |
| `t-caption` | 24rpx | 1.5 | 400 | 辅助说明、时间戳 |
| `t-mini` | 20rpx | 1.4 | 400 | 角标，仅限非关键信息 |

医疗 / 政务 / 中老年品类：`t-body` 提到 32rpx，`t-caption` 提到 26rpx。

## 间距

| token | 值 | 用途 |
|---|---|---|
| `s-1` | 8rpx | 图标与文字 |
| `s-2` | 16rpx | 行内元素、标签内边距 |
| `s-3` | 24rpx | 卡片之间、列表行上下 |
| `s-4` | 32rpx | **页面左右边距**、卡片内边距 |
| `s-5` | 48rpx | 区块之间 |
| `s-6` | 64rpx | 页面顶部留白 |

## 圆角（只有三档）

| 用途 | 值 |
|---|---|
| 图片、输入框、小标签 | 12rpx |
| 卡片、弹层、按钮 | 16rpx |
| 头像、胶囊、圆形按钮 | 999rpx |

## 阴影（二选一，不要叠加）

```css
box-shadow: 0 4rpx 16rpx rgba(0,0,0,.06);    /* 浮起：卡片、底部栏 */
border: 1rpx solid #EDEDED;                   /* 贴地：列表分组 */
box-shadow: 0 12rpx 40rpx rgba(0,0,0,.10);   /* 弹窗、浮层 */
```

## 颜色

**中性色**

| 用途 | 值 |
|---|---|
| 页面背景 | `#F5F6F8`（带一丝冷调，比 `#F5F5F5` 干净） |
| 卡片背景 | `#FFFFFF` |
| 主文字 | `#1A1A1A` |
| 次文字 | `#5A5A5A` |
| 辅助文字 | `#8A8A8A` |
| 占位符 | `#B0B0B0` |
| 分割线 | `#EDEDED` |
| 遮罩 | `rgba(0,0,0,.5)` |

**功能色**

| 语义 | 值 |
|---|---|
| 成功 / 主色 | `#07C160`（微信绿，可直接当品牌色） |
| 警告 | `#FF976A` |
| 危险 / 删除 | `#EE0A24`（只在破坏性操作上出现） |
| 信息 | `#1989FA` |
| 禁用 | `#C8C8C8` 底 + `#FFF` 字 |

## z-index（只有四层，不许出现 9999）

| 层 | 值 |
|---|---|
| 正常内容 | 0 |
| 吸顶 / 悬浮按钮 | 10 |
| 底部固定栏 | 100 |
| 弹层 / 遮罩 / toast | 1000 |

---

## 直接抄进 app.wxss 的基础块

```css
page {
  background:#F5F6F8; color:#1A1A1A; font-size:28rpx; line-height:1.55;
  font-family:-apple-system,"PingFang SC","Helvetica Neue",sans-serif;
  -webkit-font-smoothing:antialiased;
}
view, text, scroll-view { box-sizing:border-box; }

.t-display  { font-size:52rpx; line-height:1.25; font-weight:700; }
.t-title    { font-size:40rpx; line-height:1.3;  font-weight:600; }
.t-subtitle { font-size:36rpx; line-height:1.35; font-weight:600; }
.t-body     { font-size:28rpx; line-height:1.55; }
.t-caption  { font-size:24rpx; line-height:1.5;  color:#8A8A8A; }
.t-mini     { font-size:20rpx; line-height:1.4;  color:#8A8A8A; }

.c-main{color:#1A1A1A} .c-sub{color:#5A5A5A} .c-hint{color:#8A8A8A}
.c-brand{color:#07C160} .c-danger{color:#EE0A24}

.ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ellipsis-2{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}

.row{display:flex;align-items:center}
.row-sb{display:flex;align-items:center;justify-content:space-between}
.flex-1{flex:1;min-width:0}   /* min-width:0 是省略号生效的关键 */
.page-pad{padding:0 32rpx}

.card{background:#fff;border-radius:16rpx;padding:32rpx;box-shadow:0 4rpx 16rpx rgba(0,0,0,.06)}
.card + .card{margin-top:24rpx}

.btn-primary{height:88rpx;line-height:88rpx;text-align:center;border-radius:16rpx;
  background:#07C160;color:#fff;font-size:32rpx;font-weight:500}
.btn-primary.is-disabled{background:#C8C8C8}
button::after{border:none}

.footer-bar{position:fixed;left:0;right:0;bottom:0;z-index:100;background:#fff;
  padding:16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  border-top:1rpx solid #EDEDED}
.has-footer{padding-bottom:200rpx}
```

---

## 十二条「看起来廉价」的成因（逐条自查）

1. 字号凭感觉给，出现 30rpx、34rpx 这种非阶梯值
2. 页面左右边距不统一，这页 24 那页 40
3. 主色之外又加了两三个强调色
4. 卡片既加阴影又加描边
5. 一屏里两个同等重量的主按钮
6. 正文小于 28rpx
7. 点击区域小于 88rpx（手指点不中）
8. 纯白卡片放在纯白背景上，没有层次
9. 圆角混用 8 / 12 / 20 / 24
10. 阴影朝上或者四边均匀外扩
11. 列表行没有分隔线也没有间距，糊成一片
12. 空态只有一行「暂无数据」

## 页面模式（12 种，写页面前先归位）

工具首页 · 内容流 · 服务首页 · 列表页 · 详情页 · 表单页 ·
结果页 · 个人中心 · 搜索页 · 订单页 · 预约页 · 空态

每种模式的骨架、尺寸和坑，完整版在 `08-设计参考/03-页面模式库.md`。
