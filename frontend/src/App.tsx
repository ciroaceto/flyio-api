import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  successRate: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  dailyAverages: Array<{
    date: string;
    avgDuration: number;
    avgOfferIterations: number;
    avgOfferDifference: number;
  }>;
  totalCalls: number;
}

const COLORS = {
  success: "#10b981", // green
  running: "#60a5fa", // light blue
  failed: "#ef4444", // red
  canceled: "#9ca3af", // gray
  positive: "#10b981", // green
  negative: "#ef4444", // red
  neutral: "#f59e0b", // orange/amber
};

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const dashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#6b7280",
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#ef4444",
        }}
      >
        <p>Error: {error || "Failed to load dashboard data"}</p>
        <button
          onClick={fetchDashboardData}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Format dates for display
  const formattedDailyData = data.dailyAverages.map((item) => ({
    ...item,
    dateLabel: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  // Calculate sentiment totals
  const totalSentiment =
    data.sentimentDistribution.positive +
    data.sentimentDistribution.negative +
    data.sentimentDistribution.neutral;

  const sentimentData = [
    {
      name: "Positive",
      value: data.sentimentDistribution.positive,
      color: COLORS.positive,
    },
    {
      name: "Negative",
      value: data.sentimentDistribution.negative,
      color: COLORS.negative,
    },
    {
      name: "Neutral",
      value: data.sentimentDistribution.neutral,
      color: COLORS.neutral,
    },
  ].filter((item) => item.value > 0);

  // Calculate weekly averages
  const weeklyAvgDuration =
    data.dailyAverages.reduce((sum, day) => sum + day.avgDuration, 0) / 7;
  const weeklyAvgIterations =
    data.dailyAverages.reduce((sum, day) => sum + day.avgOfferIterations, 0) /
    7;
  const weeklyAvgDifference =
    data.dailyAverages.reduce((sum, day) => sum + day.avgOfferDifference, 0) /
    7;

  // Format duration helper
  const formatDuration = (seconds: number) => {
    if (seconds === 0) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "600",
            color: "#111827",
            margin: 0,
          }}
        >
          Analytics
        </h1>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <button
            onClick={fetchDashboardData}
            style={{
              padding: "8px",
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Refresh"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </button>
          <div
            style={{
              padding: "6px 12px",
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "14px",
              color: "#374151",
            }}
          >
            7 days
          </div>
        </div>
      </div>

      {/* Success Rate Card */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#111827",
            marginBottom: "8px",
          }}
        >
          Success Rate
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "48px",
              fontWeight: "700",
              color: "#111827",
            }}
          >
            {data.successRate.toFixed(1)}%
          </span>
          <span
            style={{
              fontSize: "16px",
              color: "#6b7280",
            }}
          >
            ({data.totalCalls} total calls)
          </span>
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#111827",
            marginBottom: "8px",
          }}
        >
          Calls by Sentiment
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "24px",
          }}
        >
          {totalSentiment} total calls
        </p>
        {totalSentiment > 0 ? (
          <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {sentimentData.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "4px",
                      backgroundColor: item.color,
                    }}
                  />
                  <span style={{ fontSize: "14px", color: "#374151" }}>
                    {item.name}: {item.value} calls
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            No sentiment data available
          </p>
        )}
      </div>

      {/* Daily Averages Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* Average Duration Chart */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            Average Call Duration
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              marginBottom: "24px",
            }}
          >
            Last 7 days • Avg: {formatDuration(weeklyAvgDuration)}
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={formattedDailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="dateLabel"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => formatDuration(value)}
              />
              <Tooltip
                formatter={(value: number) => formatDuration(value)}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
              <Area
                type="monotone"
                dataKey="avgDuration"
                stroke={COLORS.success}
                fill={COLORS.success}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Average Offer Iterations Chart */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            Average Offer Iterations
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              marginBottom: "24px",
            }}
          >
            Last 7 days • Avg: {weeklyAvgIterations.toFixed(1)}
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={formattedDailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="dateLabel"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
              <Line
                type="monotone"
                dataKey="avgOfferIterations"
                stroke={COLORS.running}
                strokeWidth={2}
                dot={{ fill: COLORS.running, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average Offer Difference Chart */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#111827",
            marginBottom: "8px",
          }}
        >
          Average Offer Difference
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "24px",
          }}
        >
          Last 7 days • Avg: ${weeklyAvgDifference.toFixed(2)}
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={formattedDailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="dateLabel"
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              formatter={(value: number) => `$${value.toFixed(2)}`}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
            />
            <Area
              type="monotone"
              dataKey="avgOfferDifference"
              stroke={COLORS.neutral}
              fill={COLORS.neutral}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;
