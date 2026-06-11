import ReactECharts from "echarts-for-react";
import { Empty, Spin } from "antd";
import type { MatrixScatterResponse, MatrixScatterItem } from "../types/charts";

interface MatrixScatterChartProps {
  data: MatrixScatterResponse | null;
  loading?: boolean;
  onProductClick?: (product: string) => void;
}

function getSignalLabel(signalType: string) {
  if (signalType === "opponent") return "对手盘";
  if (signalType === "resonance") return "共振";
  if (signalType === "institution_attack") return "机构突击";
  if (signalType === "retail_noise") return "散户自嗨";
  return "噪音";
}

function getSignalColor(signalType: string) {
  if (signalType === "opponent") return "#f5222d";
  if (signalType === "resonance") return "#93c5fd";
  if (signalType === "institution_attack") return "#a7f3d0";
  if (signalType === "retail_noise") return "#ddd6fe";
  return "#d1d5db";
}

function splitBySignalType(items: MatrixScatterItem[]) {
  const groups: Record<string, MatrixScatterItem[]> = {
    opponent: [],
    resonance: [],
    institution_attack: [],
    retail_noise: [],
    noise: [],
  };

  for (const item of items) {
    if (!groups[item.signal_type]) {
      groups[item.signal_type] = [];
    }
    groups[item.signal_type].push(item);
  }

  return groups;
}

export default function MatrixScatterChart({
  data,
  loading = false,
  onProductClick,
}: MatrixScatterChartProps) {
  if (loading) {
    return <Spin />;
  }

  if (!data || data.data.length === 0) {
    return <Empty description="暂无矩阵散点数据" />;
  }

  const groups = splitBySignalType(data.data);

  const maxAbs = Math.max(
    ...data.data.map((item) => Math.abs(item.x)),
    ...data.data.map((item) => Math.abs(item.y)),
    1000
  );

  const axisMax = Math.ceil(maxAbs / 1000) * 1000;

  const series = Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([signalType, items]) => ({
      name: getSignalLabel(signalType),
      type: "scatter",
      itemStyle: {
        color: getSignalColor(signalType),
        opacity: signalType === "opponent" ? 0.95 : 0.42,
      },
      emphasis: {
        focus: "series",
        itemStyle: {
          color: signalType === "opponent" ? "#cf1322" : getSignalColor(signalType),
          opacity: 1,
        },
      },
      symbolSize: (value: number[]) => {
        const changeValue = value[2] || 0;
        return Math.max(8, Math.min(32, Math.sqrt(changeValue) / 4));
      },
      data: items.map((item) => [
        item.x,
        item.y,
        item.strength,
        item.product,
        item.category,
        item.signal,
        item.institution_direction,
        item.retail_direction,
      ]),
    }));

  const option = {
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const value = params.value;

        return [
          `${value[3]}（${value[4]}）`,
          `信号：${value[5]}`,
          `机构方向：${value[6]}，净变化 ${Number(value[0]).toLocaleString()}`,
          `散户方向：${value[7]}，净变化 ${Number(value[1]).toLocaleString()}`,
          `变化值：${Number(value[2]).toLocaleString()}`,
        ].join("<br/>");
      },
    },
    legend: {
      top: 0,
      left: "center",
    },
    grid: {
      left: 70,
      right: 40,
      top: 60,
      bottom: 60,
    },
    xAxis: {
      type: "value",
      name: "机构净变化",
      min: -axisMax,
      max: axisMax,
      splitLine: {
        lineStyle: {
          type: "dashed",
        },
      },
      axisLine: {
        onZero: true,
      },
    },
    yAxis: {
      type: "value",
      name: "散户净变化",
      min: -axisMax,
      max: axisMax,
      splitLine: {
        lineStyle: {
          type: "dashed",
        },
      },
      axisLine: {
        onZero: true,
      },
    },
    series,
    graphic: [
      {
        type: "text",
        left: "75%",
        top: "18%",
        style: {
          text: "共同做多",
          fill: "#94a3b8",
          fontSize: 13,
        },
      },
      {
        type: "text",
        left: "75%",
        top: "78%",
        style: {
          text: "机构多 / 散户空",
          fill: "#f5222d",
          fontSize: 13,
          fontWeight: 600,
        },
      },
      {
        type: "text",
        left: "12%",
        top: "18%",
        style: {
          text: "机构空 / 散户多",
          fill: "#f5222d",
          fontSize: 13,
          fontWeight: 600,
        },
      },
      {
        type: "text",
        left: "12%",
        top: "78%",
        style: {
          text: "共同做空",
          fill: "#94a3b8",
          fontSize: 13,
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 560 }}
      onEvents={{
        click: (params: any) => {
          const product = params.value?.[3];

          if (product && onProductClick) {
            onProductClick(product);
          }
        },
      }}
    />
  );
}
