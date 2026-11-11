# 大方控股海报工作台 · GitHub Pages 纯静态部署说明

本项目前端已改造为**纯静态站点**，可直接发布到 GitHub Pages，客户浏览器打开即用，无需安装 Node、无需运行后端服务。`service/` 目录下的 Express 后端仅作为本地开发备用，**生产静态版不请求任何本机接口**。

## 一、部署目标

| 项目 | 值 |
| --- | --- |
| 仓库名 | `dafang-poster` |
| Pages 子路径 base | `/dafang-poster/` |
| 线上地址 | `https://YGtemple.github.io/dafang-poster/` |
| 入口路由 | `/dafang-poster/home`（`/` 会重定向到 `/home`） |

## 二、构建

```powershell
# 安装依赖（首次）
npm install

# 生产构建，产物输出到 dist/
npm run build
```

构建要点（已在 `vite.config.ts` 与 `src/config.ts` 中固化）：

- 生产 `base = '/dafang-poster/'`，开发环境保持 `/`；
- 模板数据来自 `public/templates/{list,1,2,3}.json`，封面、底图、logo、底条、字体等静态资源在运行时按 `import.meta.env.BASE_URL` 拼接，子路径下不会出现根路径 `/assets` 404；
- 构建时自动把 `dist/index.html` 复制为 `dist/404.html`，等价于 Pages 的 SPA 刷新回退：直接访问或刷新 `/dafang-poster/home` 可正常加载；
- 上传图片在浏览器内用 `FileReader` 转 base64（dataURL），不调用 `/api/file/upload`；导出继续走前端 html2canvas，不依赖后端截图；
- 生产构建下模板列表/详情、图库、组件库、上传等本机接口在 axios 层统一拒绝，不发出网络请求；百度统计外链不注入。

## 三、本地静态预览（模拟 Pages 子路径）

仓库自带一个仅用于验收的静态服务器脚本（不依赖后端）：

```powershell
node qa/serve-pages.js
# 访问 http://127.0.0.1:4173/dafang-poster/home
```

该脚本会剥离 `/dafang-poster/` 前缀映射 `dist/` 内文件，并对未命中的前端路由回退到 `index.html`，行为与 Pages 的 `404.html` 一致。

> 注意：直接用 `vite preview` 时需确认 base 子路径已生效；本项目验收统一使用上面的 `qa/serve-pages.js`。

## 四、发布到 GitHub Pages

### 方式 A：手动发布 `dist/` 到 `gh-pages` 分支

1. 本地执行 `npm run build`，确认 `dist/` 生成完整；
2. 将 `dist/` 目录内容（不是 `dist/` 文件夹本身）推送到仓库的 `gh-pages` 分支根目录；
3. 仓库 **Settings → Pages**：Source 选择 `Deploy from a branch`，分支选 `gh-pages`、目录选 `/ (root)`；
4. 等待 Pages 构建完成，访问 `https://YGtemple.github.io/dafang-poster/`。

### 方式 B：GitHub Actions 自动发布（推荐）

在仓库 `.github/workflows/deploy-pages.yml` 中使用官方 Pages 部署动作（示例，token 由 GitHub 自动注入，**不要把任何 Personal Access Token 写进仓库文件、配置或日志**）：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

仓库 **Settings → Pages** 的 Source 选择 `GitHub Actions` 即可。

## 五、静态化实现与边界

- **模板/封面**：`public/templates/` 内 JSON 与 `public/assets/originals/` 三张原始样张封面一一对应；模板默认底图为 `public/assets/backgrounds/upload-product-photo.png` 灰色占位图（`isBackground: true`、`name: '产品底图'`、`objectFit: cover`）。
- **上传替换**：本地上传命中标记底图时原地替换 `imgUrl`，保留原图层 `left/top/width/height/rotate/lock`，清除旧裁剪/变换/翻转/缩放残留；无标记底图时才作为新增悬浮图片。
- **导出**：前端 html2canvas 出图，输出 1080×1920 PNG；base64 图片可被 html2canvas 直接绘制。
- **本地开发（可选）**：需要联调后端素材/截图备用链路时，按 `启动说明.md` 用 `start.bat` 启动 5173 前端 + 7001 后端；该模式不影响线上静态产物。

### 已知限制

- 图标字体（iconfont）引用阿里 CDN；完全离线时个别图标可能缺失，但不阻断编辑与导出。
- 上传的产品照片仅保存在当前浏览器会话的内存中，刷新页面后回到占位图，不做服务端持久化。
- 高级素材库、组件库、我的作品、PSD 导入等入口在静态版不可用，对应接口已旁路。

## 六、验收证据（本地 `qa/` 目录）

- `qa/results-pages-static.json`：结构化验收结果（封面显示、面板切换、底图替换、画框保留、cover 铺满、改字、导出尺寸、刷新还原、深链回退、后端请求计数）；
- `qa/qa-pages-covers.png`：三封面首页；
- `qa/qa-pages-t1-export.png` / `t2` / `t3`：三模板上传干净测试照片后的前端导出（1080×1920）；
- `qa/qa-pages-restore.png`：刷新后回到占位图；
- `qa/serve-pages.js`：本地静态预览服务器。

本轮验收记录：页面错误 0、控制台错误 0、失败请求 0、后端/Express 请求 0；三张导出均为 1080×1920。
