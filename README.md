# 交易可查持仓矩阵分析系统

一个用于追踪期货主力席位持仓变化的前后端项目。系统从 `backend/data/positions_日期.csv` 读取席位持仓数据，在后端按品种、合约、席位聚合多空变化，并在前端展示期货席位追踪列表、品种席位详情和相关图表。

## 功能概览

- 仪表盘：展示品种覆盖、信号分布、板块变化和重点品种。
- 期货席位追踪：按日期、信号、板块和关键词筛选五大席位持仓变化。
- 品种席位详情：查看单个品种的五大席位汇总、合约汇总、合约-席位明细和席位对峙分析。
- 旧版信号列表：保留原机构 / 散户矩阵信号，用于兼容和对照。
- 数据接口：FastAPI 提供仪表盘、信号、图表和品种相关 API。

## 项目文档

- [更新日志](docs/CHANGELOG.md)
- [旧版信号与新版信号说明](docs/SIGNAL_GUIDE.md)
- [第一阶段重构计划](project.md)

## 技术栈

前端：

- React 19
- TypeScript
- Vite
- Ant Design
- ECharts / echarts-for-react
- axios
- react-router-dom

后端：

- Python
- FastAPI
- Uvicorn
- pandas

## 目录结构

```text
.
+-- backend
|   +-- app
|   |   +-- api              # FastAPI 路由
|   |   +-- core             # 路径等基础配置
|   |   +-- services         # 数据读取、矩阵计算、图表数据服务
|   |   +-- main.py          # FastAPI 应用入口
|   +-- data                 # 持仓数据文件
+-- frontend
|   +-- public
|   +-- src
|       +-- api              # 前端 API 请求封装
|       +-- components       # 图表和表格组件
|       +-- pages            # 页面
|       +-- types            # TypeScript 类型
+-- package.json
+-- README.md
```

## 环境要求

- Node.js 18 或更高版本
- npm
- Python 3.10 或更高版本

## 快速开始

### 1. 安装后端依赖

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r app\api\requirements.txt
```

### 2. 启动后端

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

启动后可访问：

- API 根路径：http://127.0.0.1:8000
- Swagger 文档：http://127.0.0.1:8000/docs

### 3. 安装前端依赖

```powershell
cd frontend
npm install
```

### 4. 启动前端

```powershell
cd frontend
npm run dev
```

默认访问地址通常为：

```text
http://127.0.0.1:5173
```

前端目前默认请求后端地址 `http://127.0.0.1:8000`，配置位于 `frontend/src/api/client.ts`。

也可以通过环境变量覆盖：

```powershell
cd frontend
copy .env.example .env
```

然后修改 `frontend/.env`：

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## 数据文件

后端按日期读取数据文件：

```text
backend/data/positions_YYYY-MM-DD.csv
```

当前项目内置示例数据：

```text
backend/data/positions_2026-03-27.csv
```

CSV 需要包含以下字段：

| 字段 | 说明 |
| --- | --- |
| `date` | 日期 |
| `broker` | 席位 / 机构名称 |
| `category` | 板块 |
| `product` | 品种 |
| `contract` | 合约 |
| `long_position` | 多头持仓 |
| `long_change` | 多头持仓变化 |
| `short_position` | 空头持仓 |
| `short_change` | 空头持仓变化 |

如需切换分析日期，请把对应日期的数据放入 `backend/data`，并按 `positions_YYYY-MM-DD.csv` 命名。

## 常用脚本

前端脚本位于 `frontend/package.json`：

```powershell
npm run dev       # 启动 Vite 开发服务器
npm run build     # TypeScript 编译并构建生产包
npm run lint      # 运行 ESLint
npm run preview   # 预览生产构建
```

## API 概览

基础地址：

```text
http://127.0.0.1:8000
```

生产环境默认后端地址：

```text
https://cbfinace-api.onrender.com
```

主要接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/dashboard?date=2026-03-27` | 获取仪表盘数据 |
| `GET` | `/api/seat-tracker?date=2026-06-09` | 获取期货席位追踪列表 |
| `GET` | `/api/seat-tracker/categories?date=2026-06-09` | 获取席位追踪板块列表 |
| `GET` | `/api/signals?date=2026-03-27` | 获取信号列表 |
| `GET` | `/api/signal-categories?date=2026-03-27` | 获取板块分类 |
| `GET` | `/api/signal-types` | 获取信号类型 |
| `GET` | `/api/charts/signal-distribution?date=2026-03-27` | 获取信号类型分布图数据 |
| `GET` | `/api/charts/category-strength?date=2026-03-27` | 获取板块强度图数据 |
| `GET` | `/api/charts/top-products?date=2026-03-27&limit=10` | 获取 Top 品种图数据 |
| `GET` | `/api/charts/matrix-scatter?date=2026-03-27` | 获取矩阵散点图数据 |
| `GET` | `/api/products?date=2026-03-27&keyword=化工` | 搜索品种 |
| `GET` | `/api/products/{product}?date=2026-03-27` | 获取品种详情 |
| `GET` | `/api/products/{product}/dashboard?date=2026-06-09` | 获取品种席位持仓详情 |

席位追踪接口第一阶段只使用 CSV 中真实存在的 `category` 字段作为板块筛选，不使用交易所字段，也不返回 `strength` 或 `exchange` 字段。

## 常见问题

### 前端页面加载失败

请确认后端已启动，并且可以访问：

```text
http://127.0.0.1:8000/docs
```

### 查询日期没有数据

请确认 `backend/data` 下存在对应日期的 CSV 文件，例如：

```text
backend/data/positions_2026-03-27.csv
```

### 页面或接口文案出现乱码

当前部分源码文件中的中文文案存在编码异常。运行逻辑主要依赖字段和接口结构，不影响 README 中描述的启动流程；如果要进一步整理项目，建议统一将源码文件转换为 UTF-8 编码并修正文案。

## 线上部署

项目已加入一套默认部署配置：

- 后端：`render.yaml`，适用于 Render Web Service。
- 前端：`vercel.json`，适用于 Vercel 静态部署。
- 前端线上 API 地址：`https://cbfinace-api.onrender.com`。
- 后端允许的前端来源：`https://cbfinace.vercel.app`。

### 1. 部署后端到 Render

1. 登录 Render。
2. 选择 New Blueprint。
3. 连接 GitHub 仓库：`https://github.com/xunme1/cbfinace.git`。
4. Render 会读取根目录 `render.yaml` 并创建 `cbfinace-api` 服务。
5. 部署完成后访问：

```text
https://cbfinace-api.onrender.com/docs
```

如果 Render 生成的服务域名不是 `https://cbfinace-api.onrender.com`，请把实际域名填入前端环境变量 `VITE_API_BASE_URL`。

### 2. 部署前端到 Vercel

1. 登录 Vercel。
2. 导入 GitHub 仓库：`xunme1/cbfinace`。
3. 使用根目录的 `vercel.json` 部署。
4. 确认环境变量：

```text
VITE_API_BASE_URL=https://cbfinace-api.onrender.com
```

部署完成后默认访问：

```text
https://cbfinace.vercel.app
```

### 3. 修改线上域名

如果你绑定了自定义域名，例如：

```text
前端：https://cbfinace.example.com
后端：https://api.cbfinace.example.com
```

需要同步修改：

前端环境变量：

```text
VITE_API_BASE_URL=https://api.cbfinace.example.com
```

后端环境变量：

```text
FRONTEND_ORIGINS=https://cbfinace.example.com
```

如果保留本地开发地址，可以写成：

```text
FRONTEND_ORIGINS=https://cbfinace.example.com,http://127.0.0.1:5173,http://localhost:5173
```

### 4. 部署后检查

后端检查：

```text
https://cbfinace-api.onrender.com/docs
```

前端检查：

```text
https://cbfinace.vercel.app
```

如果前端能打开但数据加载失败，优先检查：

- `VITE_API_BASE_URL` 是否指向实际后端域名。
- `FRONTEND_ORIGINS` 是否包含实际前端域名。
- `backend/data` 是否包含查询日期对应的 `positions_YYYY-MM-DD.csv`。

### 5. 服务器更新项目

如果前后端都部署在云服务器上，拉取最新代码后执行：

```bash
cd /root/cbfinace
git pull

sudo systemctl restart cbfinace-api

cd /root/cbfinace/frontend
npm run build
sudo rm -rf /var/www/cbfinace/*
sudo cp -r dist/* /var/www/cbfinace/
sudo chown -R www-data:www-data /var/www/cbfinace
sudo sed -i 's/ crossorigin//g' /var/www/cbfinace/index.html
sudo nginx -t
sudo systemctl reload nginx
```

更新后访问：

```text
http://服务器公网IP/seat-tracker
http://服务器公网IP/products/甲醇?date=2026-06-09
```

## 开发建议

- 新增 API 时优先放在 `backend/app/api`，业务逻辑放在 `backend/app/services`。
- 新增前端请求时放在 `frontend/src/api`，并在 `frontend/src/types` 补充响应类型。
- 新增图表时优先复用 ECharts 组件模式，保持页面数据请求和展示组件分离。
