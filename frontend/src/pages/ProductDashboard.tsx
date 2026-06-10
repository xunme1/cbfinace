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

    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 90, right: 32, top: 24, bottom: 32 },
      xAxis: { type: "value", name: "净变化" },
      yAxis: {
        type: "category",
        data: [...data.broker_summary].reverse().map((item) => item.broker),
      },
      series: [
        {
          name: "席位净变化",
          type: "bar",
          data: [...data.broker_summary].reverse().map((item) => item.net_change),
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => Number(params.value).toLocaleString(),
          },
        },
      ],
    };
  }, [data]);

  const contractChartOption = useMemo(() => {
    if (!data) return null;

    const chartData = [...data.contract_summary].slice(0, 10).reverse();

    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 90, right: 32, top: 24, bottom: 32 },
      xAxis: { type: "value", name: "净变化" },
      yAxis: {
        type: "category",
        data: chartData.map((item) => item.contract),
      },
      series: [
        {
          name: "合约净变化",
          type: "bar",
          data: chartData.map((item) => item.net_change),
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => Number(params.value).toLocaleString(),
          },
        },
      ],
    };
  }, [data]);

  const brokerColumns: ColumnsType<BrokerChange> = [
    { title: "席位", dataIndex: "broker", key: "broker" },
    {
      title: "多头变化",
      dataIndex: "long_change",
      key: "long_change",
      align: "right",
      render: formatNumber,
    },
    {
      title: "空头变化",
      dataIndex: "short_change",
      key: "short_change",
      align: "right",
      render: formatNumber,
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
      title: "多头变化",
      dataIndex: "long_change",
      key: "long_change",
      align: "right",
      render: formatNumber,
    },
    {
      title: "空头变化",
      dataIndex: "short_change",
      key: "short_change",
      align: "right",
      render: formatNumber,
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
      title: "多头持仓",
      dataIndex: "long_position",
      key: "long_position",
      align: "right",
      render: formatNumber,
    },
    {
      title: "多头变化",
      dataIndex: "long_change",
      key: "long_change",
      align: "right",
      render: formatNumber,
    },
    {
      title: "空头持仓",
      dataIndex: "short_position",
      key: "short_position",
      align: "right",
      render: formatNumber,
    },
    {
      title: "空头变化",
      dataIndex: "short_change",
      key: "short_change",
      align: "right",
      render: formatNumber,
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
                <Card title="五大席位净变化">
                  {brokerChartOption && (
                    <ReactECharts option={brokerChartOption} style={{ height: 340 }} />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="合约净变化">
                  {contractChartOption && (
                    <ReactECharts option={contractChartOption} style={{ height: 340 }} />
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
