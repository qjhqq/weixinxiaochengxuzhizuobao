#!/usr/bin/env node
/**
 * 用 GitHub REST API 把本地文件夹同步成仓库里的一个 commit。
 *
 * 为什么要这个：国内很多网络运营商把 github.com 的 443 端口掐了，git push 会超时，
 * 但 api.github.com 通。这个脚本全程只打 api.github.com，不依赖 git 的传输层。
 *
 * 用法（在包根目录执行）：
 *   set GH_TOKEN=ghp_xxxx
 *   node 07-参与贡献/push-via-api.js . --dry          # 预演，只看会动哪些文件
 *   node 07-参与贡献/push-via-api.js . --go           # 真推
 *   node 07-参与贡献/push-via-api.js . --go --msg "fix: 补充审核红线"
 *
 * 参数：
 *   --repo owner/name   仓库，默认 qjhqq/huage
 *   --branch main       分支，默认取仓库的 default_branch
 *   --msg "..."         commit 信息，默认 "chore: 同步内容"
 *   --go / --dry        不加 --go 什么都不写
 *
 * 需要 token：GitHub → Settings → Developer settings → Personal access tokens
 *   classic 勾 repo；fine-grained 只需 Contents: Read and write
 */

const fs = require('fs');
const path = require('path');

const API = 'https://api.github.com';
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';

function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const positional = process.argv.slice(2).filter((a, i, arr) => {
  if (a.startsWith('--')) return false;
  return !(arr[i - 1] && arr[i - 1].startsWith('--') && ['repo', 'branch', 'msg'].includes(arr[i - 1].slice(2)));
});

const SRC = path.resolve(positional[0] || path.resolve(__dirname, '..'));
const [OWNER, REPO] = (arg('repo', 'qjhqq/huage')).split('/');
const BRANCH = arg('branch', '');
const MSG = arg('msg', 'chore: 同步内容');
const DRY = process.argv.includes('--dry');
const GO = process.argv.includes('--go');

const SKIP_DIRS = new Set(['.git', 'node_modules', '我的项目']);
const SKIP_FILES = new Set(['.DS_Store', 'Thumbs.db']);

function walk(dir, base = dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, base, out);
    else if (!SKIP_FILES.has(name)) out.push({ abs: full, rel: path.relative(base, full).split(path.sep).join('/') });
  }
  return out;
}

async function api(method, url, body) {
  const full = url.startsWith('http') ? url : API + url;
  let lastErr;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const res = await fetch(full, {
        method,
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'miniprogram-starter-kit-pusher',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
      if (!res.ok) {
        if (res.status >= 500 || res.status === 429) {
          lastErr = new Error(`${method} ${url} -> ${res.status}`);
          lastErr.status = res.status;
          await new Promise((r) => setTimeout(r, 800 * attempt));
          continue;
        }
        const err = new Error(`${method} ${url} -> ${res.status} ${data.message || text.slice(0, 200)}`);
        err.status = res.status;
        throw err;
      }
      return data;
    } catch (e) {
      if (e.status && e.status < 500) throw e;
      lastErr = e;
      if (attempt < 6) await new Promise((r) => setTimeout(r, 600 * attempt));
    }
  }
  throw lastErr;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  }));
  return out;
}

(async () => {
  const files = walk(SRC);
  const bytes = files.reduce((s, f) => s + fs.statSync(f.abs).size, 0);
  console.log(`本地目录：${SRC}`);
  console.log(`文件：${files.length} 个　${(bytes / 1024).toFixed(0)} KB`);
  console.log(`目标：${OWNER}/${REPO}${BRANCH ? ' → ' + BRANCH : ''}`);

  if (DRY) {
    for (const f of files.slice(0, 10)) console.log('  ' + f.rel);
    if (files.length > 10) console.log(`  …共 ${files.length} 个`);
    console.log('\n预演结束，未写入任何东西。加 --go 才真推。');
    return;
  }
  if (!GO) { console.log('\n缺 --go，什么也没做。'); return; }
  if (!TOKEN) { console.error('\n缺 GH_TOKEN 环境变量'); process.exit(1); }

  const repo = await api('GET', `/repos/${OWNER}/${REPO}`);
  const branch = BRANCH || repo.default_branch;
  console.log(`\n[1/7] 仓库可读，分支 ${branch}，${repo.private ? '私有' : '公开'}`);

  let baseSha = null, baseTree = null, remotePaths = [];
  try {
    const ref = await api('GET', `/repos/${OWNER}/${REPO}/git/ref/heads/${branch}`);
    baseSha = ref.object.sha;
    const c = await api('GET', `/repos/${OWNER}/${REPO}/git/commits/${baseSha}`);
    baseTree = c.tree.sha;
    const t = await api('GET', `/repos/${OWNER}/${REPO}/git/trees/${baseTree}?recursive=1`);
    remotePaths = (t.tree || []).filter((x) => x.type === 'blob').map((x) => x.path);
    console.log(`[2/7] 远端 HEAD ${baseSha.slice(0, 7)}，已有 ${remotePaths.length} 个文件`);
  } catch (e) {
    if (e.status === 404 || e.status === 409) console.log('[2/7] 远端还是空的，从零开始');
    else throw e;
  }

  console.log(`[3/7] 上传 ${files.length} 个 blob…`);
  let n = 0;
  const shas = await mapLimit(files, 3, async (f) => {
    const r = await api('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
      content: fs.readFileSync(f.abs).toString('base64'),
      encoding: 'base64',
    });
    n++;
    if (n % 10 === 0 || n === files.length) console.log(`      ${n}/${files.length}`);
    return r.sha;
  });

  const localSet = new Set(files.map((f) => f.rel));
  const deleted = remotePaths.filter((p) => !localSet.has(p));

  const tree = [
    ...files.map((f, i) => ({ path: f.rel, mode: '100644', type: 'blob', sha: shas[i] })),
    ...deleted.map((p) => ({ path: p, mode: '100644', type: 'blob', sha: null })), // sha=null 即删除
  ];
  if (deleted.length) console.log(`[4/7] 顺带删除远端多出来的 ${deleted.length} 个文件：${deleted.join(', ')}`);
  else console.log('[4/7] 没有需要删除的文件');

  const newTree = await api('POST', `/repos/${OWNER}/${REPO}/git/trees`, {
    ...(baseTree ? { base_tree: baseTree } : {}),
    tree,
  });

  const commit = await api('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
    message: MSG,
    tree: newTree.sha,
    ...(baseSha ? { parents: [baseSha] } : {}),
  });
  console.log(`[5/7] commit ${commit.sha.slice(0, 7)}`);

  if (baseSha) await api('PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/${branch}`, { sha: commit.sha, force: true });
  else await api('POST', `/repos/${OWNER}/${REPO}/git/refs`, { ref: `refs/heads/${branch}`, sha: commit.sha });
  console.log(`[6/7] 分支 ${branch} 已指向新 commit`);

  const final = await api('GET', `/repos/${OWNER}/${REPO}/git/trees/${commit.sha}?recursive=1`);
  const count = (final.tree || []).filter((x) => x.type === 'blob').length;
  console.log(`[7/7] 远端现在 ${count} 个文件（本地 ${files.length}）`);
  console.log(`\n完成：https://github.com/${OWNER}/${REPO}`);
})().catch((e) => {
  console.error('\n失败：' + e.message);
  if (e.status === 401) console.error('→ token 无效或已过期');
  if (e.status === 403) console.error('→ 权限不够（要 Contents: Read and write），或触发速率限制');
  if (e.status === 404) console.error('→ 仓库不存在，或 token 看不到它');
  process.exit(1);
});
