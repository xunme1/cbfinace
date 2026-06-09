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
import { fetchProductDetail } from "../api/productApi";
import type {
  BrokerContributionItem,
  ContractDetailItem,
  ContractSummaryItem,
  ProductDetailResponse,
} from "../types/products";

const { Title, Paragraph } = Typography;

function getSignalColor(signalType: string) {
  if (signalType === "opponent") return "red";
  if (signalType === "resonance") return "blue";
  if (signalType === "institution_attack") return "purple";
  if (signalType === "retail_noise") return "orange";
  return "default";
}

function getSignalName(signalType: string) {
  if (signalType === "opponent") return "对手盘";
  if (signalType === "resonance") return "共振";
  if (signalType === "institution_attack") return "机构突击";
  if (signalType === "retail_noise") return "散户自嗨";
  return "噪音";
}

function formatNumber(value: number) {
  return value.toLocaleString();
}

export default function ProductDetail() {
  const navigate = useNavigate();
  const { product } = useParams();
  const [searchParams] = useSearchParams();

  const date = searchParams.get("date") || "2026-03-27";
  const productName = product ? decodeURIComponent(product) : "";

  const [data, setData] = useState<ProductDetailResponse | null>(null);
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

      const result = await fetchProductDetail(date, productName);
      setData(result);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "品种详情加载失败，请确认后端已启动，并且该日期下存在该品种数据。"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [date, productName]);

  const brokerChartOption = useMemo(() => {
    if (!data) return null;

    const reversed = [...data.broker_contribution].reverse();

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const item = params[0];
          const raw = reversed[item.dataIndex];

          return [
            `${raw.broker}（${raw.camp}）`,
            `净变化：${formatNumber(raw.net_change)}`,
            `多头变化：${formatNumber(raw.long_change)}`,
            `空头变化：${formatNumber(raw.short_change)}`,
            `合约数：${raw.contract_count}`,
          ].join("<br/>");
        },
      },
      grid: {
        left: 90,
        right: 40,
        top: 30,
        bottom: 30,
      },
      xAxis: {
        type: "value",
        name: "净变化",
      },
      yAxis: {
        type: "category",
        data: reversed.map((item) => item.broker),
      },
      series: [
        {
          name: "席位净变化",
          type: "bar",
          data: reversed.map((item) => item.net_change),
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

    const reversed = [...data.contract_summary].reverse();

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const item = params[0];
          const raw = reversed[item.dataIndex];

          return [
            `${raw.contract}`,
            `净变化：${formatNumber(raw.net_change)}`,
            `多头变化：${formatNumber(raw.long_change)}`,
            `空头变化：${formatNumber(raw.short_change)}`,
            `席位数：${raw.broker_count}`,
          ].join("<br/>");
        },
      },
      grid: {
        left: 90,
        right: 40,
        top: 30,
        bottom: 30,
      },
      xAxis: {
        type: "value",
        name: "净变化",
      },
      yAxis: {
        type: "category",
        data: reversed.map((item) => item.contract),
      },
      series: [
        {
          name: "合约净变化",
          type: "bar",
          data: reversed.map((item) => item.net_change),
          label: {
            show: true,
            position: "right",
            formatter: (params: any) => Number(params.value).toLocaleString(),
          },
        },
      ],
    };
  }, [data]);

  const brokerColumns: ColumnsType<BrokerContributionItem> = [
    {
      title: "席位",
      dataIndex: "broker",
      key: "broker",
    },
    {
      title: "阵营",
      dataIndex: "camp",
      key: "camp",
      render: (value: string) => (
        <Tag color={value === "机构" ? "blue" : value === "散户" ? "orange" : "default"}>
          {value}
        </Tag>
      ),
    },
    {
      title: "多头变化",
      dataIndex: "long_change",
      key: "long_change",
      align: "right",
      render: formatNumber,
      sorter: (a, b) => a.long_change - b.long_change,
    },
    {
      title: "空头变化",
      dataIndex: "short_change",
      key: "short_change",
      align: "right",
      render: formatNumber,
      sorter: (a, b) => a.short_change - b.short_change,
    },
    {
      title: "净变化",
      dataIndex: "net_change",
      key: "net_change",
      align: "right",
      render: formatNumber,
      sorter: (a, b) => a.net_change - b.net_change,
    },
    {
      title: "合约数",
      dataIndex: "contract_count",
      key: "contract_count",
      align: "right",
    },
  ];

  const contractSummaryColumns: ColumnsType<ContractSummaryItem> = [
    {
      title: "合约",
      dataIndex: "contract",
      key: "contract",
    },
    {
      title: "多头变化",
      dataIndex: "long_change",
      key: "long_change",
      align: "right",
      render: formatNumber,
      sorter: (a, b) => a.long_change - b.long_change,
    },
    {
      title: "空头变化",
      dataIndex: "short_change",
      key: "short_change",
      align: "right",
      render: formatNumber,
      sorter: (a, b) => a.short_change - b.short_change,
    },
    {
      title: "净变化",
      dataIndex: "net_change",
      key: "net_change",
      align: "right",
      render: formatNumber,
      sorter: (a, b) => a.net_change - b.net_change,
    },
    {
      title: "席位数",
      dataIndex: "broker_count",
      key: "broker_count",
      align: "right",
    },
  ];

  const detailColumns: ColumnsType<ContractDetailItem> = [
    {
      title: "合约",
      dataIndex: "contract",
      key: "contract",
      fixed: "left",
      width: 110,
    },
    {
      title: "席位",
      dataIndex: "broker",
      key: "broker",
      width: 130,
    },
    {
      title: "阵营",
      dataIndex: "camp",
      key: "camp",
      width: 90,
      render: (value: string) => (
        <Tag color={value === "机构" ? "blue" : value === "散户" ? "orange" : "default"}>
          {value}
        </Tag>
      ),
    },
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
      render: formatNumber,
      sorter: (a, b) => a.net_change - b.net_change,
    },
  ];

  return (
    <div className="page">
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <div>
          <Button onClick={() => navigate(-1)}>返回</Button>
        </div>

        <div>
          <Title level={2}>{productName} 品种详情</Title>
          <Paragraph type="secondary">
            展示该品种的矩阵结论、席位贡献、合约汇总和合约明细。
          </Paragraph>
        </div>

        {errorMessage && (
          <Alert
            type="error"
            message="加载失败"
            description={errorMessage}
            showIcon
          />
        )}

        {loading && (
          <Card>
            <Spin />
            <span style={{ marginLeft: 12 }}>正在加载品种详情...</span>
          </Card>
        )}

        {!loading && data && (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="机构净变化"
                    value={data.matrix_summary.institution_net_change}
                    precision={0}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="散户净变化"
                    value={data.matrix_summary.retail_net_change}
                    precision={0}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="信号强度"
                    value={data.matrix_summary.strength}
                    precision={0}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="所属板块"
                    value={data.category}
                    valueStyle={{ fontSize: 24 }}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="矩阵结论">
              <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="品种">
                  {data.product}
                </Descriptions.Item>
                <Descriptions.Item label="板块">
                  {data.category}
                </Descriptions.Item>
                <Descriptions.Item label="信号类型">
                  <Tag color={getSignalColor(data.matrix_summary.signal_type)}>
                    {getSignalName(data.matrix_summary.signal_type)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="机构方向">
                  {data.matrix_summary.institution_direction}
                </Descriptions.Item>
                <Descriptions.Item label="散户方向">
                  {data.matrix_summary.retail_direction}
                </Descriptions.Item>
                <Descriptions.Item label="信号强度">
                  {formatNumber(data.matrix_summary.strength)}
                </Descriptions.Item>
                <Descriptions.Item label="信号说明" span={3}>
                  {data.matrix_summary.signal}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="席位净变化贡献">
                  {brokerChartOption && (
                    <ReactECharts
                      option={brokerChartOption}
                      style={{ height: 360 }}
                    />
                  )}
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="合约净变化贡献">
                  {contractChartOption && (
                    <ReactECharts
                      option={contractChartOption}
                      style={{ height: 360 }}
                    />
                  )}
                </Card>
              </Col>
            </Row>

            <Card title="席位贡献明细">
              <Table
                rowKey={(record) => `${record.broker}-${record.camp}`}
                columns={brokerColumns}
                dataSource={data.broker_contribution}
                pagination={false}
                scroll={{ x: 900 }}
              />
            </Card>

            <Card title="合约汇总">
              <Table
                rowKey={(record) => record.contract}
                columns={contractSummaryColumns}
                dataSource={data.contract_summary}
                pagination={false}
                scroll={{ x: 900 }}
              />
            </Card>

            <Card title="合约 × 席位明细">
              <Table
                rowKey={(record) => `${record.contract}-${record.broker}`}
                columns={detailColumns}
                dataSource={data.contract_details}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (count) => `共 ${count} 条`,
                }}
                scroll={{ x: 1200 }}
              />
            </Card>
          </>
        )}
      </Space>
    </div>
  );
}