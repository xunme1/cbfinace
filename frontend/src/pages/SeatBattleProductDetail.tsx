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
import { fetchSeatBattleProductDetail } from "../api/seatBattleApi";
import { useDragScroll } from "../hooks/useDragScroll";
import type {
  BrokerContractBattleRow,
  ContractBattleRow,
  SeatBattleProductDetailResponse,
} from "../types/seatBattle";

const { Title, Paragraph } = Typography;

const DEFAULT_SIDE_A = ["高盛期货", "摩根大通", "国泰君安"];
const DEFAULT_SIDE_B = ["东方财富", "徽商期货"];

function parseQueryBrokers(value: string | null, fallback: string[]) {
  if (!value) return fallback;

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatNumber(value: number) {
  return value.toLocaleString();
}

function getNumberColor(value: number) {
  if (value > 0) return "#cf1322";
  if (value < 0) return "#389e0d";
  return "#6b7280";
}

function getSignalColor(signal: string) {
  if (signal === "opposite") return "red";
  if (signal === "same") return "blue";
  if (signal === "side_a_only") return "purple";
  if (signal === "side_b_only") return "cyan";
  return "default";
}

export default function SeatBattleProductDetail() {
  const navigate = useNavigate();
  const { product } = useParams();
  const [searchParams] = useSearchParams();
  const detailTableDrag = useDragScroll();

  const productName = product ? decodeURIComponent(product) : "";
  const date = searchParams.get("date") || "2026-06-09";
  const sideA = parseQueryBrokers(searchParams.get("sideA"), DEFAULT_SIDE_A);
  const sideB = parseQueryBrokers(searchParams.get("sideB"), DEFAULT_SIDE_B);

  const [data, setData] = useState<SeatBattleProductDetailResponse | null>(null);
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
      setData(await fetchSeatBattleProductDetail(productName, date, sideA, sideB));
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.response?.data?.detail || "席位对比详情加载失败。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [productName, date, searchParams.toString()]);

  const contractChartOption = useMemo(() => {
    if (!data) return null;

    const chartData = [...data.contract_rows].slice(0, 12).reverse();

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      legend: { top: 0 },
      grid: { left: 90, right: 32, top: 48, bottom: 32 },
      xAxis: { type: "value", name: "净变化" },
      yAxis: {
        type: "category",
        data: chartData.map((item) => item.contract),
      },
      series: [
        {
          name: "阵营A",
          type: "bar",
          data: chartData.map((item) => item.side_a.net_change),
          itemStyle: { color: "#f5222d" },
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => Number(params.value).toLocaleString(),
          },
        },
        {
          name: "阵营B",
          type: "bar",
          data: chartData.map((item) => item.side_b.net_change),
          itemStyle: { color: "#2563eb" },
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => Number(params.value).toLocaleString(),
          },
        },
      ],
    };
  }, [data]);

  const contractColumns: ColumnsType<ContractBattleRow> = [
    { title: "合约", dataIndex: "contract", key: "contract", fixed: "left", width: 110 },
    {
      title: "对比信号",
      dataIndex: "battle_signal_cn",
      key: "battle_signal",
      width: 120,
      render: (value: string, record) => (
        <Tag color={getSignalColor(record.battle_signal)}>{value}</Tag>
      ),
    },
    {
      title: "阵营A净变化",
      key: "side_a_net_change",
      align: "right",
      width: 140,
      sorter: (a, b) => a.side_a.net_change - b.side_a.net_change,
      render: (_, record) => (
        <span style={{ color: getNumberColor(record.side_a.net_change) }}>
          {formatNumber(record.side_a.net_change)}
        </span>
      ),
    },
    {
      title: "阵营B净变化",
      key: "side_b_net_change",
      align: "right",
      width: 140,
      sorter: (a, b) => a.side_b.net_change - b.side_b.net_change,
      render: (_, record) => (
        <span style={{ color: getNumberColor(record.side_b.net_change) }}>
          {formatNumber(record.side_b.net_change)}
        </span>
      ),
    },
    {
      title: "差值 A-B",
      dataIndex: "difference",
      key: "difference",
      align: "right",
      width: 130,
      render: (value: number) => (
        <span style={{ color: getNumberColor(value) }}>{formatNumber(value)}</span>
      ),
    },
    {
      title: "合计变化",
      dataIndex: "total_abs_change",
      key: "total_abs_change",
      align: "right",
      width: 130,
      render: formatNumber,
    },
  ];

  const brokerContractColumns: ColumnsType<BrokerContractBattleRow> = [
    { title: "合约", dataIndex: "contract", key: "contract", fixed: "left", width: 110 },
    { title: "阵营", dataIndex: "side", key: "side", width: 80 },
    { title: "席位", dataIndex: "broker", key: "broker", width: 130 },
    {
      title: "多头持仓",
      dataIndex: "long_position",
      key: "long_position",
      align: "right",
      width: 120,
      render: formatNumber,
    },
    {
      title: "多头变化",
      dataIndex: "long_change",
      key: "long_change",
      align: "right",
      width: 120,
      render: formatNumber,
    },
    {
      title: "空头持仓",
      dataIndex: "short_position",
      key: "short_position",
      align: "right",
      width: 120,
      render: formatNumber,
    },
    {
      title: "空头变化",
      dataIndex: "short_change",
      key: "short_change",
      align: "right",
      width: 120,
      render: formatNumber,
    },
    {
      title: "净变化",
      dataIndex: "net_change",
      key: "net_change",
      align: "right",
      width: 120,
      render: (value: number) => (
        <span style={{ color: getNumberColor(value) }}>{formatNumber(value)}</span>
      ),
    },
    { title: "方向", dataIndex: "direction_cn", key: "direction", width: 90 },
  ];

  return (
    <div className="page">
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <Button onClick={() => navigate(-1)}>返回</Button>

        <div>
          <Title level={2}>{productName} 席位对对碰详情</Title>
          <Paragraph type="secondary">
            精确比较两个自定义阵营在该品种各合约上的持仓变化。
          </Paragraph>
        </div>

        {errorMessage && (
          <Alert type="error" message="加载失败" description={errorMessage} showIcon />
        )}

        {loading && (
          <Card>
            <Spin />
            <span style={{ marginLeft: 12 }}>正在加载席位对比详情...</span>
          </Card>
        )}

        {!loading && data && (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic title="阵营A净变化" value={data.summary.side_a.net_change} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic title="阵营B净变化" value={data.summary.side_b.net_change} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic title="差值 A-B" value={data.summary.difference} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic title="所属板块" value={data.category} valueStyle={{ fontSize: 24 }} />
                </Card>
              </Col>
            </Row>

            <Card title="当前对比结论">
              <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="品种">{data.product}</Descriptions.Item>
                <Descriptions.Item label="日期">{data.date}</Descriptions.Item>
                <Descriptions.Item label="对比信号">
                  <Tag color={getSignalColor(data.summary.battle_signal)}>
                    {data.summary.battle_signal_cn}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="阵营A席位" span={3}>
                  {data.side_a_brokers.join("、")}
                </Descriptions.Item>
                <Descriptions.Item label="阵营B席位" span={3}>
                  {data.side_b_brokers.join("、")}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="合约阵营净变化对比">
              {contractChartOption && (
                <ReactECharts option={contractChartOption} style={{ height: 420 }} />
              )}
            </Card>

            <Card title="合约对比汇总">
              <Table
                rowKey={(record) => record.contract}
                columns={contractColumns}
                dataSource={data.contract_rows}
                pagination={false}
                scroll={{ x: 900 }}
              />
            </Card>

            <Card title="合约-席位明细">
              <div className="draggable-table" {...detailTableDrag}>
                <Table
                  rowKey={(record) => `${record.contract}-${record.broker}`}
                  columns={brokerContractColumns}
                  dataSource={data.broker_contract_rows}
                  pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (count) => `共 ${count} 条`,
                  }}
                  scroll={{ x: 1100 }}
                />
              </div>
            </Card>
          </>
        )}
      </Space>
    </div>
  );
}
