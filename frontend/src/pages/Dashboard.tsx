import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, DatePicker, Row, Space, Spin, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import type { DashboardData } from "../types/dashboard";
import type {
  SignalDistributionResponse,
  TopProductsResponse,
  MatrixScatterResponse,
} from "../types/charts";
import { fetchDashboard } from "../api/client";
import {
  fetchSignalDistribution,
  fetchTopProducts,
  fetchMatrixScatter,
} from "../api/chartApi";
import SummaryCards from "../components/SummaryCards";
import TopSignalTable from "../components/TopSignalTable";
import SignalPieChart from "../components/SignalPieChart";
import TopProductsChart from "../components/TopProductsChart";
import MatrixScatterChart from "../components/MatrixScatterChart";

const { Title, Paragraph } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();
  const [date, setDate] = useState("2026-06-09");

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [signalDistribution, setSignalDistribution] =
    useState<SignalDistributionResponse | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsResponse | null>(null);
  const [matrixScatter, setMatrixScatter] =
    useState<MatrixScatterResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData(targetDate: string) {
    try {
      setLoading(true);
      setErrorMessage("");

      const [
        dashboardData,
        signalDistributionData,
        topProductsData,
        matrixScatterData,
      ] = await Promise.all([
        fetchDashboard(targetDate),
        fetchSignalDistribution(targetDate),
        fetchTopProducts(targetDate, 10, "opponent"),
        fetchMatrixScatter(targetDate),
      ]);

      setDashboard(dashboardData);
      setSignalDistribution(signalDistributionData);
      setTopProducts(topProductsData);
      setMatrixScatter(matrixScatterData);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "仪表盘数据加载失败，请确认后端 FastAPI 已启动，并且 data 目录下存在对应日期的 positions CSV。"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(date);
  }, [date]);

  function openProductDetail(product: string) {
    navigate(`/products/${encodeURIComponent(product)}?date=${date}`);
  }

  return (
    <div className="page">
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <div className="page-title-row">
          <div>
            <Title level={2}>期货席位追踪仪表盘</Title>
            <Paragraph type="secondary">
              基于席位持仓变化，重点观察机构与散户方向相反的品种。
            </Paragraph>
          </div>
          <Button type="primary" onClick={() => navigate("/guide")}>
            介绍文档
          </Button>
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
            <span style={{ marginLeft: 12 }}>正在加载仪表盘数据...</span>
          </Card>
        )}

        {!loading && dashboard && (
          <>
            <SummaryCards data={dashboard} />

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={10}>
                <Card title="信号类型分布" className="dashboard-chart-card">
                  <SignalPieChart data={signalDistribution} />
                </Card>
              </Col>

              <Col xs={24} lg={14}>
                <Card title="重点对手盘品种" className="dashboard-chart-card">
                  <TopProductsChart
                    data={topProducts}
                    onProductClick={openProductDetail}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="机构 vs 散户矩阵">
                  <MatrixScatterChart
                    data={matrixScatter}
                    onProductClick={openProductDetail}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="重点信号列表">
              <TopSignalTable data={dashboard.top_signals} date={date} />
            </Card>
          </>
        )}
      </Space>
    </div>
  );
}
