# 前端说明

这是交易可查持仓矩阵分析系统的前端应用，基于 React、TypeScript、Vite、Ant Design 和 ECharts 构建。

完整项目说明请查看根目录 `README.md`。

## 启动

```powershell
npm install
npm run dev
```

默认开发地址通常为：

```text
http://127.0.0.1:5173
```

前端接口基础地址配置在 `src/api/client.ts`，当前为：

```text
http://127.0.0.1:8000
```

本地可复制环境变量示例：

```powershell
copy .env.example .env
```

线上部署时设置：

```text
VITE_API_BASE_URL=https://cbfinace-api.onrender.com
```

## 脚本

```powershell
npm run dev       # 启动开发服务器
npm run build     # 构建生产版本
npm run lint      # 代码检查
npm run preview   # 预览生产构建
```
