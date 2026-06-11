import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Card,
  Col,
  DatePicker,
  Row,
  Space,
  Spin,
  Table,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { fetchFundFlowRank } from "../api/fundFlowApi";
import { useDragScroll } from "../hooks/useDragScroll";
import type { FundFlowRankItem, FundFlowRankResponse } from "../types/fundFlow";

const { Title, Paragraph } = Typography;

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

export default function FundFlows() {
  const inflowTableDrag = useDragScroll();
  const outflowTableDrag = useDragScroll();
  const [date, setDate] = useState("2026-03-27");
  const [data, setData] = useState<FundFlowRankResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData(targetDate: string) {
    try {
      setLoading(true);
      setErrorMessage("");
      setData(await fetchFundFlowRank(targetDate, 5));
    } catch (error) {
      console.error(error);
      setErrorMessage("资金流排名加载失败，请确认存在对应日期的 fund_flows CSV，或后端抓取配置可用。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(date);
  }, [date]);

  const columns: ColumnsType<FundFlowRankItem> = [
    {
      title: "品种",
      dataIndex: "product",
      key: "product",
      render: (value: string) => (
        <Link to={`/fund-flows/products/${encodeURIComponent(value)}?date=${date}`}>
          {value}
        </Link>
      ),
    },
    {
      title: "方向",
      dataIndex: "direction_cn",
      key: "direction_cn",
      width: 90,
    },
    {
      title: "资金净流向",
      dataIndex: "flow_value",
      key: "flow_value",
      align: "right",
      render: (value: number) => (
        <span style={{ color: getValueColor(value) }}>{formatMoney(value)}</span>
      ),
    },
    {
      title: "涉及席位",
      dataIndex: "broker_count",
      key: "broker_count",
      align: "right",
      width: 100,
    },
    {
      title: "席位",
      dataIndex: "brokers",
      key: "brokers",
      ellipsis: true,
    },
  ];

  return (
    <div className="page">
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <div>
          <Title level={2}>资金流入流出排名</Title>
          <Paragraph type="secondary">
            基于五大席位大资金动向数据，展示品种资金净流入和净流出 Top 5。
          </Paragraph>
        </div>

        <Card>
          <Space>
            <span>分析日期：</span>
            <DatePicker
              value={dayjs(date)}
              onChange={(value) => {
                if (value) {
                  setDate(value.format("YYYY-MM-DD"));
                }
              }}
            />
          </Space>
        </Card>

        {errorMessage && (
          <Alert type="error" message="加载失败" description={errorMessage} showIcon />
        )}

        {loading && (
          <Card>
            <Spin />
            <span style={{ marginLeft: 12 }}>正在加载资金流排名...</span>
          </Card>
        )}

        {!loading && data && (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="资金流入 Top 5">
                <div className="draggable-table" {...inflowTableDrag}>
                  <Table
                    rowKey={(record) => `in-${record.product}`}
                    columns={columns}
                    dataSource={data.top_inflows}
                    pagination={false}
                    scroll={{ x: 760 }}
                  />
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="资金流出 Top 5">
                <div className="draggable-table" {...outflowTableDrag}>
                  <Table
                    rowKey={(record) => `out-${record.product}`}
                    columns={columns}
                    dataSource={data.top_outflows}
                    pagination={false}
                    scroll={{ x: 760 }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </Space>
    </div>
  );
}
