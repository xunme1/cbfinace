import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Space,
  Spin,
  Table,
  Tag,
  Timeline,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import ReactECharts from "echarts-for-react";
import { fetchProductTrend } from "../api/trendApi";
import { useAvailableDates } from "../hooks/useAvailableDates";
import type { ProductTrendResponse, TrendDailyItem } from "../types/trends";

const { Title, Paragraph } = Typography;

function formatNumber(value: number) {
  return value.toLocaleString();
}

function getNumberColor(value: number) {
  if (value > 0) return "#cf1322";
  if (value < 0) return "#389e0d";
  return "#6b7280";
}

function getSignalColor(signal: string) {
  if (signal === "strong_long") return "red";
  if (signal === "strong_short") return "green";
  if (signal === "conflict") return "gold";
  if (signal === "positive") return "blue";
  if (signal === "reverse") return "purple";
  return "default";
}

export default function TrendProductDetail() {
  const navigate = useNavigate();
  const { product } = useParams();
  const [searchParams] = useSearchParams();
  const { latestDate } = useAvailableDates("positions");
  const productName = product ? decodeURIComponent(product) : "";
  const endDate = searchParams.get("endDate") || latestDate;
  const days = Number(searchParams.get("days") || 10);

  const [data, setData] = useState<ProductTrendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData() {
    if (!endDate) return;

    if (!productName) {
      setErrorMessage("缺少品种名称。");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setData(await fetchProductTrend(productName, endDate, days));
    } catch (error) {
      console.error(error);
      setErrorMessage("品种历史趋势加载失败。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [productName, endDate, days]);

  const campTrendOption = useMemo(() => {
    if (!data) return null;

    return {
      tooltip: { trigger: "axis" },
      legend: { top: 0 },
      grid: { left: 64, right: 32, top: 48, bottom: 32 },
      xAxis: {
        type: "category",
        data: data.daily_items.map((item) => item.date),
      },
      yAxis: { type: "value", name: "净变化" },
      series: [
        {
          name: "主力阵营",
          type: "line",
          smooth: true,
          data: data.daily_items.map((item) => item.core_net_change),
          itemStyle: { color: "#f5222d" },
        },
        {
          name: "散户阵营",
          type: "line",
          smooth: true,
          data: data.daily_items.map((item) => item.retail_net_change),
          itemStyle: { color: "#2563eb" },
        },
      ],
    };
  }, [data]);

  const brokerTrendOption = useMemo(() => {
    if (!data) return null;

    return {
      tooltip: { trigger: "axis" },
      legend: { top: 0 },
      grid: { left: 64, right: 32, top: 72, bottom: 32 },
      xAxis: { type: "category", data: data.dates },
      yAxis: { type: "value", name: "净变化" },
      series: data.broker_series.map((series) => ({
        name: series.broker,
        type: "line",
        smooth: true,
        data: series.data.map((item) => item.net_change),
      })),
    };
  }, [data]);

  const contractTrendOption = useMemo(() => {
    if (!data) return null;

    return {
      tooltip: { trigger: "axis" },
      legend: { top: 0 },
      grid: { left: 64, right: 32, top: 72, bottom: 32 },
      xAxis: { type: "category", data: data.dates },
      yAxis: { type: "value", name: "净变化" },
      series: data.contract_series.map((series) => ({
        name: series.contract,
        type: "line",
        smooth: true,
        data: series.data.map((item) => item.net_change),
      })),
    };
  }, [data]);

  const columns: ColumnsType<TrendDailyItem> = [
    { title: "日期", dataIndex: "date", key: "date", width: 120 },
    {
      title: "信号",
      dataIndex: "signal_cn",
      key: "signal",
      render: (value: string, record) => (
        <Tag color={getSignalColor(record.signal)}>{value}</Tag>
      ),
    },
    {
      title: "主力净变化",
      dataIndex: "core_net_change",
      key: "core_net_change",
      align: "right",
      render: (value: number, record) => (
        <span style={{ color: getNumberColor(value) }}>
          {record.core_direction_cn} {formatNumber(value)}
        </span>
      ),
    },
    {
      title: "散户净变化",
      dataIndex: "retail_net_change",
      key: "retail_net_change",
      align: "right",
      render: (value: number, record) => (
        <span style={{ color: getNumberColor(value) }}>
          {record.retail_direction_cn} {formatNumber(value)}
        </span>
      ),
    },
    {
      title: "全部净变化",
      dataIndex: "total_net_change",
      key: "total_net_change",
      align: "right",
      render: (value: number) => (
        <span style={{ color: getNumberColor(value) }}>{formatNumber(value)}</span>
      ),
    },
  ];

  return (
    <div className="page">
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <Button onClick={() => navigate(-1)}>返回</Button>

        <div>
          <Title level={2}>{productName} 历史趋势</Title>
          <Paragraph type="secondary">
            查看该品种最近 {days} 个交易日的信号、主力/散户方向和席位变化。
          </Paragraph>
        </div>

        {errorMessage && (
          <Alert type="error" message="加载失败" description={errorMessage} showIcon />
        )}

        {loading && (
          <Card>
            <Spin />
            <span style={{ marginLeft: 12 }}>正在加载历史趋势...</span>
          </Card>
        )}

        {!loading && data && (
          <>
            <Card title="趋势概览">
              <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="品种">{data.product}</Descriptions.Item>
                <Descriptions.Item label="板块">{data.category}</Descriptions.Item>
                <Descriptions.Item label="趋势状态">{data.summary.trend_status}</Descriptions.Item>
                <Descriptions.Item label="最新信号">
                  <Tag color={getSignalColor(data.summary.latest_signal)}>
                    {data.summary.latest_signal_cn}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="信号连续">
                  {data.summary.signal_streak_days} 天
                </Descriptions.Item>
                <Descriptions.Item label="日期范围">
                  {data.dates[0]} 至 {data.dates[data.dates.length - 1]}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="信号时间线">
              <Timeline
                mode="left"
                items={data.daily_items.map((item) => ({
                  label: item.date,
                  color: getSignalColor(item.signal) === "green" ? "green" : "blue",
                  children: <Tag color={getSignalColor(item.signal)}>{item.signal_cn}</Tag>,
                }))}
              />
            </Card>

            <Card title="主力 vs 散户净变化趋势">
              {campTrendOption && (
                <ReactECharts option={campTrendOption} style={{ height: 380 }} />
              )}
            </Card>

            <Card title="五大席位净变化趋势">
              {brokerTrendOption && (
                <ReactECharts option={brokerTrendOption} style={{ height: 420 }} />
              )}
            </Card>

            <Card title="主要合约净变化趋势">
              {contractTrendOption && (
                <ReactECharts option={contractTrendOption} style={{ height: 420 }} />
              )}
            </Card>

            <Card title="每日明细">
              <Table
                rowKey={(record) => record.date}
                columns={columns}
                dataSource={data.daily_items}
                pagination={false}
                scroll={{ x: 760 }}
              />
            </Card>
          </>
        )}
      </Space>
    </div>
  );
}
