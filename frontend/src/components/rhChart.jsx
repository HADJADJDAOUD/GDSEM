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
  console.log(
    "import.meta.env.VITE_FIREBASE_API_KEY:",
    import.meta.env.VITE_FIREBASE_API_KEY
  );
  useEffect(() => {
    const fetchAccepted = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/absences/accepted");
        console.log("Fetched accepted absences:", res.data);
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
    // determine date range based on period
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

    // create date map for every day in range
    const dateMap = {};
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      dateMap[dateStr] = { date: dateStr, total: 0, conge: 0, maladie: 0 };
    }

    // iterate accepted absences and increment days they cover (clamped to range)
    for (const a of allAbsences) {
      if (!a.startDate || !a.endDate) continue;
      const absS = new Date(a.startDate);
      const absE = new Date(a.endDate);
      if (isNaN(absS) || isNaN(absE)) continue;
      // color of the line?

      // clamp iteration range to [startDate, today]
      const iterStart = absS < startDate ? new Date(startDate) : new Date(absS);
      const iterEnd = absE > today ? new Date(today) : new Date(absE);

      for (
        let d = new Date(iterStart);
        d <= iterEnd;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];
        const slot = dateMap[dateStr];
        if (!slot) continue; // outside requested period
        slot.total += 1;
        if (a.type === "conge") slot.conge += 1;
        else if (a.type === "maladie") slot.maladie += 1;
      }
    }

    // convert to sorted array
    return Object.values(dateMap).sort(
      (x, y) => new Date(x.date) - new Date(y.date)
    );
  }, [allAbsences, period]);

  const totals = React.useMemo(() => {
    return {
      total: chartData.reduce((s, r) => s + (r.total || 0), 0),
      conge: chartData.reduce((s, r) => s + (r.conge || 0), 0),
      maladie: chartData.reduce((s, r) => s + (r.maladie || 0), 0),
    };
  }, [chartData]);

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

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>Accepted Absences (company)</CardTitle>
          <CardDescription>
            Per-day number of users absent in the selected period.
          </CardDescription>
        </div>

        <div className="flex">
          <button
            data-active={activeChart === "total"}
            className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left sm:border-t-0 sm:px-8 sm:py-6"
            onClick={() => setActiveChart("total")}
          >
            <span className="text-muted-foreground text-xs">
              {chartConfig.total.label}
            </span>
            <span className="text-lg leading-none font-bold sm:text-3xl">
              {totals.total.toLocaleString()}
            </span>
          </button>
          <button
            data-active={activeChart === "detailed"}
            className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t border-l px-6 py-4 text-left sm:border-t-0 sm:px-8 sm:py-6"
            onClick={() => setActiveChart("detailed")}
          >
            <span className="text-muted-foreground text-xs">
              {chartConfig.detailed.label}
            </span>
            <span className="text-lg leading-none font-bold sm:text-3xl">
              {(totals.conge + totals.maladie).toLocaleString()}
            </span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <div className="flex flex-wrap gap-2 p-2">
          {["week", "month", "3months", "year"].map((p) => (
            <button
              key={p}
              className={`p-2 rounded-md ${
                period === p
                  ? "bg-primary text-white"
                  : "bg-muted hover:bg-muted/80"
              }`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <ChartContainer
          config={{
            total: {
              label: "Total Absences",
              color: "hsl(0 100% 50%)", // Red color in HSL format
            },
            conge: {
              label: "Congé",
              //blue
              color: "hsl(210 60% 60%)", // Blue color
            },
            maladie: {
              label: "Maladie",
              //green
              color: "hsl(120 60% 60%)", // Green color
            },
          }}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey={activeChart === "total" ? "total" : "value"}
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            {activeChart === "total" ? (
              <Line
                dataKey="total"
                type="monotone"
                stroke={`var(--color-total)`}
                strokeWidth={2}
                dot={false}
              />
            ) : (
              <>
                <Line
                  dataKey="conge"
                  type="monotone"
                  stroke={`var(--color-conge)`}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="maladie"
                  type="monotone"
                  stroke={`var(--color-maladie)`}
                  strokeWidth={2}
                  dot={false}
                />
              </>
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
