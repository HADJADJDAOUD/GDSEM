"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import api from "../api/api";

export default function CompanyAcceptedAbsencesChart() {
  const [activeChart, setActiveChart] = React.useState("total");
  const [allAbsences, setAllAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("3months");
  console.log("Rendering CompanyAcceptedAbsencesChart with period:", period);
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

  const chartDataResult = React.useMemo(() => {
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

    // Collect all absence types from data
    const allTypes = new Set();
    allAbsences.forEach((a) => {
      if (a.type) allTypes.add(a.type);
    });

    // Create date map for each day in the period
    const dateMap = {};
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      dateMap[dateStr] = { date: dateStr, total: 0 };
    }

    // Process each absence by counting DAILY DAYS (not just start date)
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
        if (slot[a.type] === undefined) slot[a.type] = 0;
        slot[a.type] += 1;
      }
    }

    // Ensure all types exist for each date
    const chartDataArray = Object.values(dateMap).map((slot) => {
      allTypes.forEach((type) => {
        if (slot[type] === undefined) slot[type] = 0;
      });
      return slot;
    });

    // Calculate statistics for chart (days)
    const typeTotals = {};
    allTypes.forEach((type) => {
      typeTotals[type] = chartDataArray.reduce(
        (sum, row) => sum + row[type],
        0
      );
    });
    const overallTotal = chartDataArray.reduce(
      (sum, row) => sum + row.total,
      0
    );
    const days = chartDataArray.length || 1;
    const avgPerDay = Math.round((overallTotal / days) * 100) / 100;

    let peak = { date: null, value: 0 };
    chartDataArray.forEach((slot) => {
      if (slot.total > peak.value)
        peak = { date: slot.date, value: slot.total };
    });

    let mostCommonType = { type: null, value: 0 };
    allTypes.forEach((type) => {
      if (typeTotals[type] > mostCommonType.value) {
        mostCommonType = { type, value: typeTotals[type] };
      }
    });

    // Calculate request counts for table (each absence = 1 request)
    const requestTypeTotals = {};
    allAbsences.forEach((absence) => {
      if (absence.type) {
        requestTypeTotals[absence.type] =
          (requestTypeTotals[absence.type] || 0) + 1;
      }
    });
    const requestTotal = allAbsences.length;

    // Define labels and colors for types
    const labelMap = {
      conge_annuel: "Congé annuel",
      maladie: "Maladie",
      conge_sans_solde: "Congé sans solde",
      maternite: "Maternité",
      absence_sans_justification: "Absence sans justification",
      deuil: "Deuil",
    };
    const colorMap = {
      conge_annuel: "#1d4ed8",
      maladie: "#059669",
      conge_sans_solde: "#f59e0b",
      maternite: "#8b5cf6",
      absence_sans_justification: "#e63946",
      deuil: "#a855f7",
    };

    const chartConfig = {};
    allTypes.forEach((type) => {
      const label = labelMap[type] || type;
      const color = colorMap[type] || "#9ca3af";
      chartConfig[type] = { label, color };
    });

    return {
      chartData: chartDataArray.sort(
        (x, y) => new Date(x.date) - new Date(y.date)
      ),
      overallTotal,
      stats: { days, avgPerDay, peak, mostCommonType },
      chartConfig,
      allTypes: Array.from(allTypes),
      typeTotals,
      requestTotal,
      requestTypeTotals,
    };
  }, [allAbsences, period]);

  const {
    chartData,
    overallTotal,
    stats,
    chartConfig,
    allTypes,
    requestTotal,
    requestTypeTotals,
  } = chartDataResult;

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
        <CardTitle>Chargement...</CardTitle>
        <CardDescription>Veuillez patienter pendant le chargement des données.</CardDescription>
      </CardHeader>
    </Card>
  );
}

if (error) {
  return (
    <Card className="py-4 sm:py-0">
      <CardHeader>
        <CardTitle>Erreur</CardTitle>
        <CardDescription>{error}</CardDescription>
      </CardHeader>
    </Card>
  );
}

if (!chartData || chartData.length === 0) {
  return (
    <Card className="py-4 sm:py-0">
      <CardHeader>
        <CardTitle>Aucune donnée</CardTitle>
        <CardDescription>
          Aucune donnée d'absence acceptée trouvée pour la période sélectionnée.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

const sortedTypes = [...allTypes].sort(
  (a, b) => requestTypeTotals[b] - requestTypeTotals[a]
);

return (
  <Card className="py-4 sm:py-0">
    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between !p-0">
      <div className="flex flex-col px-6 pb-2 sm:pb-0">
        <CardTitle>Absences acceptées (Entreprise)</CardTitle>
        <CardDescription>
          Nombre quotidien de jours d'absence pendant la période sélectionnée.
        </CardDescription>
      </div>

      <div className="flex gap-3 px-4 pb-2 sm:pb-0">
        <div className="flex flex-col items-start bg-white/5 rounded-md px-4 py-2 min-w-[110px]">
          <span className="text-xs text-muted-foreground">Jours totaux</span>
          <strong className="text-lg">{overallTotal.toLocaleString()}</strong>
        </div>
        <div className="flex flex-col items-start bg-white/5 rounded-md px-4 py-2 min-w-[140px]">
          <span className="text-xs text-muted-foreground">Moyenne par jour</span>
          <strong className="text-lg">
            {stats.avgPerDay.toLocaleString()}
          </strong>
          <span className="text-xs text-muted-foreground">
            sur {stats.days} jours
          </span>
        </div>
        <div className="flex flex-col items-start bg-white/5 rounded-md px-4 py-2 min-w-[170px]">
          <span className="text-xs text-muted-foreground">Jour de pic</span>
          <strong className="text-lg">
            {stats.peak.value} jour{stats.peak.value > 1 ? "s" : ""} le{" "}
            {stats.peak.date
              ? new Date(stats.peak.date).toLocaleDateString()
              : "—"}
          </strong>
        </div>
        <div className="flex flex-col items-start bg-white/5 rounded-md px-4 py-2 min-w-[140px]">
          <span className="text-xs text-muted-foreground">
            Type le plus fréquent
          </span>
          <strong className="text-lg">
            {stats.mostCommonType.type
              ? chartConfig[stats.mostCommonType.type]?.label ||
                stats.mostCommonType.type
              : "—"}
          </strong>
          <span className="text-xs text-muted-foreground">
            {stats.mostCommonType.value.toLocaleString()} jours
          </span>
        </div>
      </div>
    </CardHeader>

    <CardContent className="px-2 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 px-2">
        <div className="flex gap-2 items-center">
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
                ? "3 mois"
                : p === "week"
                ? "Semaine"
                : p === "month"
                ? "Mois"
                : "Année"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <defs>
              {allTypes.map((type) => (
                <linearGradient
                  key={type}
                  id={`fill${type}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={chartConfig[type].color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartConfig[type].color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
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
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                  indicator="dot"
                />
              }
            />
            {allTypes.map((type) => (
              <Area
                key={type}
                dataKey={type}
                type="natural"
                fill={`url(#fill${type})`}
                stroke={chartConfig[type].color}
                stackId="a"
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">
          Répartition des demandes d'absence
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Demandes
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Pourcentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTypes.map((type) => {
                const total = requestTypeTotals[type] || 0;
                const percentage =
                  requestTotal > 0 ? (total / requestTotal) * 100 : 0;
                return (
                  <tr key={type}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {chartConfig[type]?.label || type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </CardContent>
  </Card>
);

}
