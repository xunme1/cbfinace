import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { SignalItem } from "../types/dashboard";
import { Link } from "react-router-dom";

interface TopSignalTableProps {
    data: SignalItem[];
    date?: string;
  }

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

export default function TopSignalTable({ data, date = "" }: TopSignalTableProps)  {
  const columns: ColumnsType<SignalItem> = [
    {
      title: "品种",
      dataIndex: "product",
      key: "product",
      fixed: "left",
    },
    {
      title: "板块",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "信号类型",
      dataIndex: "signal_type",
      key: "signal_type",
      render: (value: string) => (
        <Tag color={getSignalColor(value)}>{getSignalName(value)}</Tag>
      ),
    },
    {
      title: "机构方向",
      dataIndex: "institution_direction",
      key: "institution_direction",
    },
    {
      title: "机构净变化",
      dataIndex: "institution_net_change",
      key: "institution_net_change",
      align: "right",
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "散户方向",
      dataIndex: "retail_direction",
      key: "retail_direction",
    },
    {
      title: "散户净变化",
      dataIndex: "retail_net_change",
      key: "retail_net_change",
      align: "right",
      render: (value: number) => value.toLocaleString(),
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
    <Table
      rowKey={(record) => `${record.category}-${record.product}`}
      columns={columns}
      dataSource={data}
      pagination={false}
      scroll={{ x: 1000 }}
    />
  );
}
