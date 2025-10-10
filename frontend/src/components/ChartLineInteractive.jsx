"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { useEffect, useState } from "react";
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

export const description = "An interactive line chart";

const chartConfig = {
  total: {
    label: "All Absences",
    color: "var(--chart-1)",
  },
  detailed: {
    label: "By Type",
  },
  conge: {
    label: "Vacation",
    color: "var(--chart-2)",
  },
  maladie: {
    label: "Sick Leave",
    color: "var(--chart-3)",
  },
};

export default function ChartLineInteractive() {
  const [activeChart, setActiveChart] = React.useState("total");
  const [allAbsences, setAllAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("3months");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/absences/me");
        const fetchedAbsences = res.data.data?.absences || res.data.data || [];
        setAllAbsences(fetchedAbsences);
        console.log("Fetched absences:", fetchedAbsences);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load chart data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
        break;
    }

    // Initialize all dates in the range with zero absences
    const dateMap = {};
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      dateMap[dateStr] = {
        date: dateStr,
        total: 0,
        conge: 0,
        maladie: 0,
      };
    }

    // Filter absences and aggregate data within the selected period
    const filteredAbsences = allAbsences.filter((absence) => {
      const absDate = new Date(absence.startDate);
      return absDate >= startDate && absDate <= today;
    });

    filteredAbsences.forEach((absence) => {
      const absenceStartDate = new Date(absence.startDate);
      const absenceEndDate = new Date(absence.endDate);
      const type = absence.type;

      for (
        let d = new Date(absenceStartDate);
        d <= absenceEndDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];
        // Ensure the date is within our range before adding
        if (dateMap[dateStr]) {
          dateMap[dateStr].total += 1;
          if (type === "conge") {
            dateMap[dateStr].conge += 1;
          } else if (type === "maladie") {
            dateMap[dateStr].maladie += 1;
          }
        }
      }
    });

    // Convert the map to a sorted array
    return Object.values(dateMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [allAbsences, period]);

  const total = React.useMemo(
    () => ({
      total: chartData.reduce((acc, curr) => acc + curr.total, 0),
      conge: chartData.reduce((acc, curr) => acc + curr.conge, 0),
      maladie: chartData.reduce((acc, curr) => acc + curr.maladie, 0),
    }),
    [chartData]
  );
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

if (chartData.length === 0) {
  return (
    <Card className="py-4 sm:py-0">
      <CardHeader>
        <CardTitle>Aucune donnée</CardTitle>
        <CardDescription>
          Aucune donnée d'absence trouvée pour la période sélectionnée.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

return (
  <Card className="py-4 sm:py-0">
    <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
      <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
        <CardTitle>Graphique des Absences</CardTitle>
        <CardDescription>
          Affiche le total des absences pour la période sélectionnée.
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
            {total.total.toLocaleString()}
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
            {(total.conge + total.maladie).toLocaleString()}
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
            {{
              week: "Semaine",
              month: "Mois",
              "3months": "3 Mois",
              year: "Année",
            }[p]}
          </button>
        ))}
      </div>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[250px] w-full"
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
          }}
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
              return date.toLocaleDateString("fr-FR", {
                month: "short",
                day: "numeric",
              });
            }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[150px]"
                nameKey="views"
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString("fr-FR", {
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
