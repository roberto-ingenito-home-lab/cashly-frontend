import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  ChartComponent,
} from 'ng-apexcharts';
import { TransactionType } from '../../../../../lib/types/transaction';
import { useChartColors, useChartThemeMode } from '../chart-theme';

@Component({
  selector: 'app-daily-trend-chart',
  imports: [ChartComponent],
  templateUrl: './daily-trend-chart.html',
  styleUrl: './daily-trend-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyTrendChart {
  private colors = useChartColors();
  private themeMode = useChartThemeMode();

  dailyData = input<{ timestamp: number; incomes: number; expenses: number }[] | undefined>();
  year = input.required<number>();
  month = input.required<number>();
  currency = input.required<string>();

  private daysInMonth = computed(() => new Date(this.year(), this.month() + 1, 0).getDate());

  private extendedExpenses = computed(() => {
    const y = this.year();
    const m = this.month();
    const days = this.daysInMonth();
    const buckets = new Array<number>(days + 6 + 1).fill(0);

    const rangeStart = new Date(y, m, 1);
    rangeStart.setDate(rangeStart.getDate() - 6);
    const rangeStartMs = rangeStart.getTime();

    const data = this.dailyData() ?? [];
    for (const d of data) {
      const ms = d.timestamp;
      const offsetDays = Math.floor((ms - rangeStartMs) / 86400000);
      if (offsetDays >= 0 && offsetDays < buckets.length) {
        buckets[offsetDays] += d.expenses;
      }
    }
    return buckets;
  });

  private dailyExpenses = computed(() => {
    const days = this.daysInMonth();
    const extended = this.extendedExpenses();
    // The extended expenses have 6 days of previous month at the start
    // So day 1 of the month is at index 6. We want an array of length days+1 where index 1 is day 1.
    const arr = new Array<number>(days + 1).fill(0);
    for (let d = 1; d <= days; d++) {
      arr[d] = extended[6 + (d - 1)] ?? 0;
    }
    return arr;
  });

  private movingAverage = computed<number[]>(() => {
    const days = this.daysInMonth();
    const extended = this.extendedExpenses();
    const result = new Array<number>(days);
    for (let d = 1; d <= days; d++) {
      const endIdx = 6 + (d - 1);
      let sum = 0;
      for (let k = endIdx - 6; k <= endIdx; k++) sum += extended[k] ?? 0;
      result[d - 1] = sum / 7;
    }
    return result;
  });

  summary = computed(() => {
    const expenses = this.dailyExpenses().slice(1);
    const total = expenses.reduce((s, v) => s + v, 0);
    const daysWithExpenses = expenses.filter((v) => v > 0).length;
    const avg = daysWithExpenses > 0 ? total / daysWithExpenses : 0;
    return { total, avg };
  });

  private categories = computed<string[]>(() =>
    Array.from({ length: this.daysInMonth() }, (_, i) => String(i + 1)),
  );

  series = computed<ApexAxisChartSeries>(() => {
    const expenses = this.dailyExpenses()
      .slice(1)
      .map((v) => Number(v.toFixed(2)));
    const ma = this.movingAverage().map((v) => Number(v.toFixed(2)));
    return [
      { name: 'Uscite', type: 'column', data: expenses },
      { name: 'Media mobile 7gg', type: 'line', data: ma },
    ];
  });

  chart = computed<ApexChart>(() => ({
    type: 'line',
    height: 280,
    fontFamily: 'inherit',
    background: 'transparent',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, speed: 400 },
  }));

  chartColors = computed<string[]>(() => {
    const c = this.colors();
    return [c.dangerLight, c.secondaryStrong];
  });

  stroke = computed<ApexStroke>(() => ({
    width: [0, 2],
    curve: 'smooth',
    dashArray: [0, 4],
    lineCap: 'round',
  }));

  plotOptions: ApexPlotOptions = {
    bar: {
      columnWidth: '60%',
      borderRadius: 2,
    },
  };

  dataLabels: ApexDataLabels = { enabled: false };

  markers = computed<ApexMarkers>(() => ({
    size: 0,
    hover: { size: 4 },
    strokeWidth: 0,
  }));

  legend: ApexLegend = { show: false };

  xaxis = computed<ApexXAxis>(() => {
    const days = this.daysInMonth();
    const c = this.colors();
    const interval = days > 15 ? 5 : days > 8 ? 3 : 1;
    return {
      categories: this.categories(),
      tickPlacement: 'on',
      labels: {
        rotate: 0,
        style: { colors: c.default500, fontSize: '10px' },
        formatter: (value: string) => {
          const n = Number(value);
          if (!Number.isFinite(n)) return value;
          if (n === 1 || n === days) return String(n);
          return n % interval === 0 ? String(n) : '';
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    };
  });

  yaxis = computed<ApexYAxis>(() => {
    const c = this.colors();
    return {
      min: 0,
      tickAmount: 4,
      labels: {
        formatter: (value: number) => this.formatCurrency(value),
        style: { colors: c.default500, fontSize: '10px' },
      },
    };
  });

  grid = computed<ApexGrid>(() => ({
    borderColor: this.colors().default200,
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
    padding: { left: 10, right: 10 },
  }));

  tooltip = computed<ApexTooltip>(() => ({
    theme: this.themeMode(),
    shared: true,
    intersect: false,
    followCursor: true,
    x: {
      formatter: (value: number) => `Giorno ${value}`,
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
