import { useEffect, useState } from "react";
import { Alert, Card, Col, DatePicker, Row, Space, Spin, Typography } from "antd";
import dayjs from "dayjs";
import type { DashboardData } from "../types/dashboard";
import type {
  SignalDistributionResponse,
  CategoryStrengthResponse,
  TopProductsResponse,
  MatrixScatterResponse,
} from "../types/charts";
import { fetchDashboard } from "../api/client";
import {
  fetchSignalDistribution,
  fetchCategoryStrength,
  fetchTopProducts,
  fetchMatrixScatter,
} from "../api/chartApi";
import SummaryCards from "../components/SummaryCards";
import TopSignalTable from "../components/TopSignalTable";
import SignalPieChart from "../components/SignalPieChart";
import CategoryStrengthChart from "../components/CategoryStrengthChart";
import TopProductsChart from "../components/TopProductsChart";
import MatrixScatterChart from "../components/MatrixScatterChart";

const { Title, Paragraph } = Typography;

export default function Dashboard() {
  const [date, setDate] = useState("2026-03-27");

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [signalDistribution, setSignalDistribution] =
    useState<SignalDistributionResponse | null>(null);
  const [categoryStrength, setCategoryStrength] =
    useState<CategoryStrengthResponse | null>(null);
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
        categoryStrengthData,
        topProductsData,
        matrixScatterData,
      ] = await Promise.all([
        fetchDashboard(targetDate),
        fetchSignalDistribution(targetDate),
        fetchCategoryStrength(targetDate),
        fetchTopProducts(targetDate, 10),
        fetchMatrixScatter(targetDate),
      ]);

      setDashboard(dashboardData);
      setSignalDistribution(signalDistributionData);
      setCategoryStrength(categoryStrengthData);
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

  return (
    <div className="page">
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <div>
          <Title level={2}>交易可查持仓矩阵分析仪表盘</Title>
          <Paragraph type="secondary">
            基于席位持仓变化，观察机构阵营与散户阵营之间的对手盘、共振和突击信号。
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
                <Card title="信号类型分布">
                  <SignalPieChart data={signalDistribution} />
                </Card>
              </Col>

              <Col xs={24} lg={14}>
                <Card title="板块信号强度">
                  <CategoryStrengthChart data={categoryStrength} />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Top 品种信号强度">
                  <TopProductsChart data={topProducts} />
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="机构 vs 散户矩阵">
                  <MatrixScatterChart data={matrixScatter} />
                </Card>
              </Col>
            </Row>

            <Card title="Top 信号强度表格">
              <TopSignalTable data={dashboard.top_signals} date={date} />
            </Card>
          </>
        )}
      </Space>
    </div>
  );
}