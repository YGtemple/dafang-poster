# 大方控股海报工作台

基于迅排设计 `poster-design` 二次定制的三模板海报工具。GitHub Pages 版本为纯静态前端，客户无需安装 Node.js 或启动后端。

## 在线使用

**https://ygtemple.github.io/dafang-poster/**

使用流程：选择模板 → 上传产品照片 → 修改标题和标注 → 导出 1080×1920 PNG。

内置模板：

- 高速航拍 · 白色行书
- 厂房车间 · 黄色超粗黑体
- 港机夕阳 · 黄色行楷

## 静态版特性

- 模板列表与模板详情直接读取 `public/templates/` 中的 JSON。
- 产品照片通过 FileReader 转为 dataURL，在浏览器内原地替换底图，不上传服务器。
- 封面、占位图、logo、底部联系条及三款字体均为仓库内静态资源。
- 使用 html2canvas 在前端导出 PNG，不依赖 Express 或后端截图服务。
- 支持 `/dafang-poster/` 子路径和 `/home` 深链刷新。
- 上传照片只保留在当前页面会话中，刷新后恢复占位底图。

## 本地构建

需要 Node.js 18+（仅开发/构建时需要）：

```bash
npm install
npm run build
```

构建产物位于 `dist/`。部署说明见 [DEPLOYMENT.md](DEPLOYMENT.md)，Windows 本地全功能启动方式见 [启动说明.md](启动说明.md)。

## 分支

- `main`：完整源码。
- `gh-pages`：GitHub Pages 静态构建产物。

## 上游与许可

上游项目：[palxiao/poster-design](https://github.com/palxiao/poster-design)，基于 `mit-version` 分支定制，遵循 MIT 许可。上游作者及原始许可信息保留在 `LICENSE`、`LICENSE-ZH` 和相关源码中。
