import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import ReactECharts from "echarts-for-react";
import { fetchProductDashboard } from "../api/productDashboardApi";
import type {
  ContractBrokerDetail,
  ContractSummary,
  ProductDashboardResponse,
} from "../types/productDashboard";
import type { BrokerChange } from "../types/seatTracker";

const { Title, Paragraph } = Typography;

const LONG_POSITION_COLOR = "#f6b08f";
const LONG_INCREASE_COLOR = "#e76f51";
const LONG_DECREASE_COLOR = "#fbd1bd";
const SHORT_POSITION_COLOR = "#8ecae6";
const SHORT_INCREASE_COLOR = "#277da1";
const SHORT_DECREASE_COLOR = "#c7e8f6";
const POSITION_CHART_COLORS = [
  LONG_POSITION_COLOR,
  LONG_INCREASE_COLOR,
  SHORT_POSITION_COLOR,
  SHORT_INCREASE_COLOR,
];

function formatNumber(value: number) {
  return value.toLocaleString();
}

function getSignalColor(signal: string) {
  if (signal === "strong_long") return "red";
  if (signal === "strong_short") return "green";
  if (signal === "conflict") return "gold";
  if (signal === "positive") return "blue";
  if (signal === "reverse") return "purple";
  return "default";
}

function getNumberColor(value: number) {
  if (value > 0) return "#cf1322";
  if (value < 0) return "#389e0d";
  return "#6b7280";
}

function formatChange(value: number) {
  if (value > 0) return `+${formatNumber(value)}`;
  return formatNumber(value);
}

function PositionChange({
  position,
  change,
}: {
  position: number;
  change: number;
}) {
  return (
    <span>
      {formatNumber(position)}
      <span style={{ color: getNumberColor(change) }}>
        （{formatChange(change)}）
      </span>
    </span>
  );
}

function buildPositionBarData(position: number, change: number) {
  const absChange = Math.abs(change);

  if (change > 0) {
    return {
      base: Math.max(position - absChange, 0),
      change: absChange,
    };
  }

  return {
    base: position,
    change: absChange,
  };
}

function getLongChangeColor(change: number) {
  return change >= 0 ? LONG_INCREASE_COLOR : LONG_DECREASE_COLOR;
}

function getShortChangeColor(change: number) {
  return change >= 0 ? SHORT_INCREASE_COLOR : SHORT_DECREASE_COLOR;
}

function DirectionTag({ direction, label }: { direction: string; label: string }) {
  const color = direction === "long" ? "red" : direction === "short" ? "green" : "default";
  return <Tag color={color}>{label}</Tag>;
}

export default function ProductDashboard() {
  const navigate = useNavigate();
  const { product } = useParams();
  const [searchParams] = useSearchParams();

  const productName = product ? decodeURIComponent(product) : "";
  const date = searchParams.get("date") || "2026-06-09";

  const [data, setData] = useState<ProductDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData() {
    if (!productName) {
      setErrorMessage("缺少品种名称。");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const result = await fetchProductDashboard(productName, date);
      setData(result);
    } catch (error) {
      console.error(error);
      setErrorMessage("品种席位仪表盘加载失败，请确认该日期下存在该品种数据。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [productName, date]);

  const brokerChartOption = useMemo(() => {
    if (!data) return null;

    const chartData = [...data.broker_summary].reverse();
    const longBars = chartData.map((item) =>
      buildPositionBarData(item.long_position, item.long_change)
    );
    const shortBars = chartData.map((item) =>
      buildPositionBarData(item.short_position, item.short_change)
    );

    return {
      color: POSITION_CHART_COLORS,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const raw = chartData[params[0].dataIndex];

          return [
            raw.broker,
            `多头持仓：${formatNumber(raw.long_position)}（${formatChange(raw.long_change)}）`,
            `空头持仓：${formatNumber(raw.short_position)}（${formatChange(raw.short_change)}）`,
            `多头变化：${formatChange(raw.long_change)}`,
            `空头变化：${formatChange(raw.short_change)}`,
            `多空净变化：${formatChange(raw.net_change)}`,
          ].join("<br/>");
        },
      },
      legend: { show: false },
      grid: { left: 90, right: 32, top: 24, bottom: 32 },
      xAxis: { type: "value", name: "持仓量" },
      yAxis: {
        type: "category",
        data: chartData.map((item) => item.broker),
      },
      series: [
        {
          name: "多头持仓",
          type: "bar",
          stack: "long",
          data: longBars.map((item) => item.base),
          itemStyle: { color: LONG_POSITION_COLOR },
        },
        {
          name: "多头增减",
          type: "bar",
          stack: "long",
          data: longBars.map((item) => item.change),
          itemStyle: {
            color: (params: any) => getLongChangeColor(chartData[params.dataIndex].long_change),
          },
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => {
              const raw = chartData[params.dataIndex];
              return `${formatNumber(raw.long_position)}（${formatChange(raw.long_change)}）`;
            },
          },
        },
        {
          name: "空头持仓",
          type: "bar",
          stack: "short",
          data: shortBars.map((item) => item.base),
          itemStyle: { color: SHORT_POSITION_COLOR },
        },
        {
          name: "空头增减",
          type: "bar",
          stack: "short",
          data: shortBars.map((item) => item.change),
          itemStyle: {
            color: (params: any) => getShortChangeColor(chartData[params.dataIndex].short_change),
          },
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => {
              const raw = chartData[params.dataIndex];
              return `${formatNumber(raw.short_position)}（${formatChange(raw.short_change)}）`;
            },
          },
        },
      ],
    };
  }, [data]);

  const contractChartOption = useMemo(() => {
    if (!data) return null;

    const chartData = [...data.contract_summary].slice(0, 10).reverse();
    const longBars = chartData.map((item) =>
      buildPositionBarData(item.long_position, item.long_change)
    );
    const shortBars = chartData.map((item) =>
      buildPositionBarData(item.short_position, item.short_change)
    );

    return {
      color: POSITION_CHART_COLORS,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const raw = chartData[params[0].dataIndex];

          return [
            raw.contract,
            `多头持仓：${formatNumber(raw.long_position)}（${formatChange(raw.long_change)}）`,
            `空头持仓：${formatNumber(raw.short_position)}（${formatChange(raw.short_change)}）`,
            `多头变化：${formatChange(raw.long_change)}`,
            `空头变化：${formatChange(raw.short_change)}`,
            `多空净变化：${formatChange(raw.net_change)}`,
          ].join("<br/>");
        },
      },
      legend: { show: false },
      grid: { left: 90, right: 32, top: 24, bottom: 32 },
      xAxis: { type: "value", name: "持仓量" },
      yAxis: {
        type: "category",
        data: chartData.map((item) => item.contract),
      },
      series: [
        {
          name: "多头持仓",
          type: "bar",
          stack: "long",
          data: longBars.map((item) => item.base),
          itemStyle: { color: LONG_POSITION_COLOR },
        },
        {
          name: "多头增减",
          type: "bar",
          stack: "long",
          data: longBars.map((item) => item.change),
          itemStyle: {
            color: (params: any) => getLongChangeColor(chartData[params.dataIndex].long_change),
          },
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => {
              const raw = chartData[params.dataIndex];
              return `${formatNumber(raw.long_position)}（${formatChange(raw.long_change)}）`;
            },
          },
        },
        {
          name: "空头持仓",
          type: "bar",
          stack: "short",
          data: shortBars.map((item) => item.base),
          itemStyle: { color: SHORT_POSITION_COLOR },
        },
        {
          name: "空头增减",
          type: "bar",
          stack: "short",
          data: shortBars.map((item) => item.change),
          itemStyle: {
            color: (params: any) => getShortChangeColor(chartData[params.dataIndex].short_change),
          },
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => {
              const raw = chartData[params.dataIndex];
              return `${formatNumber(raw.short_position)}（${formatChange(raw.short_change)}）`;
            },
          },
        },
      ],
    };
  }, [data]);

  const brokerNetChartOption = useMemo(() => {
    if (!data) return null;

    const chartData = [...data.broker_summary].reverse();

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const raw = chartData[params[0].dataIndex];

          return [
            raw.broker,
            `多空净变化：${formatChange(raw.net_change)}`,
            `多头变化：${formatChange(raw.long_change)}`,
            `空头变化：${formatChange(raw.short_change)}`,
          ].join("<br/>");
        },
      },
      grid: { left: 90, right: 32, top: 24, bottom: 32 },
      xAxis: { type: "value", name: "净变化" },
      yAxis: {
        type: "category",
        data: chartData.map((item) => item.broker),
      },
      series: [
        {
          name: "净变化",
          type: "bar",
          data: chartData.map((item) => item.net_change),
          itemStyle: {
            color: (params: any) => (Number(params.value) >= 0 ? "#f5222d" : "#389e0d"),
          },
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => formatChange(Number(params.value)),
          },
        },
      ],
    };
  }, [data]);

  const contractNetChartOption = useMemo(() => {
    if (!data) return null;

    const chartData = [...data.contract_summary].slice(0, 10).reverse();

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const raw = chartData[params[0].dataIndex];

          return [
            raw.contract,
            `多空净变化：${formatChange(raw.net_change)}`,
            `多头变化：${formatChange(raw.long_change)}`,
            `空头变化：${formatChange(raw.short_change)}`,
          ].join("<br/>");
        },
      },
      grid: { left: 90, right: 32, top: 24, bottom: 32 },
      xAxis: { type: "value", name: "净变化" },
      yAxis: {
        type: "category",
        data: chartData.map((item) => item.contract),
      },
      series: [
        {
          name: "净变化",
          type: "bar",
          data: chartData.map((item) => item.net_change),
          itemStyle: {
            color: (params: any) => (Number(params.value) >= 0 ? "#f5222d" : "#389e0d"),
          },
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => formatChange(Number(params.value)),
          },
        },
      ],
    };
  }, [data]);

  const brokerColumns: ColumnsType<BrokerChange> = [
    { title: "席位", dataIndex: "broker", key: "broker" },
    {
      title: "多头",
      key: "long",
      align: "right",
      render: (_, record) => (
        <PositionChange
          position={record.long_position}
          change={record.long_change}
        />
      ),
    },
    {
      title: "空头",
      key: "short",
      align: "right",
      render: (_, record) => (
        <PositionChange
          position={record.short_position}
          change={record.short_change}
        />
      ),
    },
    {
      title: "净变化",
      dataIndex: "net_change",
      key: "net_change",
      align: "right",
      sorter: (a, b) => a.net_change - b.net_change,
      render: (value: number) => (
        <span style={{ color: getNumberColor(value) }}>{formatNumber(value)}</span>
      ),
    },
    {
      title: "方向",
      dataIndex: "direction_cn",
      key: "direction",
      render: (value: string, record) => (
        <DirectionTag direction={record.direction} label={value} />
      ),
    },
  ];

  const contractColumns: ColumnsType<ContractSummary> = [
    { title: "合约", dataIndex: "contract", key: "contract" },
    {
      title: "多头",
      key: "long",
      align: "right",
      render: (_, record) => (
        <PositionChange
          position={record.long_position}
          change={record.long_change}
        />
      ),
    },
    {
      title: "空头",
      key: "short",
      align: "right",
      render: (_, record) => (
        <PositionChange
          position={record.short_position}
          change={record.short_change}
        />
      ),
    },
    {
      title: "净变化",
      dataIndex: "net_change",
      key: "net_change",
      align: "right",
      sorter: (a, b) => a.net_change - b.net_change,
      render: (value: number) => (
        <span style={{ color: getNumberColor(value) }}>{formatNumber(value)}</span>
      ),
    },
    {
      title: "方向",
      dataIndex: "direction_cn",
      key: "direction",
      render: (value: string, record) => (
        <DirectionTag direction={record.direction} label={value} />
      ),
    },
  ];

  const detailColumns: ColumnsType<ContractBrokerDetail> = [
    { title: "合约", dataIndex: "contract", key: "contract", fixed: "left", width: 110 },
    { title: "席位", dataIndex: "broker", key: "broker", width: 130 },
    {
      title: "多头",
      key: "long",
      align: "right",
      width: 150,
      render: (_, record) => (
        <PositionChange
          position={record.long_position}
          change={record.long_change}
        />
      ),
    },
    {
      title: "空头",
      key: "short",
      align: "right",
      width: 150,
      render: (_, record) => (
        <PositionChange
          position={record.short_position}
          change={record.short_change}
        />
      ),
    },
    {
      title: "净变化",
      dataIndex: "net_change",
      key: "net_change",
      align: "right",
      sorter: (a, b) => a.net_change - b.net_change,
      render: (value: number) => (
        <span style={{ color: getNumberColor(value) }}>{formatNumber(value)}</span>
      ),
    },
    {
      title: "方向",
      dataIndex: "direction_cn",
      key: "direction",
      render: (value: string, record) => (
        <DirectionTag direction={record.direction} label={value} />
      ),
    },
  ];

  return (
    <div className="page">
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <Button onClick={() => navigate(-1)}>返回</Button>

        <div>
          <Title level={2}>{productName} 席位持仓详情</Title>
          <Paragraph type="secondary">
            展示该品种五大席位、主要变化合约和合约-席位明细。
          </Paragraph>
        </div>

        {errorMessage && (
          <Alert type="error" message="加载失败" description={errorMessage} showIcon />
        )}

        {loading && (
          <Card>
            <Spin />
            <span style={{ marginLeft: 12 }}>正在加载品种席位数据...</span>
          </Card>
        )}

        {!loading && data && (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic title="全部合约净变化" value={data.summary.all_contract_net_change} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic title="主要变化合约" value={data.summary.main_contract || "-"} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic title="主要合约净变化" value={data.summary.main_contract_net_change} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic title="所属板块" value={data.category} valueStyle={{ fontSize: 24 }} />
                </Card>
              </Col>
            </Row>

            <Card title="当前信号结论">
              <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="品种">{data.product}</Descriptions.Item>
                <Descriptions.Item label="板块">{data.category}</Descriptions.Item>
                <Descriptions.Item label="日期">{data.date}</Descriptions.Item>
                <Descriptions.Item label="当前信号">
                  <Tag color={getSignalColor(data.signal)}>{data.signal_cn}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="主要变化合约">
                  {data.summary.main_contract || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="次要变化合约">
                  {data.summary.second_contract || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="席位对峙" span={3}>
                  {data.summary.description}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="五大席位多空变化">
                  {brokerChartOption && (
                    <ReactECharts option={brokerChartOption} style={{ height: 340 }} />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="合约多空变化">
                  {contractChartOption && (
                    <ReactECharts option={contractChartOption} style={{ height: 340 }} />
                  )}
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="五大席位净变化对比">
                  {brokerNetChartOption && (
                    <ReactECharts option={brokerNetChartOption} style={{ height: 340 }} />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="合约净变化对比">
                  {contractNetChartOption && (
                    <ReactECharts option={contractNetChartOption} style={{ height: 340 }} />
                  )}
                </Card>
              </Col>
            </Row>

            <Card title="五大席位总体变化">
              <Table
                rowKey={(record) => record.broker}
                columns={brokerColumns}
                dataSource={data.broker_summary}
                pagination={false}
                scroll={{ x: 700 }}
              />
            </Card>

            <Card title="合约汇总">
              <Table
                rowKey={(record) => record.contract}
                columns={contractColumns}
                dataSource={data.contract_summary}
                pagination={false}
                scroll={{ x: 700 }}
              />
            </Card>

            <Card title="合约-席位明细">
              <Table
                rowKey={(record) => `${record.contract}-${record.broker}`}
                columns={detailColumns}
                dataSource={data.contract_broker_detail}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (count) => `共 ${count} 条`,
                }}
                scroll={{ x: 1100 }}
              />
            </Card>
          </>
        )}
      </Space>
    </div>
  );
}
