import ReactECharts from "echarts-for-react";
import { Empty, Spin } from "antd";
import type { CategoryStrengthResponse } from "../types/charts";

interface CategoryStrengthChartProps {
  data: CategoryStrengthResponse | null;
  loading?: boolean;
}

export default function CategoryStrengthChart({
  data,
  loading = false,
}: CategoryStrengthChartProps) {
  if (loading) {
    return <Spin />;
  }

  if (!data || data.data.length === 0) {
    return <Empty description="暂无板块变化数据" />;
  }

  const categories = data.data.map((item) => item.category);
  const values = data.data.map((item) => item.strength);

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    grid: {
      left: 80,
      right: 30,
      top: 30,
      bottom: 30,
    },
    xAxis: {
      type: "value",
      name: "变化值",
    },
    yAxis: {
      type: "category",
      data: categories.reverse(),
    },
    series: [
      {
        name: "板块变化值",
        type: "bar",
        data: values.reverse(),
        label: {
          show: true,
          position: "right",
          formatter: (params: any) => Number(params.value).toLocaleString(),
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 360 }} />;
}
