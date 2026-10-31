#!/usr/bin/env node
/**
 * 小程序开工包 · 自动体检脚本
 *
 * 用法：
 *   node check.js                 检查当前目录
 *   node check.js ../miniprogram  检查指定目录
 *   node check.js --json          输出 JSON（给 AI 解析用）
 *
 * 零依赖，Node 14+ 可跑。检查的是"提审前必踩的坑"，不是代码风格。
 * 退出码：0 = 无错误，1 = 有错误（CI 里可直接当门禁用）
 */

const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = new Set([
  'node_modules', 'miniprogram_npm', '.git', '.workbuddy', '.cursor',
  'dist', 'build', 'unpackage', 'output', '.tmp-probe', '.vscode',
]);

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);
const CODE_EXT = new Set(['.js', '.ts', '.wxml', '.wxss', '.json', '.wxs']);
const MAX_IMAGE_BYTES = 200 * 1024;

// 绝对化用语：只保留明确违法的，避免误伤"最近""最后"
const BANNED_WORDS = [
  '最好', '最佳', '最强', '最优', '最低价', '最高级', '最大', '最便宜',
  '最先进', '最受欢迎', '全网最低',
  '第一品牌', '国家级', '世界级', '顶级', '绝无仅有', '史上最',
];

const findings = { error: [], warn: [], info: [] };
let ignoredCount = 0;
let ROOT = process.cwd();
let IGNORE = [];
const inlineIgnores = new Map();

/* ---------- 忽略机制 ----------
 * 两种写法，都只影响「这一条」，不做全局关闭：
 *   1) 根目录 .checkignore
 *        pages/legacy/*              → 这个文件全部不检查
 *        page-class-misuse           → 全局忽略某条规则
 *        pages/index/index.wxml:wxss-no-css-var   → 只忽略这个文件的这条
 *   2) 行内注释，写在同一行或上一行
 *        <!-- check-ignore page-class-misuse -->   忽略这一行的指定规则
 *        /* check-ignore *\/                       忽略这一行的所有规则
 */

function globToRegExp(glob) {
  const g = glob.replace(/\\/g, '/');
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        re += '.*';
        i++;
        if (g[i + 1] === '/') i++;
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += /[.+^${}()|[\]\\]/.test(c) ? '\\' + c : c;
    }
  }
  return new RegExp('^' + re + '$');
}

function loadIgnore() {
  const p = path.join(ROOT, '.checkignore');
  if (!fs.existsSync(p)) return [];
  const out = [];
  for (const raw of readUtf8(p).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    let glob = line;
    let rules = null;
    const m = line.match(/^(.*?)\s*:\s*([a-z0-9-]+(?:\s*,\s*[a-z0-9-]+)*)$/);
    if (m) {
      glob = m[1].trim();
      rules = m[2].split(',').map(s => s.trim());
    } else if (/^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/.test(line)) {
      rules = [line];
      glob = '**';
    }
    out.push({ re: globToRegExp(glob), rules });
  }
  return out;
}

function scanInline(relPath, text) {
  const lines = text.split(/\r?\n/);
  const all = new Set();
  const rules = new Map();
  lines.forEach((ln, i) => {
    const at = ln.indexOf('check-ignore');
    if (at < 0) return;
    const n = i + 1;
    const ids = ln.slice(at + 'check-ignore'.length).match(/[a-z][a-z0-9]*(?:-[a-z0-9]+)+/g);
    if (!ids) {
      all.add(n);
      return;
    }
    for (const id of ids) {
      if (!rules.has(id)) rules.set(id, new Set());
      rules.get(id).add(n);
    }
  });
  if (all.size || rules.size) inlineIgnores.set(relPath, { all, rules });
}

function isIgnored(file, rule, line) {
  const r = String(file).replace(/\\/g, '/');
  for (const it of IGNORE) {
    if (!it.re.test(r)) continue;
    if (!it.rules || it.rules.indexOf(rule) >= 0) return true;
  }
  const inl = inlineIgnores.get(r);
  if (!inl) return false;
  if (inl.all.has(line)) return true;
  const s = inl.rules.get(rule);
  return !!(s && s.has(line));
}

const add = (level, file, line, rule, message) => {
  if (file && isIgnored(file, rule, line)) {
    ignoredCount++;
    return;
  }
  findings[level].push({ file, line, rule, message });
};

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return out;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      walk(full, out);
    } else if (ent.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function readUtf8(file) {
  try {
    return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  } catch (e) {
    return '';
  }
}

function lineOf(text, index) {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === '\n') n++;
  return n;
}

function rel(root, file) {
  return path.relative(root, file).replace(/\\/g, '/') || '.';
}

/* ---------- 规则 ---------- */

// 把注释替换成等长空白，保留换行，这样行号不会偏
function stripCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
}

function checkWxss(root, file, text) {
  const clean = stripCssComments(text);
  if (/var\s*\(\s*--/.test(clean)) {
    const m = clean.match(/var\s*\(\s*--/);
    add('error', rel(root, file), lineOf(clean, m.index), 'wxss-no-css-var',
      'WXSS 不支持 CSS 变量，var(--x) 会让整页样式失效，必须展平为字面值');
  }
}

function checkWxml(root, file, text) {
  if (/<web-view/i.test(text)) {
    const m = text.match(/<web-view/i);
    add('error', rel(root, file), lineOf(text, m.index), 'no-web-view',
      '个人主体不能使用 web-view，提审会被拒');
  }
  for (const w of BANNED_WORDS) {
    if (text.includes(w)) {
      const idx = text.indexOf(w);
      add('warn', rel(root, file), lineOf(text, idx), 'ad-law-words',
        `疑似广告法违禁词「${w}」，确认是否是必要表述`);
    }
  }
  if (/bindtap=["'][^"']*(shareAppMessage|onShareApp)/.test(text)) {
    add('warn', rel(root, file), 0, 'no-induced-share', '疑似诱导分享，确认分享不是"分享得奖励"');
  }
}

const SECRET_PATTERNS = [
  { re: /AKID[0-9A-Za-z]{13,}/g, name: '腾讯云 SecretId 疑似硬编码' },
  { re: /(['"`])sk-[A-Za-z0-9_\-]{16,}\1/g, name: 'OpenAI 风格 API Key 疑似硬编码' },
  { re: /(['"`])[A-Za-z0-9_\-]{32,}\1\s*;?\s*\/\/\s*(key|secret|token)/gi, name: '密钥疑似硬编码' },
  { re: /(secretId|secretKey|api_?key|access_?key|app_?secret)\s*[:=]\s*['"`]([^'"`]{12,})['"`]/gi,
    name: '密钥疑似硬编码' },
];

function isPlaceholder(value) {
  const v = String(value).toLowerCase();
  return /your|xxx|placeholder|example|todo|env\.|process\.env|^<.*>$/.test(v);
}

function checkJs(root, file, text) {
  const isConfig = /config|env|secret|key/i.test(path.basename(file));

  let secretReported = false;
  for (const { re, name } of SECRET_PATTERNS) {
    if (secretReported) break;
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const raw = m[0];
      if (isPlaceholder(raw)) continue;
      add('error', rel(root, file), lineOf(text, m.index), 'hardcoded-secret',
        `${name}：${raw.slice(0, 24)}… 请改成 process.env.XXX，值配到云开发控制台`);
      secretReported = true;
      break;
    }
  }

  if (/console\.(log|info)\s*\(/.test(text)) {
    const count = (text.match(/console\.(log|info)\s*\(/g) || []).length;
    add('info', rel(root, file), 0, 'console-left', `仍有 ${count} 处 console.log，提审前清理（调试信息可能泄露内部字段）`);
  }

  const todos = (text.match(/\/\/\s*(TODO|FIXME)/g) || []).length;
  if (todos > 0) {
    add('info', rel(root, file), 0, 'todo-left', `有 ${todos} 个 TODO/FIXME 待处理`);
  }
}

function checkImages(root, files) {
  let total = 0;
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;
    const size = fs.statSync(f).size;
    total += size;
    if (size > MAX_IMAGE_BYTES) {
      add('warn', rel(root, f), 0, 'image-too-large',
        `${Math.round(size / 1024)}KB，超过 200KB 会报警告；照片建议转 JPEG(q85)`);
    }
  }
  add('info', '', 0, 'assets-size', `图片总体积 ${(total / 1024 / 1024).toFixed(2)}MB（主包上限 2MB，图片多的话考虑放云存储）`);
}

function checkAppJson(root, files) {
  const appJsonPath = files.find(f => /app\.json$/i.test(f) && !/project\.config/i.test(f));
  if (!appJsonPath) {
    add('warn', '', 0, 'no-app-json', '没找到 app.json，确认传入的是小程序根目录（miniprogram/）');
    return;
  }
  let cfg;
  try {
    cfg = JSON.parse(readUtf8(appJsonPath));
  } catch (e) {
    add('error', rel(root, appJsonPath), 0, 'app-json-invalid', 'app.json 不是合法 JSON：' + e.message);
    return;
  }

  const pages = Array.isArray(cfg.pages) ? cfg.pages : [];
  const missing = [];
  for (const p of pages) {
    const wxml = path.join(root, p + '.wxml');
    if (!fs.existsSync(wxml)) missing.push(p);
  }
  if (missing.length) {
    add('error', 'app.json', 0, 'page-missing', `这些页面在 app.json 里注册了但文件不存在：${missing.join(', ')}`);
  }

  // .page 负边距陷阱：全局 .page 带负边距，只允许沉浸式页面使用
  const appWxss = files.find(f => /app\.wxss$/i.test(f));
  let pageHasNegativeMargin = false;
  if (appWxss) {
    const css = readUtf8(appWxss);
    const m = css.match(/\.page\s*\{[^}]*margin-top\s*:\s*-/s);
    if (m) pageHasNegativeMargin = true;
  }
  if (pageHasNegativeMargin) {
    for (const p of pages) {
      const jsonPath = path.join(root, p + '.json');
      let custom = false;
      if (fs.existsSync(jsonPath)) {
        try {
          const pc = JSON.parse(readUtf8(jsonPath));
          custom = pc.navigationStyle === 'custom';
        } catch (e) { /* 忽略 */ }
      }
      if (custom) continue;
      const wxmlPath = path.join(root, p + '.wxml');
      if (!fs.existsSync(wxmlPath)) continue;
      const wxml = readUtf8(wxmlPath);
      const mm = wxml.match(/class\s*=\s*["'][^"']*\bpage\b[^"']*["']/);
      if (mm) {
        add('error', rel(root, wxmlPath), lineOf(wxml, mm.index), 'page-class-misuse',
          '非沉浸式页面使用了全局 .page 类（带负边距），内容会被导航栏挡住；改用独立容器类如 .np');
      }
    }
  }

  const tabBar = cfg.tabBar && cfg.tabBar.list ? cfg.tabBar.list.length : 0;
  if (tabBar) add('info', '', 0, 'tabbar', `tabBar 有 ${tabBar} 个 tab`);
}

/* ---------- main ---------- */

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const target = args.find(a => !a.startsWith('--')) || process.cwd();
  const root = path.resolve(target);

  if (!fs.existsSync(root)) {
    console.error('目录不存在：' + root);
    process.exit(2);
  }

  ROOT = root;
  IGNORE = loadIgnore();

  const files = walk(root);
  const codeFiles = files.filter(f => CODE_EXT.has(path.extname(f).toLowerCase()));

  for (const f of codeFiles) {
    const text = readUtf8(f);
    const ext = path.extname(f).toLowerCase();
    scanInline(rel(root, f), text);
    if (ext === '.wxss') checkWxss(root, f, text);
    else if (ext === '.wxml') checkWxml(root, f, text);
    else if (ext === '.js' || ext === '.ts') checkJs(root, f, text);
  }

  checkImages(root, files);
  checkAppJson(root, files);

  if (jsonMode) {
    console.log(JSON.stringify({
      root,
      files: files.length,
      ignored: ignoredCount,
      error: findings.error,
      warn: findings.warn,
      info: findings.info,
    }, null, 2));
    process.exit(findings.error.length ? 1 : 0);
  }

  const line = '─'.repeat(56);
  console.log('\n小程序体检报告');
  console.log('目录：' + root);
  console.log('扫描：' + files.length + ' 个文件');
  if (ignoredCount) {
    console.log('已忽略：' + ignoredCount + ' 条（按 .checkignore 或行内 check-ignore 注释）');
  }
  console.log(line);

  const printGroup = (title, list, bullet) => {
    if (!list.length) return;
    console.log('');
    console.log(`${title}（${list.length}）`);
    for (const it of list) {
      const loc = it.file ? `${it.file}${it.line ? ':' + it.line : ''}` : '-';
      console.log(`  ${bullet} [${it.rule}] ${loc}`);
      console.log(`     ${it.message}`);
    }
  };

  printGroup('必须改', findings.error, '×');
  printGroup('建议改', findings.warn, '!');
  printGroup('提示', findings.info, '·');

  console.log('');
  console.log(line);
  if (!findings.error.length && !findings.warn.length) {
    console.log('通过。没有发现红线问题，可以去提审了。');
  } else {
    console.log(`结论：${findings.error.length} 个必须改，${findings.warn.length} 个建议改。`);
    if (findings.error.length) console.log('必须改清零后再提审，否则大概率被拒或线上出 bug。');
  }
  console.log(line + '\n');

  process.exit(findings.error.length ? 1 : 0);
}

main();
