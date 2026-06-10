import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Input,
  Radio,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  fetchSeatTracker,
  fetchSeatTrackerCategories,
} from "../api/seatTrackerApi";
import type { BrokerChange, SeatTrackerItem } from "../types/seatTracker";

const { Title, Paragraph } = Typography;

const SIGNAL_OPTIONS = [
  { label: "全部", value: "" },
  { label: "强看多", value: "strong_long" },
  { label: "强看空", value: "strong_short" },
  { label: "冲突", value: "conflict" },
  { label: "正向", value: "positive" },
  { label: "反向", value: "reverse" },
  { label: "中性", value: "neutral" },
];

const TRACKED_BROKERS = [
  "高盛期货",
  "摩根大通",
  "国泰君安",
  "东方财富",
  "徽商期货",
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

function findBrokerChange(item: SeatTrackerItem, broker: string): BrokerChange {
  return (
    item.broker_changes.find((change) => change.broker === broker) || {
      broker,
      long_change: 0,
      short_change: 0,
      net_change: 0,
      direction: "neutral",
      direction_cn: "中性",
    }
  );
}

export default function SeatTracker() {
  const [date, setDate] = useState("2026-06-09");
  const [signal, setSignal] = useState("");
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [items, setItems] = useState<SeatTrackerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadCategories(targetDate: string) {
    const result = await fetchSeatTrackerCategories(targetDate);
    setCategories(result.categories);
  }

  async function loadData() {
    try {
      setLoading(true);
      setErrorMessage("");

      const result = await fetchSeatTracker({
        date,
        signal,
        category,
        keyword: searchKeyword,
      });

      setItems(result.items);
      setTotal(result.total);
      setCategories(result.categories);
    } catch (error) {
      console.error(error);
      setErrorMessage("席位追踪数据加载失败，请确认后端已启动并存在对应日期数据。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories(date).catch((error) => {
      console.error(error);
      setErrorMessage("板块列表加载失败。");
    });
  }, [date]);

  useEffect(() => {
    loadData();
  }, [date, signal, category, searchKeyword]);

  const categoryOptions = useMemo(
    () => [
      { label: "全部", value: "" },
      ...categories.map((item) => ({ label: item, value: item })),
    ],
    [categories]
  );

  const columns: ColumnsType<SeatTrackerItem> = [
    {
      title: "品种",
      dataIndex: "product",
      key: "product",
      fixed: "left",
      width: 120,
    },
    {
      title: "板块",
      dataIndex: "category",
      key: "category",
      width: 100,
    },
    {
      title: "信号",
      dataIndex: "signal_cn",
      key: "signal",
      width: 100,
      render: (value: string, record) => (
        <Tag color={getSignalColor(record.signal)}>{value}</Tag>
      ),
    },
    {
      title: "主要变化合约",
      dataIndex: "main_contract",
      key: "main_contract",
      width: 130,
    },
    {
      title: "主要合约净变化",
      dataIndex: "main_contract_net_change",
      key: "main_contract_net_change",
      align: "right",
      width: 150,
      sorter: (a, b) => a.main_contract_net_change - b.main_contract_net_change,
      render: (value: number) => (
        <span style={{ color: getNumberColor(value) }}>{formatNumber(value)}</span>
      ),
    },
    {
      title: "次要变化合约",
      dataIndex: "second_contract",
      key: "second_contract",
      width: 130,
      render: (value: string) => value || "-",
    },
    {
      title: "次要合约净变化",
      dataIndex: "second_contract_net_change",
      key: "second_contract_net_change",
      align: "right",
      width: 150,
      sorter: (a, b) => a.second_contract_net_change - b.second_contract_net_change,
      render: (value: number) => (
        <span style={{ color: getNumberColor(value) }}>{formatNumber(value)}</span>
      ),
    },
    {
      title: "全部合约聚合净变化",
      dataIndex: "all_contract_net_change",
      key: "all_contract_net_change",
      align: "right",
      width: 170,
      defaultSortOrder: "descend",
      sorter: (a, b) =>
        Math.abs(a.all_contract_net_change) - Math.abs(b.all_contract_net_change),
      render: (value: number) => (
        <span style={{ color: getNumberColor(value) }}>{formatNumber(value)}</span>
      ),
    },
    ...TRACKED_BROKERS.map((broker) => ({
      title: broker,
      key: broker,
      align: "right" as const,
      width: 120,
      render: (_: unknown, record: SeatTrackerItem) => {
        const change = findBrokerChange(record, broker);

        return (
          <span style={{ color: getNumberColor(change.net_change) }}>
            {change.net_change === 0 ? "-" : formatNumber(change.net_change)}
          </span>
        );
      },
    })),
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Link to={`/products/${encodeURIComponent(record.product)}?date=${date}`}>
          查看详情
        </Link>
      ),
    },
  ];

  return (
    <div className="page">
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <div>
          <Title level={2}>期货席位追踪</Title>
          <Paragraph type="secondary">
            聚焦五大席位在各品种、各合约上的多空变化，识别偏多、偏空和席位对峙。
          </Paragraph>
        </div>

        <Card>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space wrap>
              <span>分析日期：</span>
              <DatePicker
                value={dayjs(date)}
                onChange={(value) => {
                  if (value) {
                    setDate(value.format("YYYY-MM-DD"));
                    setCategory("");
                  }
                }}
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

              <Button
                onClick={() => {
                  setSignal("");
                  setCategory("");
                  setKeyword("");
                  setSearchKeyword("");
                }}
              >
                重置
              </Button>
            </Space>

            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div>
                <span style={{ marginRight: 12 }}>信号筛选：</span>
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
          </Space>
        </Card>

        {errorMessage && (
          <Alert type="error" message="加载失败" description={errorMessage} showIcon />
        )}

        <Card title={`席位追踪列表：共 ${total} 个品种`}>
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
            scroll={{ x: 1700 }}
          />
        </Card>
      </Space>
    </div>
  );
}
