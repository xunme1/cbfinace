import { useEffect, useMemo, useState } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { fetchAvailableDataDates } from "../api/dataCalendarApi";
import type { AvailableDataDates } from "../types/dataCalendar";

export type DataDateKind = "positions" | "fundFlow" | "common";

function getDateList(data: AvailableDataDates | null, kind: DataDateKind) {
  if (!data) return [];

  if (kind === "fundFlow") return data.fund_flow_dates;
  if (kind === "common") return data.common_dates;
  return data.positions_dates;
}

function getLatestDate(data: AvailableDataDates | null, kind: DataDateKind) {
  if (!data) return "";

  if (kind === "fundFlow") return data.latest_fund_flow_date || "";
  if (kind === "common") return data.latest_common_date || "";
  return data.latest_positions_date || "";
}

export function useAvailableDates(kind: DataDateKind = "positions") {
  const [data, setData] = useState<AvailableDataDates | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        setLoading(true);
        const result = await fetchAvailableDataDates();

        if (!ignore) {
          setData(result);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const availableDates = useMemo(() => getDateList(data, kind), [data, kind]);
  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);
  const latestDate = useMemo(() => getLatestDate(data, kind), [data, kind]);

  function disabledDate(current: Dayjs) {
    if (!current) return false;

    const dateText = current.format("YYYY-MM-DD");

    if (current.isAfter(dayjs(), "day")) {
      return true;
    }

    return !availableDateSet.has(dateText);
  }

  return {
    loading,
    data,
    availableDates,
    latestDate,
    disabledDate,
  };
}
