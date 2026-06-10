\# 期货席位追踪系统重构计划书



\## 1. 项目背景



当前项目已经完成了从爬虫抓取到后端分析、再到前端仪表盘展示的基本流程。原系统主要围绕“机构 vs 散户矩阵”和“信号强度排序”展开，能够基于席位持仓变化生成对手盘、共振、机构突击、散户自嗨等信号，并通过 Dashboard 页面进行展示。



但是经过当前流程复盘和小组长反馈后，项目需要进行较大调整。小组长提出的核心要求是：



```text

第一个角度：比较主力席位的持仓。

第二个角度：增加当日资金流入前 5 的品种，然后从商品角度分析席位有没有明显对峙。

当前优先：先考虑第一个角度。

```



因此，新版本不再以“信号强度排名”为核心，而是转向“期货席位追踪”，重点分析五大席位在不同品种、不同合约上的多空变化，并在品种详情页中展示席位之间是否存在明显对峙。



同时需要注意：当前爬取到的数据中没有 `exchange` 交易所字段，因此第一阶段不应实现交易所筛选，而应使用当前已有的 `category` 字段作为板块筛选条件。



---



\## 2. 当前可用数据基础



当前第一阶段主要依赖原始持仓数据文件：



```text

positions\_日期.csv

```



该数据来自席位持仓页面，当前可用字段包括：



```text

date

broker

category

product

contract

long\_position

long\_change

short\_position

short\_change

```



字段含义：



```text

date：数据日期

broker：席位名称

category：品种板块，例如农副、黑色、化工、有色等

product：品种名称

contract：合约代码

long\_position：多头持仓

long\_change：多头变化

short\_position：空头持仓

short\_change：空头变化

```



当前没有以下字段：



```text

exchange

exchange\_cn

product\_code

```



因此第一阶段不要实现：



```text

交易所筛选

上期所 / 大商所 / 郑商所 / 中金所筛选

基于交易所的分类展示

```



第一阶段应使用：



```text

category 板块筛选

```



---



\## 3. 新版本项目定位



\### 3.1 旧版本定位



旧版本偏向：



```text

机构 vs 散户持仓矩阵分析仪表盘

```



旧版本特点：



```text

1\. 按机构阵营和散户阵营聚合。

2\. 计算多空净变化。

3\. 生成信号类型。

4\. 使用信号强度进行排序。

5\. 前端展示统计卡片、图表和 Top 信号表。

```



旧版本主要问题：



```text

1\. 信号强度难以跨品种比较。

2\. 不同品种持仓规模差异较大，绝对值排序容易误导。

3\. 机构 / 散户阵营划分较粗。

4\. 品种详情页对席位和合约层面的解释不足。

5\. 当前数据没有交易所字段，不适合直接复刻参考图中的交易所筛选。

```



\### 3.2 新版本定位



新版本定位为：



```text

期货席位追踪系统

```



核心关注：



```text

1\. 哪些品种主力席位明显偏多？

2\. 哪些品种主力席位明显偏空？

3\. 哪些品种席位之间存在明显对峙？

4\. 某个品种的变化主要集中在哪些合约？

5\. 某个品种是哪些席位在推动？

```



新版本核心数据链路：



```text

positions\_日期.csv

&nbsp;   ↓

按品种、合约、席位聚合

&nbsp;   ↓

计算席位净变化

&nbsp;   ↓

生成简单信号

&nbsp;   ↓

期货席位追踪列表

&nbsp;   ↓

点击品种进入详情页

&nbsp;   ↓

查看各合约、各席位持仓变化

```



---



\## 4. 本次重构核心原则



\### 4.1 去掉信号强度展示



原有的 `strength`、`signal\_strength`、`strength\_score` 不再作为前端核心展示字段。



原因：



```text

1\. 不同品种持仓规模差异很大。

2\. 金融期货和商品期货资金量级不同。

3\. 绝对变化值不能直接跨品种比较。

4\. 小组长要求“信号简单算算就好”。

5\. 当前项目重点转向席位持仓结构，而不是强度排名。

```



前端页面不再展示：



```text

信号强度

强度评分

Top 强信号

```



后端可以暂时保留旧逻辑，但新接口不要返回 strength 字段。



\### 4.2 第一阶段不用交易所字段



由于当前 CSV 中没有 `exchange` 字段，因此第一阶段不实现交易所筛选。



原计划中的：



```text

交易所：全部 / 上期所 / 大商所 / 郑商所 / 中金所 / 能源

```



调整为：



```text

板块：全部 / 农副 / 黑色 / 化工 / 有色 / 贵金属 / 能源 / 金融 / 其他

```



板块来自：



```text

positions\_日期.csv 中的 category 字段

```



\### 4.3 优先完成主力席位持仓追踪



第一阶段只聚焦小组长要求的第一个角度：



```text

比较主力席位的持仓。

```



也就是重点展示五大席位在每个品种上的多头变化、空头变化、净变化和方向。



\### 4.4 品种详情页必须能追溯到合约和席位



点击某个品种后，详情页必须展示：



```text

1\. 该品种整体信号。

2\. 五大席位在该品种上的净变化。

3\. 各合约的多空变化。

4\. 各合约下各席位的多空变化。

5\. 是否存在明显席位对峙。

```



---



\## 5. 第一阶段建设目标



第一阶段目标：



```text

基于已有 positions\_日期.csv，完成期货席位追踪列表和品种详情仪表盘。

```



必须完成：



```text

1\. 去掉前端信号强度展示。

2\. 新增 seat\_tracker\_service.py。

3\. 新增 /api/seat-tracker 接口。

4\. 使用 category 作为板块筛选字段。

5\. 新增 /api/seat-tracker/categories 接口。

6\. 新增 SeatTracker 页面。

7\. 点击品种进入 ProductDashboard 页面。

8\. ProductDashboard 展示各合约和各席位的持仓变化。

```



第一阶段暂缓：



```text

1\. 交易所筛选。

2\. 资金流入前 5 页面。

3\. 复杂信号强度模型。

4\. AI 解读。

5\. 数据库改造。

6\. 上线部署。

```



---



\## 6. 第二阶段建设目标



第二阶段再考虑小组长提出的第二个角度：



```text

增加当日资金流入前 5 的品种，然后从商品角度分析席位有没有明显对峙。

```



第二阶段数据来源：



```text

fund\_flows\_日期.csv

broker\_structure\_日期.csv

positions\_日期.csv

```



第二阶段功能：



```text

1\. 当日资金流入前 5 品种。

2\. 当日资金流出前 5 品种。

3\. 每个品种的主要流入席位。

4\. 每个品种的主要流出席位。

5\. 对资金流入前 5 品种做席位对峙分析。

6\. 将资金流向信息接入品种详情页。

```



---



\## 7. 页面规划



\### 7.1 页面一：首页 Dashboard



首页继续保留，但弱化旧的“信号强度”展示。



建议展示：



```text

1\. 覆盖品种数

2\. 强看多品种数

3\. 强看空品种数

4\. 冲突品种数

5\. 中性品种数

6\. 今日重点品种列表

```



不再展示：



```text

总信号强度

强度排行

强度评分

```



\### 7.2 页面二：期货席位追踪页



页面路径：



```text

/seat-tracker

```



页面标题：



```text

期货席位追踪

```



顶部筛选区：



```text

信号筛选：

全部

强看多

强看空

冲突

正向

反向

中性



板块筛选：

全部

农副

黑色

化工

有色

贵金属

能源

金融

其他



关键词搜索：

输入品种名称进行搜索

```



注意：



```text

第一阶段不做交易所筛选。

```



表格字段：



```text

品种

板块

信号

主力合约

主力合约净变化

次主力合约

次主力合约净变化

全部合约聚合净变化

高盛期货

摩根大通

国泰君安

东方财富

徽商期货

操作

```



操作列：



```text

查看详情

```



点击后跳转：



```text

/products/:product?date=日期

```



例如：



```text

/products/甲醇?date=2026-06-09

/products/棕榈油?date=2026-06-09

```



前端跳转时需要使用：



```text

encodeURIComponent(product)

```



\### 7.3 页面三：品种详情仪表盘



页面路径：



```text

/products/:product

```



页面标题示例：



```text

甲醇 席位持仓详情

棕榈油 席位持仓详情

```



页面模块：



```text

1\. 品种基础信息

2\. 当前信号结论

3\. 五大席位总体变化

4\. 合约汇总

5\. 合约-席位明细

6\. 席位对峙分析

```



品种基础信息展示：



```text

品种

板块

日期

当前信号

主力合约

次主力合约

```



当前信号结论展示：



```text

强看多 / 强看空 / 冲突 / 正向 / 反向 / 中性

```



五大席位总体变化表：



```text

席位

多头变化

空头变化

净变化

方向

```



合约汇总表：



```text

合约

多头变化

空头变化

净变化

方向

```



合约-席位明细表：



```text

合约

席位

多头持仓

多头变化

空头持仓

空头变化

净变化

方向

```



席位对峙分析示例：



```text

国泰君安、摩根大通偏多；东方财富、徽商期货偏空，主力席位之间存在明显对峙。

```



或者：



```text

五大席位整体方向较一致，暂未出现明显对峙。

```



\### 7.4 页面四：资金流入分析页



第二阶段实现。



页面路径：



```text

/fund-flows

```



页面模块：



```text

1\. 当日资金流入前 5 品种

2\. 当日资金流出前 5 品种

3\. 资金流向柱状图

4\. 点击品种进入详情页

```



第一阶段暂不开发。



---



\## 8. 后端服务改造计划



\### 8.1 新增 seat\_tracker\_service.py



文件路径：



```text

backend/app/services/seat\_tracker\_service.py

```



功能：



```text

基于 positions\_日期.csv 生成期货席位追踪列表。

```



输入：



```text

positions\_日期.csv

```



输出：



```text

每个品种的席位追踪结果。

```



核心函数建议：



```python

load\_position\_records(date)

get\_available\_categories(date)

build\_seat\_tracker(date, signal=None, category=None, keyword=None)

get\_product\_broker\_summary(df, product)

get\_product\_contract\_summary(df, product)

get\_main\_and\_second\_contract(contract\_summary)

classify\_signal(broker\_summary, contract\_summary)

```



核心计算逻辑：



```text

按 product + broker 聚合：

long\_change\_sum = sum(long\_change)

short\_change\_sum = sum(short\_change)

net\_change = long\_change\_sum - short\_change\_sum

```



按 product + contract 聚合：



```text

contract\_long\_change = sum(long\_change)

contract\_short\_change = sum(short\_change)

contract\_net\_change = contract\_long\_change - contract\_short\_change

```



主力合约和次主力合约第一版可以按以下规则识别：



```text

按 abs(contract\_net\_change) 从大到小排序。

第一名作为主力合约。

第二名作为次主力合约。

```



注意：这个“主力合约”是当前分析意义上的主要变化合约，不一定等同于交易所官方主力合约。前端可以显示为：



```text

主要变化合约

次要变化合约

```



如果仍想沿用“主力合约”名称，需要在说明中注明当前是按变化量识别。



\### 8.2 新增 product\_analysis\_service.py



文件路径：



```text

backend/app/services/product\_analysis\_service.py

```



功能：



```text

生成品种详情页数据。

```



输入：



```text

positions\_日期.csv

```



输出：



```text

品种基础信息

五大席位汇总

合约汇总

合约-席位明细

席位对峙判断

```



核心函数建议：



```python

get\_product\_dashboard(date, product)

get\_product\_broker\_summary(date, product)

get\_product\_contract\_summary(date, product)

get\_product\_contract\_broker\_detail(date, product)

detect\_broker\_conflict(broker\_summary)

build\_product\_description(summary)

```



\### 8.3 第二阶段新增 fund\_flow\_service.py



文件路径：



```text

backend/app/services/fund\_flow\_service.py

```



第一阶段暂不开发，第二阶段使用。



功能：



```text

读取 fund\_flows\_日期.csv，生成资金流入 / 流出排行榜。

```



核心函数建议：



```python

load\_fund\_flows(date)

get\_top\_inflow\_products(date, limit=5)

get\_top\_outflow\_products(date, limit=5)

get\_product\_fund\_flow\_detail(date, product)

```



---



\## 9. 后端 API 设计



\### 9.1 期货席位追踪接口



接口：



```http

GET /api/seat-tracker

```



支持参数：



```text

date

signal

category

keyword

```



示例：



```http

GET /api/seat-tracker?date=2026-06-09

GET /api/seat-tracker?date=2026-06-09\&signal=strong\_long

GET /api/seat-tracker?date=2026-06-09\&category=化工

GET /api/seat-tracker?date=2026-06-09\&keyword=甲醇

```



返回结构：



```json

{

&nbsp; "date": "2026-06-09",

&nbsp; "total": 71,

&nbsp; "categories": \["农副", "黑色", "化工", "有色"],

&nbsp; "items": \[

&nbsp;   {

&nbsp;     "product": "棕榈油",

&nbsp;     "category": "农副",

&nbsp;     "signal": "strong\_long",

&nbsp;     "signal\_cn": "强看多",

&nbsp;     "main\_contract": "P2605",

&nbsp;     "main\_contract\_net\_change": 5743,

&nbsp;     "second\_contract": "P2609",

&nbsp;     "second\_contract\_net\_change": 1414,

&nbsp;     "all\_contract\_net\_change": 7157,

&nbsp;     "broker\_changes": \[

&nbsp;       {

&nbsp;         "broker": "高盛期货",

&nbsp;         "long\_change": 1000,

&nbsp;         "short\_change": 200,

&nbsp;         "net\_change": 800,

&nbsp;         "direction": "long",

&nbsp;         "direction\_cn": "偏多"

&nbsp;       },

&nbsp;       {

&nbsp;         "broker": "摩根大通",

&nbsp;         "long\_change": 0,

&nbsp;         "short\_change": 0,

&nbsp;         "net\_change": 0,

&nbsp;         "direction": "neutral",

&nbsp;         "direction\_cn": "中性"

&nbsp;       }

&nbsp;     ]

&nbsp;   }

&nbsp; ]

}

```



注意：



```text

不返回 strength 字段。

不返回 exchange 字段。

```



\### 9.2 板块列表接口



接口：



```http

GET /api/seat-tracker/categories

```



支持参数：



```text

date

```



示例：



```http

GET /api/seat-tracker/categories?date=2026-06-09

```



返回结构：



```json

{

&nbsp; "date": "2026-06-09",

&nbsp; "categories": \["农副", "黑色", "化工", "有色", "贵金属"]

}

```



\### 9.3 品种详情仪表盘接口



接口：



```http

GET /api/products/{product}/dashboard

```



支持参数：



```text

date

```



示例：



```http

GET /api/products/棕榈油/dashboard?date=2026-06-09

```



返回结构：



```json

{

&nbsp; "date": "2026-06-09",

&nbsp; "product": "棕榈油",

&nbsp; "category": "农副",

&nbsp; "signal": "strong\_long",

&nbsp; "signal\_cn": "强看多",

&nbsp; "summary": {

&nbsp;   "all\_contract\_net\_change": 7157,

&nbsp;   "main\_contract": "P2605",

&nbsp;   "main\_contract\_net\_change": 5743,

&nbsp;   "second\_contract": "P2609",

&nbsp;   "second\_contract\_net\_change": 1414,

&nbsp;   "has\_conflict": false,

&nbsp;   "description": "五大席位整体偏多，主力合约与全部合约方向一致。"

&nbsp; },

&nbsp; "broker\_summary": \[

&nbsp;   {

&nbsp;     "broker": "高盛期货",

&nbsp;     "long\_change": 1000,

&nbsp;     "short\_change": 200,

&nbsp;     "net\_change": 800,

&nbsp;     "direction": "long",

&nbsp;     "direction\_cn": "偏多"

&nbsp;   }

&nbsp; ],

&nbsp; "contract\_summary": \[

&nbsp;   {

&nbsp;     "contract": "P2605",

&nbsp;     "long\_change": 10000,

&nbsp;     "short\_change": 4257,

&nbsp;     "net\_change": 5743,

&nbsp;     "direction": "long",

&nbsp;     "direction\_cn": "偏多"

&nbsp;   }

&nbsp; ],

&nbsp; "contract\_broker\_detail": \[

&nbsp;   {

&nbsp;     "contract": "P2605",

&nbsp;     "broker": "高盛期货",

&nbsp;     "long\_position": 12345,

&nbsp;     "long\_change": 500,

&nbsp;     "short\_position": 6789,

&nbsp;     "short\_change": 200,

&nbsp;     "net\_change": 300,

&nbsp;     "direction": "long",

&nbsp;     "direction\_cn": "偏多"

&nbsp;   }

&nbsp; ]

}

```



\### 9.4 第二阶段资金流入排行接口



第二阶段再开发。



接口：



```http

GET /api/fund-flows/rank

```



支持参数：



```text

date

limit

```



返回：



```json

{

&nbsp; "date": "2026-06-09",

&nbsp; "top\_inflows": \[],

&nbsp; "top\_outflows": \[]

}

```



---



\## 10. 信号规则设计



第一版信号规则保持简单，不做复杂强度模型。



\### 10.1 席位净变化



核心公式：



```text

net\_change = long\_change - short\_change

```



方向判断：



```text

net\_change > 0：偏多

net\_change < 0：偏空

net\_change = 0：中性

```



为了避免极小变化干扰，可以设置简单阈值：



```text

NOISE\_THRESHOLD = 500

```



方向判断升级为：



```text

net\_change > 500：偏多

net\_change < -500：偏空

其他：中性

```



后续可以将固定阈值改为动态阈值。



\### 10.2 品种信号



对五大席位进行统计：



```text

long\_count = 偏多席位数

short\_count = 偏空席位数

neutral\_count = 中性席位数

```



信号规则：



```text

long\_count >= 3 且 short\_count <= 1 → strong\_long / 强看多

short\_count >= 3 且 long\_count <= 1 → strong\_short / 强看空

long\_count >= 2 且 short\_count >= 2 → conflict / 冲突

主力合约方向与全部合约方向一致，且方向不为中性 → positive / 正向

主力合约方向与全部合约方向相反 → reverse / 反向

其他 → neutral / 中性

```



注意：



```text

信号只是简单分类，不代表交易建议。

```



\### 10.3 对峙判断



对峙判断用于品种详情页。



规则：



```text

如果五大席位中，明显偏多席位数 >= 2 且明显偏空席位数 >= 2，则认为存在明显对峙。

```



输出：



```text

has\_conflict = true / false

```



解释文案：



```text

存在明显对峙：

国泰君安、摩根大通偏多；东方财富、徽商期货偏空，主力席位之间存在明显对峙。



不存在明显对峙：

五大席位整体方向较一致，暂未出现明显对峙。

```



---



\## 11. 前端改造计划



\### 11.1 路由规划



建议新增或完善 React Router。



页面路径：



```text

/

&nbsp;/seat-tracker

&nbsp;/products/:product

&nbsp;/fund-flows

```



第一阶段必须完成：



```text

/seat-tracker

/products/:product

```



第二阶段再完成：



```text

/fund-flows

```



\### 11.2 新增 SeatTracker.tsx



文件路径：



```text

frontend/src/pages/SeatTracker.tsx

```



功能：



```text

展示期货席位追踪列表。

```



页面组成：



```text

1\. 标题：期货席位追踪

2\. 日期选择器

3\. 信号筛选按钮组

4\. 板块筛选按钮组

5\. 品种关键词搜索框

6\. 席位追踪表格

```



表格列：



```text

品种

板块

信号

主力合约

主力合约净变化

次主力合约

次主力合约净变化

全部合约聚合净变化

高盛期货

摩根大通

国泰君安

东方财富

徽商期货

操作

```



视觉规则：



```text

正数：红色

负数：绿色

0 或无数据：灰色 / -

强看多：红色标签

强看空：绿色标签

冲突：黄色标签

正向：蓝色标签

反向：紫色标签

中性：灰色标签

```



\### 11.3 新增 ProductDashboard.tsx



文件路径：



```text

frontend/src/pages/ProductDashboard.tsx

```



功能：



```text

展示单个品种的席位和合约分析。

```



页面模块：



```text

1\. 品种标题区

2\. 信号结论卡片

3\. 五大席位净变化表

4\. 五大席位净变化柱状图

5\. 合约汇总表

6\. 合约净变化柱状图

7\. 合约-席位明细表

8\. 对峙分析说明

```



组件建议：



```text

BrokerSummaryTable.tsx

ContractSummaryTable.tsx

ContractBrokerDetailTable.tsx

BrokerNetChangeChart.tsx

ContractNetChangeChart.tsx

```



\### 11.4 第二阶段新增 FundFlows.tsx



文件路径：



```text

frontend/src/pages/FundFlows.tsx

```



功能：



```text

展示资金流入 / 流出前 5 品种。

```



第一阶段暂不开发。



---



\## 12. 前端 API 文件规划



新增：



```text

frontend/src/api/seatTrackerApi.ts

frontend/src/api/productDashboardApi.ts

```



第二阶段新增：



```text

frontend/src/api/fundFlowApi.ts

```



\### 12.1 seatTrackerApi.ts



函数：



```ts

fetchSeatTracker(params)

fetchSeatTrackerCategories(date)

```



\### 12.2 productDashboardApi.ts



函数：



```ts

fetchProductDashboard(product, date)

```



\### 12.3 fundFlowApi.ts



第二阶段函数：



```ts

fetchFundFlowRank(date, limit)

```



---



\## 13. 前端类型定义规划



新增：



```text

frontend/src/types/seatTracker.ts

frontend/src/types/productDashboard.ts

```



第二阶段新增：



```text

frontend/src/types/fundFlow.ts

```



\### 13.1 seatTracker.ts



建议类型：



```ts

export interface BrokerChange {

&nbsp; broker: string

&nbsp; long\_change: number

&nbsp; short\_change: number

&nbsp; net\_change: number

&nbsp; direction: string

&nbsp; direction\_cn: string

}



export interface SeatTrackerItem {

&nbsp; product: string

&nbsp; category: string

&nbsp; signal: string

&nbsp; signal\_cn: string

&nbsp; main\_contract: string

&nbsp; main\_contract\_net\_change: number

&nbsp; second\_contract: string

&nbsp; second\_contract\_net\_change: number

&nbsp; all\_contract\_net\_change: number

&nbsp; broker\_changes: BrokerChange\[]

}



export interface SeatTrackerResponse {

&nbsp; date: string

&nbsp; total: number

&nbsp; categories: string\[]

&nbsp; items: SeatTrackerItem\[]

}

```



\### 13.2 productDashboard.ts



建议类型：



```ts

export interface ProductSummary {

&nbsp; all\_contract\_net\_change: number

&nbsp; main\_contract: string

&nbsp; main\_contract\_net\_change: number

&nbsp; second\_contract: string

&nbsp; second\_contract\_net\_change: number

&nbsp; has\_conflict: boolean

&nbsp; description: string

}



export interface ProductDashboardResponse {

&nbsp; date: string

&nbsp; product: string

&nbsp; category: string

&nbsp; signal: string

&nbsp; signal\_cn: string

&nbsp; summary: ProductSummary

&nbsp; broker\_summary: BrokerChange\[]

&nbsp; contract\_summary: ContractSummary\[]

&nbsp; contract\_broker\_detail: ContractBrokerDetail\[]

}

```



---



\## 14. 推荐项目结构



后端新增：



```text

backend/app/api/

├── routes\_seat\_tracker.py

└── routes\_products.py



backend/app/services/

├── seat\_tracker\_service.py

└── product\_analysis\_service.py

```



前端新增：



```text

frontend/src/pages/

├── SeatTracker.tsx

└── ProductDashboard.tsx



frontend/src/components/seatTracker/

├── SignalFilter.tsx

├── CategoryFilter.tsx

└── SeatTrackerTable.tsx



frontend/src/components/product/

├── BrokerSummaryTable.tsx

├── ContractSummaryTable.tsx

├── ContractBrokerDetailTable.tsx

├── BrokerNetChangeChart.tsx

└── ContractNetChangeChart.tsx



frontend/src/api/

├── seatTrackerApi.ts

└── productDashboardApi.ts



frontend/src/types/

├── seatTracker.ts

└── productDashboard.ts

```



第二阶段新增：



```text

backend/app/services/fund\_flow\_service.py

backend/app/api/routes\_fund\_flows.py

frontend/src/pages/FundFlows.tsx

frontend/src/api/fundFlowApi.ts

frontend/src/types/fundFlow.ts

```



---



\## 15. Codex 执行任务拆分



\### Task 1：新增 seat\_tracker\_service.py



要求：



```text

1\. 读取 positions\_日期.csv。

2\. 按 product + broker 聚合 long\_change、short\_change。

3\. 计算 net\_change = long\_change - short\_change。

4\. 按 product + contract 聚合，计算合约净变化。

5\. 根据合约净变化绝对值识别主要变化合约和次要变化合约。

6\. 使用 category 字段作为板块。

7\. 生成 signal / signal\_cn。

8\. 不返回 strength 字段。

9\. 不使用 exchange 字段。

```



\### Task 2：新增 routes\_seat\_tracker.py



接口：



```http

GET /api/seat-tracker

GET /api/seat-tracker/categories

```



要求：



```text

1\. 支持 date 参数。

2\. 支持 signal 筛选。

3\. 支持 category 筛选。

4\. 支持 keyword 搜索。

5\. 如果 date 不传，默认使用 data 目录下最新 positions 日期。

```



\### Task 3：新增 ProductDashboard 后端逻辑



新增或改造：



```text

product\_analysis\_service.py

routes\_products.py

```



接口：



```http

GET /api/products/{product}/dashboard

```



要求：



```text

1\. 支持 date 参数。

2\. 返回品种基础信息。

3\. 返回五大席位汇总。

4\. 返回合约汇总。

5\. 返回合约-席位明细。

6\. 返回对峙判断和解释文案。

```



\### Task 4：前端新增 SeatTracker 页面



要求：



```text

1\. 新增 /seat-tracker 路由。

2\. 页面调用 /api/seat-tracker。

3\. 实现信号筛选。

4\. 实现板块筛选。

5\. 实现关键词搜索。

6\. 表格展示五大席位净变化。

7\. 点击品种进入 /products/:product。

8\. 不显示信号强度。

```



\### Task 5：前端新增 ProductDashboard 页面



要求：



```text

1\. 新增 /products/:product 路由。

2\. 调用 /api/products/{product}/dashboard。

3\. 展示信号结论。

4\. 展示五大席位变化。

5\. 展示合约汇总。

6\. 展示合约-席位明细。

7\. 展示对峙分析说明。

```



\### Task 6：清理旧页面中的 strength 展示



要求：



```text

1\. Dashboard 中不要再展示信号强度。

2\. TopSignalTable 中删除强度列。

3\. 图表中不再使用 strength 做核心排序。

4\. 如需排序，第一阶段可以按 abs(all\_contract\_net\_change) 排序，但前端不要命名为强度。

```



---



\## 16. 给 Codex 的直接执行说明



请按以下要求改造当前项目：



```text

当前项目要进行第一阶段大改。注意：当前 positions\_日期.csv 数据中没有 exchange 交易所字段，因此不要实现交易所筛选，不要强行推断交易所。



本阶段目标是基于已有字段完成“期货席位追踪”页面。



可用字段包括：

date

broker

category

product

contract

long\_position

long\_change

short\_position

short\_change



请完成以下任务：



1\. 后端新增 seat\_tracker\_service.py。

2\. 基于 positions\_日期.csv 生成席位追踪数据。

3\. 按 product + broker 聚合 long\_change、short\_change。

4\. 计算 net\_change = long\_change - short\_change。

5\. 按 product + contract 聚合，识别主要变化合约和次要变化合约。

6\. 使用 category 字段作为板块筛选字段。

7\. 不要使用 exchange 字段。

8\. 不要返回 strength 字段。

9\. 简单生成 signal / signal\_cn：

&nbsp;  - strong\_long：强看多

&nbsp;  - strong\_short：强看空

&nbsp;  - conflict：冲突

&nbsp;  - positive：正向

&nbsp;  - reverse：反向

&nbsp;  - neutral：中性

10\. 新增接口 GET /api/seat-tracker。

11\. 支持参数：date、signal、category、keyword。

12\. 新增接口 GET /api/seat-tracker/categories。

13\. 前端新增 SeatTracker.tsx 页面。

14\. 页面顶部保留信号筛选。

15\. 将原计划中的交易所筛选改为板块筛选。

16\. 表格列包括：

&nbsp;   - 品种

&nbsp;   - 板块

&nbsp;   - 信号

&nbsp;   - 主要变化合约

&nbsp;   - 主要变化合约净变化

&nbsp;   - 次要变化合约

&nbsp;   - 次要变化合约净变化

&nbsp;   - 全部合约聚合净变化

&nbsp;   - 五大席位净变化

17\. 点击品种跳转 /products/:product。

18\. 前端不展示任何信号强度相关内容。

19\. 保留旧接口，不要删除旧代码。

20\. 完成后确保 npm run dev 和 uvicorn 都能正常运行。

```



---



\## 17. 验收标准



\### 17.1 后端验收



以下接口可以正常返回：



```http

GET /api/seat-tracker?date=2026-06-09

GET /api/seat-tracker?date=2026-06-09\&signal=strong\_long

GET /api/seat-tracker?date=2026-06-09\&category=化工

GET /api/seat-tracker?date=2026-06-09\&keyword=甲醇

GET /api/seat-tracker/categories?date=2026-06-09

GET /api/products/甲醇/dashboard?date=2026-06-09

```



返回中不应出现：



```text

strength

exchange

```



除非后续阶段明确补充相关字段。



\### 17.2 前端验收



前端需要完成：



```text

1\. 打开 /seat-tracker，能看到期货席位追踪列表。

2\. 可以按信号筛选。

3\. 可以按板块筛选。

4\. 可以按关键词搜索品种。

5\. 表格中不出现信号强度。

6\. 表格中不出现交易所筛选。

7\. 点击品种能进入品种详情页。

8\. 品种详情页能看到五大席位变化。

9\. 品种详情页能看到合约汇总。

10\. 品种详情页能看到合约-席位明细。

```



\### 17.3 业务验收



系统应能回答：



```text

1\. 今天哪些品种主力席位明显偏多？

2\. 今天哪些品种主力席位明显偏空？

3\. 今天哪些品种主力席位存在冲突？

4\. 某个品种的变化主要集中在哪个合约？

5\. 某个品种是哪些席位在推动？

6\. 某个品种中不同席位是否出现明显对峙？

```



---



\## 18. 后续升级路线



\### 18.1 第二阶段：资金流入前 5 分析



在第一阶段稳定后，接入：



```text

fund\_flows\_日期.csv

broker\_structure\_日期.csv

```



新增：



```text

资金流入前 5

资金流出前 5

资金流入品种席位对峙分析

```



\### 18.2 第三阶段：补充 product\_meta.py



当需要复刻参考图中的交易所筛选时，再维护一个品种元数据表：



```python

PRODUCT\_META = {

&nbsp;   "棕榈油": {

&nbsp;       "code": "P",

&nbsp;       "exchange": "DCE",

&nbsp;       "exchange\_cn": "大商所"

&nbsp;   },

&nbsp;   "甲醇": {

&nbsp;       "code": "MA",

&nbsp;       "exchange": "CZCE",

&nbsp;       "exchange\_cn": "郑商所"

&nbsp;   }

}

```



补充后再支持：



```text

交易所筛选

品种代码展示

交易所标签

```



\### 18.3 第四阶段：数据库和缓存



当 CSV 数据变多后，再考虑：



```text

SQLite

DuckDB

Redis 缓存

定时任务

```



---



\## 19. 本次重构总结



本次重构的核心不是简单改页面，而是调整项目分析逻辑：



```text

从：机构 vs 散户矩阵 + 信号强度

到：五大席位 + 品种 + 合约持仓追踪

```



第一阶段要坚持两个原则：



```text

1\. 只使用当前真实存在的数据字段。

2\. 不强行实现当前数据无法支撑的交易所筛选。

```



因此，第一阶段最终实现目标是：



```text

期货席位追踪列表

\+

品种详情仪表盘

```



其中筛选方式为：



```text

信号筛选 + 板块筛选 + 品种搜索

```



而不是：



```text

信号筛选 + 交易所筛选

```



等第一阶段稳定后，再进入第二阶段，接入资金流入前 5 品种分析。



