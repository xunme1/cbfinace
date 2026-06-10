# 更新日志

## 2026-06-10：第一阶段重构为“期货席位追踪系统”

本次更新将项目核心从“机构 vs 散户矩阵 + 信号强度排序”调整为“主力席位 + 品种 + 合约持仓追踪”。旧版信号接口和页面仍保留，用于兼容和对照。

### 新增

- 新增期货席位追踪页面：`/seat-tracker`。
- 新增品种席位持仓详情页：`/products/:product?date=YYYY-MM-DD`。
- 新增后端接口：
  - `GET /api/seat-tracker`
  - `GET /api/seat-tracker/categories`
  - `GET /api/products/{product}/dashboard`
- 新增五大席位追踪逻辑：
  - 高盛期货
  - 摩根大通
  - 国泰君安
  - 东方财富
  - 徽商期货
- 新增按板块筛选、信号筛选、品种关键词搜索。
- 新增主要变化合约、次要变化合约识别。
- 新增席位对峙分析说明。
- 新增 `project.md`，记录本阶段重构需求和后续规划。

### 调整

- 系统标题调整为“期货席位追踪系统”。
- 首页默认分析日期调整为 `2026-06-09`。
- 首页和旧版信号页不再突出展示“信号强度”。
- `/products/:product` 改为新版品种席位持仓详情页。
- 导航新增“席位追踪”，原信号列表改名为“旧版信号”。
- README 更新项目定位、接口说明和服务器更新命令。

### 保留

- 保留旧版 Dashboard、信号列表、矩阵图和相关 API。
- 保留旧版机构 / 散户矩阵计算逻辑，避免影响历史对照。
- 保留现有 CSV 数据读取方式，暂不引入数据库。

### 暂未实现

- 暂不支持交易所筛选，因为当前 CSV 没有 `exchange` 字段。
- 暂不实现资金流入前 5 分析。
- 暂不接入 AI 解读。
- 暂不做数据库、缓存和定时任务改造。

### 验证

- 前端 `npm run build` 通过。
- 后端新服务可读取 `positions_2026-06-09.csv`。
- `/api/seat-tracker?date=2026-06-09` 可生成 71 个品种。
- 新版席位追踪接口返回中不包含 `strength` 和 `exchange` 字段。

## 2026-06-09：部署准备和数据更新

### 新增

- 新增 `positions_2026-06-09.csv` 数据文件。
- 新增 Render 后端部署配置：`render.yaml`。
- 新增 Vercel 前端部署配置：`vercel.json`。
- 新增环境变量示例：
  - `.env.example`
  - `frontend/.env.example`

### 调整

- 前端 API 地址改为通过 `VITE_API_BASE_URL` 配置。
- 后端 CORS 来源改为通过 `FRONTEND_ORIGINS` 配置。
- README 增加本地启动、部署和服务器更新说明。

## 2026-06-09：首次项目初始化

### 新增

- 初始化 Git 仓库并推送 GitHub。
- 新增根目录 README。
- 新增根目录 `.gitignore`。
- 保留前后端目录结构：
  - `backend`
  - `frontend`
  - `backend/data`

### 说明

- 初始版本核心是“机构 vs 散户矩阵分析”。
- 前端使用 React、TypeScript、Vite、Ant Design 和 ECharts。
- 后端使用 FastAPI、Uvicorn 和 pandas。
