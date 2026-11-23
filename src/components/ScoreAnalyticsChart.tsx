import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../hooks/useTheme';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ScoreAnalyticsChartProps {
  labels: string[];
  values: number[];
  title: string;
  datasetLabel: string;
}

export function ScoreAnalyticsChart({
  labels,
  values,
  title,
  datasetLabel,
}: ScoreAnalyticsChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const data = {
    labels,
    datasets: [
      {
        label: datasetLabel,
        data: values,
        backgroundColor: isDark ? 'rgba(56, 189, 248, 0.75)' : 'rgba(37, 99, 235, 0.82)',
        borderRadius: 8,
        maxBarThickness: 44,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        color: isDark ? '#e2e8f0' : '#0f172a',
        font: {
          family: 'Plus Jakarta Sans, sans-serif',
          size: 14,
          weight: 'bold' as const,
        },
        padding: { bottom: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: isDark ? '#94a3b8' : '#475569',
        },
        grid: {
          color: isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.06)',
        },
      },
      x: {
        ticks: {
          color: isDark ? '#94a3b8' : '#475569',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-72 w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Bar data={data} options={options} />
    </div>
  );
}
