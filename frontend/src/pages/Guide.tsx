import { Button, Card, Descriptions, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

interface SignalRule {
  name: string;
  condition: string;
  meaning: string;
}

const moduleRows = [
  {
    module: "仪表盘",
    path: "/",
    description: "快速查看市场概览、重点对手盘品种、机构 vs 散户矩阵和重点信号列表。",
  },
  {
    module: "席位追踪",
    path: "/seat-tracker",
    description: "按日期、板块、信号和关键词筛选五大席位在各品种上的持仓变化。",
  },
  {
    module: "席位对对碰",
    path: "/seat-battle",
    description: "自由选择两个席位阵营，比较它们在各品种和各合约上的持仓变化。",
  },
  {
    module: "历史趋势",
    path: "/trends",
    description: "查看品种最近多个交易日的信号连续性、主力/散户方向和累计变化。",
  },
  {
    module: "资金流向",
    path: "/fund-flows",
    description: "查看五大席位资金流入、流出排名，并可进入单品种资金流详情。",
  },
  {
    module: "品种详情",
    path: "/products/:product",
    description: "查看单个品种的五大席位持仓、合约汇总、合约-席位明细和当前信号。",
  },
  {
    module: "旧版信号",
    path: "/signals",
    description: "保留旧版机构 / 散户矩阵信号，方便做历史口径对照。",
  },
];

const oldSignalRows: SignalRule[] = [
  {
    name: "对手盘",
    condition: "机构做多、散户做空；或机构做空、散户做多",
    meaning: "机构与散户方向相反，是当前首页重点关注的旧版矩阵信号。",
  },
  {
    name: "共振",
    condition: "机构和散户同时做多；或同时做空",
    meaning: "方向一致，但不作为当前重点品种筛选依据。",
  },
  {
    name: "机构突击",
    condition: "机构方向明显，散户接近中性",
    meaning: "机构单边动作明显，需要结合品种详情继续确认。",
  },
  {
    name: "散户自嗨",
    condition: "散户方向明显，机构接近中性",
    meaning: "偏情绪观察，通常不作为强确认。",
  },
  {
    name: "噪音",
    condition: "机构和散户变化都未超过噪音阈值",
    meaning: "暂无明确结构。",
  },
];

const newSignalRows: SignalRule[] = [
  {
    name: "强看多",
    condition: "三大主力席位整体偏多，同时两大散户席位整体偏空",
    meaning: "主力与散户形成反向结构，且主力方向在多头一侧。",
  },
  {
    name: "强看空",
    condition: "三大主力席位整体偏空，同时两大散户席位整体偏多",
    meaning: "主力与散户形成反向结构，且主力方向在空头一侧。",
  },
  {
    name: "冲突",
    condition: "主力与散户整体方向相反，但未达到强信号门槛",
    meaning: "两个阵营已对峙，需要看合约和席位细节。",
  },
  {
    name: "正向",
    condition: "主力与散户整体同向，或主要变化合约与整体方向一致",
    meaning: "方向一致但缺少反向确认，不作为强信号。",
  },
  {
    name: "反向",
    condition: "主要变化合约方向与全部合约聚合方向相反",
    meaning: "品种内部合约变化存在背离。",
  },
  {
    name: "中性",
    condition: "其他情况",
    meaning: "暂未形成明确结构。",
  },
];

const moduleColumns: ColumnsType<(typeof moduleRows)[number]> = [
  { title: "模块", dataIndex: "module", key: "module", width: 120 },
  { title: "路径", dataIndex: "path", key: "path", width: 180 },
  { title: "功能", dataIndex: "description", key: "description" },
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
              说明各功能板块、信号术语、判断口径和核心计算方法。
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
              噪音过滤：很小的变化容易只是正常波动，系统会过滤掉这类小变化，
              只有变化达到一定幅度后才会标记为偏多或偏空。
            </Text>
            <Text>
              机构 / 散户矩阵：系统先把高盛期货、摩根大通、国泰君安归为主力观察席位，
              把东方财富、徽商期货归为散户观察席位，再比较两个阵营的方向是否相同。
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
