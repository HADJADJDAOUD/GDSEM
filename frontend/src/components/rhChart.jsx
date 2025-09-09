"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import api from "../api/api";

const chartConfig = {
  total: { label: "All Absences" },
  detailed: { label: "By Type" },
};

export default function CompanyAcceptedAbsencesChart() {
  const [activeChart, setActiveChart] = React.useState("total");
  const [allAbsences, setAllAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("3months");

  useEffect(() => {
    const fetchAccepted = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/absences/accepted");
        const abs = res?.data?.data || [];
        setAllAbsences(Array.isArray(abs) ? abs : []);
      } catch (err) {
        console.error("Failed to fetch accepted absences:", err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAccepted();
  }, []);

  const chartData = React.useMemo(() => {
    const today = new Date();
    const startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "3months":
        startDate.setMonth(today.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(today.getMonth() - 3);
    }

    const dateMap = {};
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      dateMap[dateStr] = { date: dateStr, total: 0, conge: 0, maladie: 0 };
    }

    for (const a of allAbsences) {
      if (!a.startDate || !a.endDate) continue;
      const absS = new Date(a.startDate);
      const absE = new Date(a.endDate);
      if (isNaN(absS) || isNaN(absE)) continue;

      const iterStart = absS < startDate ? new Date(startDate) : new Date(absS);
      const iterEnd = absE > today ? new Date(today) : new Date(absE);

      for (
        let d = new Date(iterStart);
        d <= iterEnd;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];
        const slot = dateMap[dateStr];
        if (!slot) continue;
        slot.total += 1;
        if (a.type === "conge") slot.conge += 1;
        else if (a.type === "maladie") slot.maladie += 1;
      }
    }

    return Object.values(dateMap).sort(
      (x, y) => new Date(x.date) - new Date(y.date)
    );
  }, [allAbsences, period]);

  const totals = React.useMemo(() => {
    const total = chartData.reduce((s, r) => s + (r.total || 0), 0);
    const conge = chartData.reduce((s, r) => s + (r.conge || 0), 0);
    const maladie = chartData.reduce((s, r) => s + (r.maladie || 0), 0);
    return { total, conge, maladie };
  }, [chartData]);

  const stats = React.useMemo(() => {
    const days = chartData.length || 1;
    const avgPerDay = Math.round((totals.total / days) * 100) / 100;
    let peak = { date: null, value: 0 };
    for (const row of chartData) {
      if ((row.total || 0) > peak.value)
        peak = { date: row.date, value: row.total || 0 };
    }
    const mostCommonType =
      totals.conge > totals.maladie
        ? { type: "Congé", value: totals.conge }
        : { type: "Maladie", value: totals.maladie };

    return {
      days,
      avgPerDay,
      peak,
      mostCommonType,
    };
  }, [chartData, totals]);

  const tickFormatter = (value) => {
    const d = new Date(value);
    if (period === "week") {
      return d.toLocaleDateString(undefined, { weekday: "short" });
    }
    if (period === "month") {
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <Card className="py-4 sm:py-0">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Please wait while the data loads.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="py-4 sm:py-0">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="py-4 sm:py-0">
        <CardHeader>
          <CardTitle>No Data</CardTitle>
          <CardDescription>
            No accepted absence data found for the selected period.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartVars = {
    "--color-total": "#e63946",
    "--color-conge": "#1d4ed8",
    "--color-maladie": "#059669",
  };

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between !p-0">
        <div className="flex flex-col px-6 pb-2 sm:pb-0">
          <CardTitle>Accepted Absences (Company)</CardTitle>
          <CardDescription>
            Daily number of users absent during the selected period.
          </CardDescription>
        </div>

        <div className="flex gap-3 px-4 pb-2 sm:pb-0">
          <div className="flex flex-col items-start bg-white/5 rounded-md px-4 py-2 min-w-[110px]">
            <span className="text-xs text-muted-foreground">Total</span>
            <strong className="text-lg">{totals.total.toLocaleString()}</strong>
          </div>
          <div className="flex flex-col items-start bg-white/5 rounded-md px-4 py-2 min-w-[140px]">
            <span className="text-xs text-muted-foreground">Average / day</span>
            <strong className="text-lg">
              {stats.avgPerDay.toLocaleString()}
            </strong>
            <span className="text-xs text-muted-foreground">
              over {stats.days} days
            </span>
          </div>
          <div className="flex flex-col items-start bg-white/5 rounded-md px-4 py-2 min-w-[170px]">
            <span className="text-xs text-muted-foreground">Peak day</span>
            <strong className="text-lg">
              {stats.peak.value} on{" "}
              {stats.peak.date
                ? new Date(stats.peak.date).toLocaleDateString()
                : "—"}
            </strong>
          </div>
          <div className="flex flex-col items-start bg-white/5 rounded-md px-4 py-2 min-w-[140px]">
            <span className="text-xs text-muted-foreground">
              Most common type
            </span>
            <strong className="text-lg">{stats.mostCommonType.type}</strong>
            <span className="text-xs text-muted-foreground">
              {stats.mostCommonType.value.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 px-2">
          <div className="flex gap-2 items-center">
            {/* 🗓️ Period Buttons - UPDATED */}
            {["week", "month", "3months", "year"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`
                  px-4 py-2 rounded-lg text-base font-medium transition-all duration-200
                  ${
                    period === p
                      ? "bg-[#fec834] text-gray-900 shadow-lg scale-105"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800 hover:scale-[1.02] shadow-sm"
                  }
                `}
                aria-pressed={period === p}
              >
                {p === "3months"
                  ? "3 months"
                  : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <LegendItem color={chartVars["--color-total"]} label="Total" />
              <LegendItem color={chartVars["--color-conge"]} label="Congé" />
              <LegendItem
                color={chartVars["--color-maladie"]}
                label="Maladie"
              />
            </div>

            {/* 📊 Chart Toggle Buttons - UPDATED */}
            <div className="flex gap-1 rounded-full overflow-hidden border bg-gray-200 shadow-md">
              <button
                onClick={() => setActiveChart("total")}
                className={`
                  px-4 py-2 text-base font-semibold transition-all duration-200
                  ${
                    activeChart === "total"
                      ? "bg-[#0b6a3a] text-white shadow-inner"
                      : "text-gray-600 hover:bg-gray-300"
                  }
                `}
              >
                Total
              </button>
              <button
                onClick={() => setActiveChart("detailed")}
                className={`
                  px-4 py-2 text-base font-semibold transition-all duration-200
                  ${
                    activeChart === "detailed"
                      ? "bg-[#0b6a3a] text-white shadow-inner"
                      : "text-gray-600 hover:bg-gray-300"
                  }
                `}
              >
                Detailed
              </button>
            </div>
          </div>
        </div>

        <div style={chartVars}>
          <ChartContainer
            config={{
              total: {
                label: "Total Absences",
                color: chartVars["--color-total"],
              },
              conge: { label: "Congé", color: chartVars["--color-conge"] },
              maladie: {
                label: "Maladie",
                color: chartVars["--color-maladie"],
              },
            }}
            className="aspect-auto h-[300px] w-full"
          >
            <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.06} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={period === "week" ? 10 : 32}
                tickFormatter={tickFormatter}
              />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    nameKey={activeChart === "total" ? "total" : "value"}
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                  />
                }
              />
              {activeChart === "total" ? (
                <Line
                  dataKey="total"
                  type="monotone"
                  stroke="var(--color-total)"
                  strokeWidth={2}
                  dot={false}
                />
              ) : (
                <>
                  <Line
                    dataKey="conge"
                    type="monotone"
                    stroke="var(--color-conge)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="maladie"
                    type="monotone"
                    stroke="var(--color-maladie)"
                    strokeWidth={2}
                    dot={false}
                  />
                </>
              )}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function LegendItem({ color = "#ccc", label = "" }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        style={{
          background: color,
          width: 12,
          height: 12,
          borderRadius: 3,
          display: "inline-block",
        }}
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
