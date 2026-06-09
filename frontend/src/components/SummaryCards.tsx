import { Card, Col, Row, Statistic } from "antd";
import type { DashboardData } from "../types/dashboard";

interface SummaryCardsProps {
  data: DashboardData;
}

export default function SummaryCards({ data }: SummaryCardsProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic title="覆盖品种" value={data.total_products} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic title="对手盘" value={data.summary.opponent_count} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic title="共振" value={data.summary.resonance_count} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic title="机构突击" value={data.summary.institution_attack_count} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic title="散户自嗨" value={data.summary.retail_noise_count} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic title="噪音" value={data.summary.noise_count} />
        </Card>
      </Col>
    </Row>
  );
}