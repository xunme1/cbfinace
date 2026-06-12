import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Card,
  DatePicker,
  Input,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { fetchTrends } from "../api/trendApi";
import { useDragScroll } from "../hooks/useDragScroll";
import type { TrendItem } from "../types/trends";

const { Title, Paragraph } = Typography;

const DAYS_OPTIONS = [
  { label: "近5日", value: 5 },
  { label: "近10日", value: 10 },
  { label: "近20日", value: 20 },
  { label: "近30日", value: 30 },
];

const SIGNAL_OPTIONS = [
  { label: "全部", value: "" },
  { label: "强看多", value: "strong_long" },
  { label: "强看空", value: "strong_short" },
  { label: "冲突", value: "conflict" },
  { label: "正向", value: "positive" },
  { label: "反向", value: "reverse" },
  { label: "中性", value: "neutral" },
];

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

function getStatusColor(status: string) {
  if (status === "增强") return "red";
  if (status === "减弱") return "orange";
  if (status.includes("反转")) return "purple";
  if (status === "连续") return "blue";
  return "default";
}

export default function Trends() {
  const dragScrollHandlers = useDragScroll();
  const [endDate, setEndDate] = useState("2026-06-12");
  const [days, setDays] = useState(10);
  const [category, setCategory] = useState("");
  const [signal, setSignal] = useState("");
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [items, setItems] = useState<TrendItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const categoryOptions = useMemo(
    () => [
      { label: "全部", value: "" },
      ...categories.map((item) => ({ label: item, value: item })),
    ],
    [categories]
  );

  async function loadData() {
    try {
      setLoading(true);
      setErrorMessage("");

      const result = await fetchTrends({
        endDate,
        days,
        category,
        signal,
        keyword: searchKeyword,
      });

      setDates(result.dates);
      setItems(result.items);
      setTotal(result.total);
      setCategories(result.categories);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "历史趋势加载失败。系统按已有交易日 CSV 统计，周末和休市日不会计入；请确认所选结束日期之前存在足够的 positions CSV。"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [endDate, days, category, signal, searchKeyword]);

  const columns: ColumnsType<TrendItem> = [
    {
      title: "品种",
      dataIndex: "product",
      key: "product",
      fixed: "left",
      width: 120,
    },
    { title: "板块", dataIndex: "category", key: "category", width: 100 },
    {
      title: "最新信号",
      dataIndex: "latest_signal_cn",
      key: "latest_signal",
      width: 110,
      render: (value: string, record) => (
        <Tag color={getSignalColor(record.latest_signal)}>{value}</Tag>
      ),
    },
    {
      title: "趋势状态",
      dataIndex: "trend_status",
      key: "trend_status",
      width: 110,
      render: (value: string) => <Tag color={getStatusColor(value)}>{value}</Tag>,
    },
    {
      title: "信号连续",
      dataIndex: "signal_streak_days",
      key: "signal_streak_days",
      align: "right",
      width: 110,
      sorter: (a, b) => a.signal_streak_days - b.signal_streak_days,
      render: (value: number) => `${value} 天`,
    },
    {
      title: "主力最新",
      dataIndex: "latest_core_net_change",
      key: "latest_core_net_change",
      align: "right",
      width: 130,
      render: (value: number, record) => (
        <span style={{ color: getNumberColor(value) }}>
          {record.latest_core_direction_cn} {formatNumber(value)}
        </span>
      ),
    },
    {
      title: "散户最新",
      dataIndex: "latest_retail_net_change",
      key: "latest_retail_net_change",
      align: "right",
      width: 130,
      render: (value: number, record) => (
        <span style={{ color: getNumberColor(value) }}>
          {record.latest_retail_direction_cn} {formatNumber(value)}
        </span>
      ),
    },
    {
      title: "主力累计",
      dataIndex: "core_cumulative_net_change",
      key: "core_cumulative_net_change",
      align: "right",
      width: 130,
      sorter: (a, b) => a.core_cumulative_net_change - b.core_cumulative_net_change,
      render: (value: number) => (
        <span style={{ color: getNumberColor(value) }}>{formatNumber(value)}</span>
      ),
    },
    {
      title: "散户累计",
      dataIndex: "retail_cumulative_net_change",
      key: "retail_cumulative_net_change",
      align: "right",
      width: 130,
      sorter: (a, b) => a.retail_cumulative_net_change - b.retail_cumulative_net_change,
      render: (value: number) => (
        <span style={{ color: getNumberColor(value) }}>{formatNumber(value)}</span>
      ),
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Link
          to={`/trends/${encodeURIComponent(record.product)}?endDate=${endDate}&days=${days}`}
        >
          查看详情
        </Link>
      ),
    },
  ];

  return (
    <div className="page">
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <div>
          <Title level={2}>历史趋势</Title>
          <Paragraph type="secondary">
            观察主力与散户方向是否连续、信号是否增强或反转。趋势范围按已有交易日数据计算，周末和休市日自动跳过。
          </Paragraph>
        </div>

        <Card>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space wrap>
              <span>结束日期：</span>
              <DatePicker
                value={dayjs(endDate)}
                onChange={(value) => {
                  if (value) setEndDate(value.format("YYYY-MM-DD"));
                }}
              />

              <span>范围：</span>
              <Select
                style={{ width: 120 }}
                options={DAYS_OPTIONS}
                value={days}
                onChange={setDays}
              />

              <Input.Search
                allowClear
                placeholder="搜索品种"
                style={{ width: 240 }}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onSearch={(value) => setSearchKeyword(value.trim())}
                enterButton="搜索"
              />
            </Space>

            <div>
              <span style={{ marginRight: 12 }}>最新信号：</span>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                options={SIGNAL_OPTIONS}
                value={signal}
                onChange={(event) => setSignal(event.target.value)}
              />
            </div>

            <div>
              <span style={{ marginRight: 12 }}>板块筛选：</span>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                options={categoryOptions}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </div>
          </Space>
        </Card>

        {errorMessage && (
          <Alert type="error" message="加载失败" description={errorMessage} showIcon />
        )}

        <Card title={`历史趋势列表：共 ${total} 个品种，日期 ${dates[0] || "-"} 至 ${dates[dates.length - 1] || "-"}`}>
          <div className="draggable-table" {...dragScrollHandlers}>
            <Table
              rowKey={(record) => `${record.category}-${record.product}`}
              columns={columns}
              dataSource={items}
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (count) => `共 ${count} 个品种`,
              }}
              scroll={{ x: 1260 }}
            />
          </div>
        </Card>
      </Space>
    </div>
  );
}
