import ReactECharts from "echarts-for-react";
import { Empty, Spin } from "antd";
import type { SignalDistributionResponse } from "../types/charts";

interface SignalPieChartProps {
  data: SignalDistributionResponse | null;
  loading?: boolean;
}

export default function SignalPieChart({ data, loading = false }: SignalPieChartProps) {
  if (loading) {
    return <Spin />;
  }

  if (!data || data.data.length === 0) {
    return <Empty description="暂无信号分布数据" />;
  }

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      bottom: 0,
      left: "center",
    },
    series: [
      {
        name: "信号类型",
        type: "pie",
        radius: ["45%", "70%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        label: {
          formatter: "{b}\n{c}",
        },
        data: data.data.map((item) => ({
          name: item.name,
          value: item.value,
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 360 }} />;
}