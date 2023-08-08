"use client";

import { Badge } from "@/components";
import { useFormatter } from "next-intl";
import { useMemo } from "react";

interface Props {
  title: string;
  value: number;
  valueFormat: "currency" | "number" | "percentage";
  context?: string;
  icon?: React.ReactNode;
  trend?: number;
}

export function StatsTile({
  title,
  value,
  context,
  icon,
  trend,
  valueFormat,
}: Props) {
  const format = useFormatter();
  const formattedValue = useMemo(() => {
    // format currency
    if (valueFormat === "currency") {
      return format.number(value, {
        style: "currency",
        currency: "USD",
      });
    }
    // format percentage
    else if (valueFormat === "percentage") {
      return format.number(value, {
        style: "percent",
      });
    }
    // format default number
    else {
      return format.number(value);
    }
  }, [value, valueFormat, format]);

  const formattedTrend = useMemo(() => {
    if (!trend) {
      return null;
    }
    return `${trend >= 0 ? "+" : ""}${format.number(trend, {
      style: "percent",
    })}`;
  }, [trend, format]);

  return (
    <div className="rounded-xl border bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h4 className="text-sm opacity-50">{title}</h4>
      <div className="flex items-center justify-between">
        <strong className="text-2xl font-bold">
          {formattedValue}
          {context && <small>{context}</small>}
        </strong>
        {trend && (
          <Badge status={trend > 0 ? "success" : "error"}>
            {formattedTrend}
          </Badge>
        )}
      </div>
    </div>
  );
}
