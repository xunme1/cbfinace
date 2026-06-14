import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
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
import { fetchSeatBattle } from "../api/seatBattleApi";
import { useDragScroll } from "../hooks/useDragScroll";
import { useAvailableDates } from "../hooks/useAvailableDates";
import type { SeatBattleItem } from "../types/seatBattle";

const { Title, Paragraph } = Typography;

const DEFAULT_BROKERS = [
  "高盛期货",
  "摩根大通",
  "国泰君安",
  "东方财富",
  "徽商期货",
];

const SIGNAL_OPTIONS = [
  { label: "全部", value: "" },
  { label: "方向相反", value: "opposite" },
  { label: "方向相同", value: "same" },
  { label: "阵营A单边", value: "side_a_only" },
  { label: "阵营B单边", value: "side_b_only" },
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
  if (signal === "opposite") return "red";
  if (signal === "same") return "blue";
  if (signal === "side_a_only") return "purple";
  if (signal === "side_b_only") return "cyan";
  return "default";
}

function encodeBrokers(brokers: string[]) {
  return encodeURIComponent(brokers.join(","));
}

export default function SeatBattle() {
  const dragScrollHandlers = useDragScroll();
  const { latestDate, disabledDate } = useAvailableDates("positions");
  const [date, setDate] = useState("");
  const [sideA, setSideA] = useState(DEFAULT_BROKERS.slice(0, 3));
  const [sideB, setSideB] = useState(DEFAULT_BROKERS.slice(3));
  const [signal, setSignal] = useState("");
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [brokers, setBrokers] = useState(DEFAULT_BROKERS);
  const [categories, setCategories] = useState<string[]>([]);
  const [items, setItems] = useState<SeatBattleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const brokerOptions = brokers.map((broker) => ({
    label: broker,
    value: broker,
  }));

  const categoryOptions = useMemo(
    () => [
      { label: "全部", value: "" },
      ...categories.map((item) => ({ label: item, value: item })),
    ],
    [categories]
  );

  async function loadData() {
    if (!date) return;

    if (sideA.length === 0 || sideB.length === 0) {
      setErrorMessage("两个阵营都至少需要选择一个席位。");
      return;
    }

    if (sideA.some((broker) => sideB.includes(broker))) {
      setErrorMessage("两个阵营不能选择相同席位。");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const result = await fetchSeatBattle({
        date,
        sideA,
        sideB,
        signal,
        category,
        keyword: searchKeyword,
      });

      setItems(result.items);
      setTotal(result.total);
      setBrokers(result.brokers);
      setCategories(result.categories);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.response?.data?.detail || "席位对对碰数据加载失败。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!date && latestDate) {
      setDate(latestDate);
    }
  }, [date, latestDate]);

  useEffect(() => {
    if (date) {
      loadData();
    }
  }, [date, sideA, sideB, signal, category, searchKeyword]);

  const columns: ColumnsType<SeatBattleItem> = [
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
      width: 110,
    },
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
      title: "阵营A方向",
      key: "side_a_direction",
      width: 110,
      render: (_, record) => record.side_a.direction_cn,
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
      title: "阵营B方向",
      key: "side_b_direction",
      width: 110,
      render: (_, record) => record.side_b.direction_cn,
    },
    {
      title: "差值 A-B",
      dataIndex: "difference",
      key: "difference",
      align: "right",
      width: 130,
      sorter: (a, b) => a.difference - b.difference,
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
      defaultSortOrder: "descend",
      sorter: (a, b) => a.total_abs_change - b.total_abs_change,
      render: formatNumber,
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Link
          to={`/seat-battle/products/${encodeURIComponent(record.product)}?date=${date}&sideA=${encodeBrokers(sideA)}&sideB=${encodeBrokers(sideB)}`}
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
          <Title level={2}>席位对对碰</Title>
          <Paragraph type="secondary">
            自定义两个席位阵营，比较它们在各品种和合约上的持仓变化。
          </Paragraph>
        </div>

        <Card>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space wrap>
              <span>分析日期：</span>
              <DatePicker
                value={date ? dayjs(date) : null}
                disabledDate={disabledDate}
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
                  setSideA(DEFAULT_BROKERS.slice(0, 3));
                  setSideB(DEFAULT_BROKERS.slice(3));
                  setSignal("");
                  setCategory("");
                  setKeyword("");
                  setSearchKeyword("");
                }}
              >
                重置
              </Button>
            </Space>

            <Space wrap style={{ width: "100%" }}>
              <span>阵营A：</span>
              <Select
                mode="multiple"
                style={{ minWidth: 360 }}
                options={brokerOptions}
                value={sideA}
                onChange={setSideA}
                placeholder="选择阵营A席位"
              />

              <span>阵营B：</span>
              <Select
                mode="multiple"
                style={{ minWidth: 280 }}
                options={brokerOptions}
                value={sideB}
                onChange={setSideB}
                placeholder="选择阵营B席位"
              />
            </Space>

            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div>
                <span style={{ marginRight: 12 }}>对比信号：</span>
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

        <Card title={`席位对比列表：共 ${total} 个品种`}>
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
              scroll={{ x: 1320 }}
            />
          </div>
        </Card>
      </Space>
    </div>
  );
}
