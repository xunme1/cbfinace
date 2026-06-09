import ReactECharts from "echarts-for-react";
import { Empty, Spin } from "antd";
import type { TopProductsResponse } from "../types/charts";

interface TopProductsChartProps {
  data: TopProductsResponse | null;
  loading?: boolean;
}

export default function TopProductsChart({
  data,
  loading = false,
}: TopProductsChartProps) {
  if (loading) {
    return <Spin />;
  }

  if (!data || data.data.length === 0) {
    return <Empty description="暂无 Top 品种数据" />;
  }

  const reversed = [...data.data].reverse();

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: (params: any) => {
        const item = params[0];
        const raw = reversed[item.dataIndex];

        return [
          `${raw.product}（${raw.category}）`,
          `信号：${raw.signal}`,
          `强度：${raw.strength.toLocaleString()}`,
          `机构净变化：${raw.institution_net_change.toLocaleString()}`,
          `散户净变化：${raw.retail_net_change.toLocaleString()}`,
        ].join("<br/>");
      },
    },
    grid: {
      left: 90,
      right: 40,
      top: 30,
      bottom: 30,
    },
    xAxis: {
      type: "value",
      name: "强度",
    },
    yAxis: {
      type: "category",
      data: reversed.map((item) => item.product),
    },
    series: [
      {
        name: "信号强度",
        type: "bar",
        data: reversed.map((item) => item.strength),
        label: {
          show: true,
          position: "right",
          formatter: (params: any) => Number(params.value).toLocaleString(),
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 420 }} />;
}