import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  ApexAnnotations,
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexMarkers,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  ChartComponent,
} from 'ng-apexcharts';
import { Transaction, TransactionType } from '../../../../../lib/types/transaction';
import { useChartColors, useChartThemeMode } from '../chart-theme';

interface DailyPoint {
  x: number;
  y: number;
}

@Component({
  selector: 'app-cumulative-balance-chart',
  imports: [ChartComponent],
  templateUrl: './cumulative-balance-chart.html',
  styleUrl: './cumulative-balance-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CumulativeBalanceChart {
  private colors = useChartColors();
  private themeMode = useChartThemeMode();

  transactions = input.required<Transaction[]>();
  currency = input.required<string>();

  private points = computed<DailyPoint[]>(() => {
    const txs = this.transactions();
    if (txs.length === 0) return [];

    const deltaByDay = new Map<number, number>();
    for (const t of txs) {
      const d = new Date(t.transactionDate);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const sign = t.type === TransactionType.Income ? 1 : -1;
      deltaByDay.set(dayStart, (deltaByDay.get(dayStart) ?? 0) + sign * t.amount);
    }

    const sorted = [...deltaByDay.entries()].sort((a, b) => a[0] - b[0]);

    const result: DailyPoint[] = [];
    let running = 0;
    for (const [ts, delta] of sorted) {
      if (delta === 0) continue;
      running += delta;
      result.push({ x: ts, y: Number(running.toFixed(2)) });
    }
    return result;
  });

  private range = computed(() => {
    const pts = this.points();
    if (pts.length === 0) return { min: -1, max: 1 };
    const ys = pts.map((p) => p.y);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    if (min === max) return { min: min - 1, max: max + 1 };
    const pad = (max - min) * 0.05;
    return { min: min - pad, max: max + pad };
  });

  finalBalance = computed(() => {
    const pts = this.points();
    return pts[pts.length - 1]?.y ?? 0;
  });

  series = computed<ApexAxisChartSeries>(() => [
    {
      name: 'Saldo',
      data: this.points(),
    },
  ]);

  chart = computed<ApexChart>(() => ({
    type: 'area',
    height: 280,
    fontFamily: 'inherit',
    background: 'transparent',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, speed: 400 },
  }));

  chartColors = computed<string[]>(() => [this.colors().primary]);

  stroke: ApexStroke = {
    curve: 'straight',
    width: 2,
    lineCap: 'round',
  };

  fill = computed<ApexFill>(() => ({
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.05,
      stops: [0, 100],
    },
  }));

  dataLabels: ApexDataLabels = { enabled: false };

  markers = computed<ApexMarkers>(() => ({
    size: 0,
    hover: { size: 5 },
    strokeWidth: 0,
    colors: [this.colors().primary],
  }));

  xaxis = computed<ApexXAxis>(() => {
    const c = this.colors();
    return {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        style: { colors: c.default500, fontSize: '10px' },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    };
  });

  yaxis = computed<ApexYAxis>(() => {
    const c = this.colors();
    const { min, max } = this.range();
    return {
      min,
      max,
      tickAmount: 4,
      labels: {
        formatter: (value: number) => this.formatCurrency(value),
        style: { colors: c.default500, fontSize: '10px' },
      },
    };
  });

  grid = computed<ApexGrid>(() => {
    const c = this.colors();
    return {
      borderColor: c.default200,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 10, right: 10 },
    };
  });

  annotations = computed<ApexAnnotations>(() => {
    const { min, max } = this.range();
    if (min > 0 || max < 0) return {};
    const c = this.colors();
    return {
      yaxis: [
        {
          y: 0,
          borderColor: c.default400,
          strokeDashArray: 0,
        },
      ],
    };
  });

  tooltip = computed<ApexTooltip>(() => ({
    theme: this.themeMode(),
    x: {
      format: 'dd MMM yyyy',
    },
    y: {
      formatter: (value: number) => this.formatCurrency(value),
    },
  }));

  formatCurrency(value: number) {
    return value.toLocaleString('it-IT', {
      style: 'currency',
      currency: this.currency(),
      maximumFractionDigits: 0,
    });
  }
}
