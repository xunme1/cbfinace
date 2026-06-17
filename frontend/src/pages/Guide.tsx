import { Button, Card, Descriptions, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

interface SignalRule {
  name: string;
  condition: string;
  meaning: string;
}

interface DashboardGuideRow {
  section: string;
  content: string;
  howToRead: string;
  design: string;
}

const moduleRows = [
  {
    module: "仪表盘",
    path: "/",
    description:
      "快速查看市场概览、重点对手盘品种、机构 vs 散户矩阵和重点信号列表，是每天开盘前后最先看的页面。",
  },
  {
    module: "席位追踪",
    path: "/seat-tracker",
    description:
      "按日期、板块、信号和关键词筛选五大席位在各品种上的持仓变化，用于寻找当天结构最明显的品种。",
  },
  {
    module: "席位对对碰",
    path: "/seat-battle",
    description:
      "自由选择两个席位阵营，比较它们在各品种和各合约上的持仓变化，适合做自定义席位组合验证。",
  },
  {
    module: "历史趋势",
    path: "/trends",
    description:
      "查看品种最近多个交易日的信号连续性、主力/散户方向和累计变化，用于判断信号是否持续。",
  },
  {
    module: "资金流向",
    path: "/fund-flows",
    description:
      "查看五大席位资金流入、流出排名，并可进入单品种详情，联动观察资金流和持仓变化。",
  },
  {
    module: "品种详情",
    path: "/products/:product",
    description:
      "查看单个品种的五大席位持仓、合约汇总、合约-席位明细和当前信号，是确认结论的详情页。",
  },
  {
    module: "旧版信号",
    path: "/signals",
    description:
      "保留旧版机构 / 散户矩阵信号，方便做历史口径对照和复盘。",
  },
];

const dashboardGuideRows: DashboardGuideRow[] = [
  {
    section: "顶部概览卡片",
    content:
      "展示当日品种数量、重点信号数量、对手盘数量等核心统计，让用户先判断今天市场结构是否活跃。",
    howToRead:
      "如果对手盘数量明显增多，说明主力席位与散户席位相反的品种更多，当天更值得做重点筛选；如果整体信号偏少，则说明市场席位结构不够集中。",
    design:
      "概览卡片只做快速扫读，不直接给交易结论，真正的品种判断需要继续看下方图表和详情页。",
  },
  {
    section: "信号类型分布",
    content:
      "统计当日不同信号类型的数量，例如对手盘、机构突击、共振、噪音等。",
    howToRead:
      "重点看对手盘和机构突击的占比。对手盘代表主力与散户方向相反，机构突击代表主力席位单边动作明显；共振和噪音更多作为背景信息，不作为强信号直接使用。",
    design:
      "该图用于观察当天信号结构是否集中。如果某类信号占比异常高，说明当天席位变化可能有明显风格。",
  },
  {
    section: "重点对手盘品种",
    content:
      "只展示主力席位和散户席位方向相反的重点品种，过滤掉机构与散户同向的普通品种。",
    howToRead:
      "柱子越长，说明该品种的阵营差异越明显。优先观察排名靠前的品种，再进入详情页查看是哪些席位、哪些合约贡献了变化。",
    design:
      "柱状图上的品种可以点击，点击后直接跳转到对应品种详情页。图中强调的是重点对手盘，不把同向品种混在一起，避免干扰判断。",
  },
  {
    section: "机构 vs 散户矩阵散点图",
    content:
      "横轴和纵轴分别代表机构阵营、散户阵营的持仓变化方向与力度，用来观察各品种在两个阵营之间的相对位置。",
    howToRead:
      "机构与散户方向相反的点是重点观察对象。红色高亮点代表需要优先看的对手盘品种；颜色较淡的点代表普通信号或辅助观察信号。",
    design:
      "散点图支持点击品种点位跳转详情页。图中重点信号使用更鲜艳的红色，是为了让用户一眼找到主力和散户出现明显分歧的品种。",
  },
  {
    section: "重点信号列表",
    content:
      "把当日重点品种以表格形式列出，展示品种、板块、机构方向、散户方向、净变化和信号说明。",
    howToRead:
      "先看信号类型，再看机构和散户方向是否相反，最后看净变化是否足够明显。列表适合做精确筛选，图表适合做快速发现。",
    design:
      "表格保留查看详情入口，方便从全市场概览下钻到单品种的席位和合约明细。",
  },
];

const oldSignalRows: SignalRule[] = [
  {
    name: "对手盘",
    condition: "机构做多、散户做空；或机构做空、散户做多。",
    meaning:
      "机构与散户方向相反，是首页重点关注的旧版矩阵信号。",
  },
  {
    name: "共振",
    condition: "机构和散户同时做多，或同时做空。",
    meaning:
      "方向一致，只说明市场行为同向，不作为当前强信号筛选依据。",
  },
  {
    name: "机构突击",
    condition: "机构方向明显，散户接近中性。",
    meaning:
      "主力席位单边动作明显，需要结合品种详情继续确认。",
  },
  {
    name: "散户自嗨",
    condition: "散户方向明显，机构接近中性。",
    meaning:
      "偏情绪观察，通常不作为强确认。",
  },
  {
    name: "噪音",
    condition: "机构和散户变化都不明显。",
    meaning:
      "暂未形成明确结构。",
  },
];

const newSignalRows: SignalRule[] = [
  {
    name: "强看多",
    condition: "三大主力席位整体偏多，同时两大散户席位整体偏空。",
    meaning:
      "主力与散户形成反向结构，且主力方向在多头一侧，是更值得关注的看多结构。",
  },
  {
    name: "强看空",
    condition: "三大主力席位整体偏空，同时两大散户席位整体偏多。",
    meaning:
      "主力与散户形成反向结构，且主力方向在空头一侧，是更值得关注的看空结构。",
  },
  {
    name: "冲突",
    condition: "主力与散户整体方向相反，但强度未达到强信号门槛。",
    meaning:
      "两个阵营已经对峙，需要看合约和席位细节确认强弱。",
  },
  {
    name: "正向",
    condition: "主力与散户整体同向，或主要变化合约与整体方向一致。",
    meaning:
      "方向一致但缺少散户反向确认，不作为强信号。",
  },
  {
    name: "反向",
    condition: "主要变化合约方向与全部合约聚合方向相反。",
    meaning:
      "品种内部合约变化存在背离，需要进入详情页确认。",
  },
  {
    name: "中性",
    condition: "其他情况。",
    meaning:
      "暂未形成明确结构。",
  },
];

const moduleColumns: ColumnsType<(typeof moduleRows)[number]> = [
  { title: "模块", dataIndex: "module", key: "module", width: 120 },
  { title: "路径", dataIndex: "path", key: "path", width: 180 },
  { title: "功能", dataIndex: "description", key: "description" },
];

const dashboardColumns: ColumnsType<DashboardGuideRow> = [
  { title: "区域", dataIndex: "section", key: "section", width: 160 },
  { title: "展示内容", dataIndex: "content", key: "content" },
  { title: "怎么看", dataIndex: "howToRead", key: "howToRead" },
  { title: "特殊设计", dataIndex: "design", key: "design" },
];

const signalColumns: ColumnsType<SignalRule> = [
  { title: "术语", dataIndex: "name", key: "name", width: 120 },
  { title: "判断条件", dataIndex: "condition", key: "condition" },
  { title: "业务含义", dataIndex: "meaning", key: "meaning" },
];

export default function Guide() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <div className="page-title-row">
          <div>
            <Title level={2}>系统介绍文档</Title>
            <Paragraph type="secondary">
              说明各功能板块、首页仪表盘读图方法、信号术语、判断口径和数据来源。
            </Paragraph>
          </div>
          <Button onClick={() => navigate(-1)}>返回</Button>
        </div>

        <Card title="功能板块">
          <Table
            rowKey={(record) => record.module}
            columns={moduleColumns}
            dataSource={moduleRows}
            pagination={false}
          />
        </Card>

        <Card title="首页仪表盘怎么看">
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Paragraph>
              首页仪表盘的定位是“先发现重点，再进入详情确认”。用户不需要先看完整表格，
              可以先通过概览卡片、重点对手盘柱状图和机构 vs 散户散点图，快速找到当天最值得观察的品种。
            </Paragraph>
            <Table
              rowKey={(record) => record.section}
              columns={dashboardColumns}
              dataSource={dashboardGuideRows}
              pagination={false}
              scroll={{ x: 1100 }}
            />
          </Space>
        </Card>

        <Card title="首页重点颜色和交互说明">
          <Descriptions bordered column={{ xs: 1, md: 2 }}>
            <Descriptions.Item label="红色高亮">
              代表重点观察的对手盘品种，也就是主力席位和散户席位方向相反的品种。
            </Descriptions.Item>
            <Descriptions.Item label="淡蓝 / 淡绿等辅助色">
              代表普通信号或辅助观察信号，用于保留市场背景，但不抢重点品种的视觉优先级。
            </Descriptions.Item>
            <Descriptions.Item label="柱状图点击" span={2}>
              重点对手盘柱状图上的品种可以点击，点击后进入对应品种详情页，继续查看五大席位、合约持仓和净变化。
            </Descriptions.Item>
            <Descriptions.Item label="散点图点击" span={2}>
              机构 vs 散户矩阵中的点位也可以点击。看到红色重点点位后，可以直接点击进入详情页，
              不需要再回表格里搜索品种。
            </Descriptions.Item>
            <Descriptions.Item label="为什么突出对手盘" span={2}>
              本系统的核心逻辑是把主力席位视为主要观察对象，把散户席位视为反向参照。
              当两边方向相反时，说明市场结构更有分歧，也更值得进一步确认。
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="席位分组">
          <Descriptions bordered column={{ xs: 1, md: 2 }}>
            <Descriptions.Item label="三大主力席位">
              高盛期货、摩根大通、国泰君安
            </Descriptions.Item>
            <Descriptions.Item label="两大散户席位">
              东方财富、徽商期货
            </Descriptions.Item>
            <Descriptions.Item label="核心原则" span={2}>
              强信号来自主力席位与散户席位反向，而不是所有席位同向。
              机构和散户同时做多或同时做空，更多说明市场行为一致，不是本系统最强调的强信号。
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="旧版矩阵信号">
          <Table
            rowKey={(record) => record.name}
            columns={signalColumns}
            dataSource={oldSignalRows}
            pagination={false}
          />
        </Card>

        <Card title="新版席位信号">
          <Table
            rowKey={(record) => record.name}
            columns={signalColumns}
            dataSource={newSignalRows}
            pagination={false}
          />
        </Card>

        <Card title="核心计算方法">
          <Space direction="vertical" size={12}>
            <Text>
              持仓方向：系统会比较某个席位当天多头持仓和空头持仓的变化。
              如果多头增加得更多，就认为这个席位偏多；如果空头增加得更多，就认为这个席位偏空。
            </Text>
            <Text>
              噪音过滤：很小的变化容易只是正常波动。系统会过滤掉这类小变化，
              只有变化达到一定幅度后，才会标记为偏多或偏空。
            </Text>
            <Text>
              阵营判断：系统先把高盛期货、摩根大通、国泰君安归为主力观察席位，
              把东方财富、徽商期货归为散户观察席位，再比较两个阵营的整体方向是否相反。
            </Text>
            <Text>
              重点对手盘：当主力席位和散户席位方向相反时，系统会把这个品种列为重点观察对象。
              同向品种只说明市场行为一致，不作为首页重点品种。
            </Text>
            <Text>
              主要变化合约：系统会在同一个品种的多个合约中，找出当天持仓变化最明显的合约，
              用来帮助判断变化主要发生在哪里。
            </Text>
          </Space>
        </Card>

        <Card title="数据来源">
          <Space direction="vertical" size={12}>
            <Text>
              持仓数据来自交易可查页面抓取后的 CSV 文件，文件通常保存在后端
              <Text code>data</Text> 目录中。
            </Text>
            <Text>
              席位追踪主要使用每日五大席位持仓变化数据，包括多头持仓、多头变化、空头持仓和空头变化。
            </Text>
            <Text>
              资金流向页面使用交易可查的大资金动向数据，用于观察品种资金净流入和净流出。
            </Text>
            <Text>
              当前系统展示的是结构化观察结果，不等同于交易建议。
            </Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
}
