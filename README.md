# 交易可查持仓矩阵分析系统

一个用于分析期货持仓数据的前后端项目。系统从 `backend/data/positions_日期.csv` 读取席位持仓数据，在后端计算机构与散户的持仓变化矩阵，并在前端展示仪表盘、信号列表、品种详情和多种 ECharts 图表。

## 功能概览

- 仪表盘：展示信号总览、信号类型分布、板块信号强度、Top 品种和矩阵散点图。
- 信号列表：支持按日期、信号类型、板块和关键词筛选。
- 品种详情：查看单个品种的矩阵结论、席位贡献、合约汇总和合约明细。
- 数据接口：FastAPI 提供仪表盘、信号、图表和品种相关 API。

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

主要接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/dashboard?date=2026-03-27` | 获取仪表盘数据 |
| `GET` | `/api/signals?date=2026-03-27` | 获取信号列表 |
| `GET` | `/api/signal-categories?date=2026-03-27` | 获取板块分类 |
| `GET` | `/api/signal-types` | 获取信号类型 |
| `GET` | `/api/charts/signal-distribution?date=2026-03-27` | 获取信号类型分布图数据 |
| `GET` | `/api/charts/category-strength?date=2026-03-27` | 获取板块强度图数据 |
| `GET` | `/api/charts/top-products?date=2026-03-27&limit=10` | 获取 Top 品种图数据 |
| `GET` | `/api/charts/matrix-scatter?date=2026-03-27` | 获取矩阵散点图数据 |
| `GET` | `/api/products?date=2026-03-27&keyword=化工` | 搜索品种 |
| `GET` | `/api/products/{product}?date=2026-03-27` | 获取品种详情 |

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

## 开发建议

- 新增 API 时优先放在 `backend/app/api`，业务逻辑放在 `backend/app/services`。
- 新增前端请求时放在 `frontend/src/api`，并在 `frontend/src/types` 补充响应类型。
- 新增图表时优先复用 ECharts 组件模式，保持页面数据请求和展示组件分离。
