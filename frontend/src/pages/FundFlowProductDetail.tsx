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
import { fetchProductFundFlowDetail } from "../api/fundFlowApi";
import { fetchProductDashboard } from "../api/productDashboardApi";
import { useDragScroll } from "../hooks/useDragScroll";
import type { FundFlowDetailItem, FundFlowProductDetailResponse } from "../types/fundFlow";
import type {
  ContractSummary,
  ProductDashboardResponse,
} from "../types/productDashboard";
import type { BrokerChange } from "../types/seatTracker";

const { Title, Paragraph } = Typography;

function formatNumber(value: number) {
  return value.toLocaleString();
}

function formatMoney(value: number) {
  const absValue = Math.abs(value);

  if (absValue >= 100000000) {
    return `${(value / 100000000).toFixed(2)} 亿`;
  }

  if (absValue >= 10000) {
    return `${(value / 10000).toFixed(2)} 万`;
  }

  return value.toLocaleString();
}

function getValueColor(value: number) {
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
      <span style={{ color: getValueColor(change) }}>
        （{formatChange(change)}）
      </span>
    </span>
  );
}

function getSignalColor(signal: string) {
  if (signal === "strong_long") return "red";
  if (signal === "strong_short") return "green";
  if (signal === "conflict") return "gold";
  if (signal === "positive") return "blue";
  if (signal === "reverse") return "purple";
  return "default";
}

function DirectionTag({ direction, label }: { direction: string; label: string }) {
  const color = direction === "long" ? "red" : direction === "short" ? "green" : "default";
  return <Tag color={color}>{label}</Tag>;
}

export default function FundFlowProductDetail() {
  const navigate = useNavigate();
  const { product } = useParams();
  const [searchParams] = useSearchParams();
  const fundFlowTableDrag = useDragScroll();
  const contractTableDrag = useDragScroll();

  const productName = product ? decodeURIComponent(product) : "";
  const date = searchParams.get("date") || "2026-03-27";

  const [fundFlowData, setFundFlowData] =
    useState<FundFlowProductDetailResponse | null>(null);
  const [positionData, setPositionData] = useState<ProductDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fundFlowError, setFundFlowError] = useState("");
  const [positionError, setPositionError] = useState("");

  async function loadData() {
    if (!productName) {
      setFundFlowError("缺少品种名称。");
      return;
    }

    try {
      setLoading(true);
      setFundFlowError("");
      setPositionError("");

      const [fundFlowResult, positionResult] = await Promise.allSettled([
        fetchProductFundFlowDetail(productName, date),
        fetchProductDashboard(productName, date),
      ]);

      if (fundFlowResult.status === "fulfilled") {
        setFundFlowData(fundFlowResult.value);
      } else {
        console.error(fundFlowResult.reason);
        setFundFlowData(null);
        setFundFlowError("资金流详情加载失败，请确认存在对应日期的 fund_flows CSV。");
      }

      if (positionResult.status === "fulfilled") {
        setPositionData(positionResult.value);
      } else {
        console.error(positionResult.reason);
        setPositionData(null);
        setPositionError("五大席位持仓加载失败，请确认同一日期存在 positions CSV。");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [productName, date]);

  const flowChartOption = useMemo(() => {
    if (!fundFlowData) return null;

    const chartData = [...fundFlowData.items].reverse();

    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 90, right: 32, top: 24, bottom: 32 },
      xAxis: { type: "value", name: "资金净流向" },
      yAxis: {
        type: "category",
        data: chartData.map((item) => item.broker),
      },
      series: [
        {
          name: "资金净流向",
          type: "bar",
          data: chartData.map((item) => item.flow_value),
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => formatMoney(Number(params.value)),
          },
        },
      ],
    };
  }, [fundFlowData]);

  const brokerChartOption = useMemo(() => {
    if (!positionData) return null;

    const chartData = [...positionData.broker_summary].reverse();

    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 90, right: 32, top: 24, bottom: 32 },
      xAxis: { type: "value", name: "持仓净变化" },
      yAxis: {
        type: "category",
        data: chartData.map((item) => item.broker),
      },
      series: [
        {
          name: "持仓净变化",
          type: "bar",
          data: chartData.map((item) => item.net_change),
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => formatNumber(Number(params.value)),
          },
        },
      ],
    };
  }, [positionData]);

  const fundFlowColumns: ColumnsType<FundFlowDetailItem> = [
    { title: "席位", dataIndex: "broker", key: "broker", fixed: "left", width: 130 },
    {
      title: "方向",
      dataIndex: "flow_direction_cn",
      key: "flow_direction_cn",
      width: 90,
      render: (value: string, record) => (
        <Tag color={record.flow_value >= 0 ? "red" : "green"}>{value || "-"}</Tag>
      ),
    },
    {
      title: "资金净流向",
      dataIndex: "flow_value",
      key: "flow_value",
      align: "right",
      width: 150,
      sorter: (a, b) => a.flow_value - b.flow_value,
      render: (value: number) => (
        <span style={{ color: getValueColor(value) }}>{formatMoney(value)}</span>
      ),
    },
    {
      title: "动作",
      dataIndex: "action",
      key: "action",
      width: 120,
      render: (value: string) => value || "-",
    },
    {
      title: "原始说明",
      dataIndex: "flow_text",
      key: "flow_text",
      width: 360,
      ellipsis: true,
      render: (value: string) => value || "-",
    },
  ];

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
      title: "持仓净变化",
      dataIndex: "net_change",
      key: "net_change",
      align: "right",
      sorter: (a, b) => a.net_change - b.net_change,
      render: (value: number) => (
        <span style={{ color: getValueColor(value) }}>{formatNumber(value)}</span>
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
    { title: "合约", dataIndex: "contract", key: "contract", fixed: "left", width: 110 },
    {
      title: "多头",
      key: "long",
      align: "right",
      width: 130,
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
      width: 130,
      render: (_, record) => (
        <PositionChange
          position={record.short_position}
          change={record.short_change}
        />
      ),
    },
    {
      title: "持仓净变化",
      dataIndex: "net_change",
      key: "net_change",
      align: "right",
      width: 140,
      sorter: (a, b) => a.net_change - b.net_change,
      render: (value: number) => (
        <span style={{ color: getValueColor(value) }}>{formatNumber(value)}</span>
      ),
    },
    {
      title: "方向",
      dataIndex: "direction_cn",
      key: "direction",
      width: 100,
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
          <Title level={2}>{productName} 资金流与席位详情</Title>
          <Paragraph type="secondary">
            联合查看五大席位资金流动、持仓净变化和合约变化。
          </Paragraph>
        </div>

        {loading && (
          <Card>
            <Spin />
            <span style={{ marginLeft: 12 }}>正在加载资金流与席位数据...</span>
          </Card>
        )}

        {fundFlowError && (
          <Alert type="error" message="资金流加载失败" description={fundFlowError} showIcon />
        )}

        {positionError && (
          <Alert type="warning" message="席位持仓加载失败" description={positionError} showIcon />
        )}

        {!loading && fundFlowData && (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="资金净流向"
                    value={formatMoney(fundFlowData.total_flow_value)}
                    valueStyle={{ color: getValueColor(fundFlowData.total_flow_value) }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic title="资金方向" value={fundFlowData.direction_cn} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic title="涉及席位" value={fundFlowData.items.length} suffix="个" />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic title="日期" value={fundFlowData.date} valueStyle={{ fontSize: 24 }} />
                </Card>
              </Col>
            </Row>

            <Card title="资金流结论">
              <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="品种">{fundFlowData.product}</Descriptions.Item>
                <Descriptions.Item label="日期">{fundFlowData.date}</Descriptions.Item>
                <Descriptions.Item label="资金方向">
                  <Tag color={fundFlowData.total_flow_value >= 0 ? "red" : "green"}>
                    {fundFlowData.direction_cn}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="资金净流向" span={3}>
                  <span style={{ color: getValueColor(fundFlowData.total_flow_value) }}>
                    {formatMoney(fundFlowData.total_flow_value)}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="各席位资金流">
                  {flowChartOption && (
                    <ReactECharts option={flowChartOption} style={{ height: 340 }} />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="各席位持仓净变化">
                  {brokerChartOption ? (
                    <ReactECharts option={brokerChartOption} style={{ height: 340 }} />
                  ) : (
                    <Alert
                      type="info"
                      message="暂无同日持仓数据"
                      description="可以先查看资金流明细，或补充对应日期的 positions CSV。"
                      showIcon
                    />
                  )}
                </Card>
              </Col>
            </Row>

            <Card title="资金流明细">
              <div className="draggable-table" {...fundFlowTableDrag}>
                <Table
                  rowKey={(record) => record.broker}
                  columns={fundFlowColumns}
                  dataSource={fundFlowData.items}
                  pagination={false}
                  scroll={{ x: 850 }}
                />
              </div>
            </Card>
          </>
        )}

        {!loading && positionData && (
          <>
            <Card title="持仓信号结论">
              <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="板块">{positionData.category}</Descriptions.Item>
                <Descriptions.Item label="持仓信号">
                  <Tag color={getSignalColor(positionData.signal)}>
                    {positionData.signal_cn}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="主要变化合约">
                  {positionData.summary.main_contract || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="席位结构" span={3}>
                  {positionData.summary.description}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="五大席位持仓变化">
                  <Table
                    rowKey={(record) => record.broker}
                    columns={brokerColumns}
                    dataSource={positionData.broker_summary}
                    pagination={false}
                    scroll={{ x: 700 }}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="合约持仓汇总">
                  <div className="draggable-table" {...contractTableDrag}>
                    <Table
                      rowKey={(record) => record.contract}
                      columns={contractColumns}
                      dataSource={positionData.contract_summary}
                      pagination={false}
                      scroll={{ x: 700 }}
                    />
                  </div>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Space>
    </div>
  );
}
