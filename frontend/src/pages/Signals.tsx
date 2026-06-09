import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { SignalItem, SignalTypeOption } from "../types/signals";
import {
  fetchSignals,
  fetchSignalTypes,
  fetchSignalCategories,
} from "../api/signalApi";

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

export default function Signals() {
  const [date, setDate] = useState("2026-03-27");
  const [signalType, setSignalType] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [keyword, setKeyword] = useState("");

  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [total, setTotal] = useState(0);
  const [signalTypes, setSignalTypes] = useState<SignalTypeOption[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadOptions(targetDate: string) {
    const [typesResult, categoriesResult] = await Promise.all([
      fetchSignalTypes(),
      fetchSignalCategories(targetDate),
    ]);

    setSignalTypes(typesResult.signal_types);
    setCategories(categoriesResult.categories);
  }

  async function loadSignals() {
    try {
      setLoading(true);
      setErrorMessage("");

      const result = await fetchSignals({
        date,
        signalType,
        category,
        keyword,
      });

      setSignals(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "信号列表加载失败，请确认后端已启动，并且 data 目录下存在对应日期的 positions CSV。"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOptions(date).catch((error) => {
      console.error(error);
      setErrorMessage("筛选选项加载失败。");
    });
  }, [date]);

  useEffect(() => {
    loadSignals();
  }, [date, signalType, category]);

  const columns: ColumnsType<SignalItem> = [
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
      title: "信号类型",
      dataIndex: "signal_type",
      key: "signal_type",
      width: 120,
      render: (value: string) => (
        <Tag color={getSignalColor(value)}>{getSignalName(value)}</Tag>
      ),
      filters: signalTypes.map((item) => ({
        text: item.label,
        value: item.value,
      })),
      onFilter: (value, record) => record.signal_type === value,
    },
    {
      title: "机构方向",
      dataIndex: "institution_direction",
      key: "institution_direction",
      width: 110,
    },
    {
      title: "机构净变化",
      dataIndex: "institution_net_change",
      key: "institution_net_change",
      align: "right",
      width: 130,
      sorter: (a, b) =>
        a.institution_net_change - b.institution_net_change,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "散户方向",
      dataIndex: "retail_direction",
      key: "retail_direction",
      width: 110,
    },
    {
      title: "散户净变化",
      dataIndex: "retail_net_change",
      key: "retail_net_change",
      align: "right",
      width: 130,
      sorter: (a, b) => a.retail_net_change - b.retail_net_change,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "强度",
      dataIndex: "strength",
      key: "strength",
      align: "right",
      width: 120,
      defaultSortOrder: "descend",
      sorter: (a, b) => a.strength - b.strength,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "信号说明",
      dataIndex: "signal",
      key: "signal",
      ellipsis: true,
    },
    {
        title: "操作",
        key: "action",
        fixed: "right",
        width: 110,
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
          <Title level={2}>信号列表</Title>
          <Paragraph type="secondary">
            查看全部品种的机构 / 散户矩阵信号，支持按日期、信号类型、板块和关键词筛选。
          </Paragraph>
        </div>

        <Card>
          <Space wrap>
            <span>分析日期：</span>
            <DatePicker
              value={dayjs(date)}
              onChange={(value) => {
                if (value) {
                  setDate(value.format("YYYY-MM-DD"));
                  setCategory(undefined);
                }
              }}
            />

            <Select
              allowClear
              placeholder="信号类型"
              style={{ width: 160 }}
              value={signalType}
              options={signalTypes}
              onChange={(value) => setSignalType(value)}
            />

            <Select
              allowClear
              placeholder="板块"
              style={{ width: 160 }}
              value={category}
              options={categories.map((item) => ({
                label: item,
                value: item,
              }))}
              onChange={(value) => setCategory(value)}
            />

            <Input.Search
              allowClear
              placeholder="搜索品种 / 板块 / 信号"
              style={{ width: 260 }}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onSearch={() => loadSignals()}
              enterButton="搜索"
            />

            <Button onClick={() => loadSignals()}>刷新</Button>

            <Button
              onClick={() => {
                setSignalType(undefined);
                setCategory(undefined);
                setKeyword("");
              }}
            >
              重置
            </Button>
          </Space>
        </Card>

        {errorMessage && (
          <Alert
            type="error"
            message="加载失败"
            description={errorMessage}
            showIcon
          />
        )}

        <Card title={`信号明细：共 ${total} 条`}>
          <Table
            rowKey={(record) => `${record.category}-${record.product}`}
            columns={columns}
            dataSource={signals}
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (count) => `共 ${count} 条`,
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Space>
    </div>
  );
}