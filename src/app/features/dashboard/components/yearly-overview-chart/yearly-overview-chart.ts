import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexLegend,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  ChartComponent,
} from 'ng-apexcharts';
import { Transaction, TransactionType } from '../../../../../lib/types/transaction';
import { useChartColors, useChartThemeMode } from '../chart-theme';

const MONTH_LABELS = [
  'Gen',
  'Feb',
  'Mar',
  'Apr',
  'Mag',
  'Giu',
  'Lug',
  'Ago',
  'Set',
  'Ott',
  'Nov',
  'Dic',
];

@Component({
  selector: 'app-yearly-overview-chart',
  imports: [ChartComponent],
  templateUrl: './yearly-overview-chart.html',
  styleUrl: './yearly-overview-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearlyOverviewChart {
  private colors = useChartColors();
  private themeMode = useChartThemeMode();

  transactions = input.required<Transaction[]>();
  year = input.required<number>();
  currency = input.required<string>();

  private monthlyTotals = computed(() => {
    const y = this.year();
    const income = new Array<number>(12).fill(0);
    const expense = new Array<number>(12).fill(0);
    for (const t of this.transactions()) {
      const d = new Date(t.transactionDate);
      if (d.getFullYear() !== y) continue;
      const m = d.getMonth();
      if (t.type === TransactionType.Income) income[m] += t.amount;
      else expense[m] += t.amount;
    }
    return { income, expense };
  });

  summary = computed(() => {
    const { income, expense } = this.monthlyTotals();
    const totalIncome = income.reduce((s, v) => s + v, 0);
    const totalExpense = expense.reduce((s, v) => s + v, 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  });

  series = computed<ApexAxisChartSeries>(() => {
    const { income, expense } = this.monthlyTotals();
    return [
      { name: 'Entrate', data: income.map((v) => Number(v.toFixed(2))) },
      { name: 'Uscite', data: expense.map((v) => Number(v.toFixed(2))) },
    ];
  });

  chart = computed<ApexChart>(() => ({
    type: 'bar',
    height: 300,
    fontFamily: 'inherit',
    background: 'transparent',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, speed: 400 },
  }));

  chartColors = computed<string[]>(() => {
    const c = this.colors();
    return [c.success, c.danger];
  });

  plotOptions: ApexPlotOptions = {
    bar: {
      columnWidth: '60%',
      borderRadius: 2,
      borderRadiusApplication: 'end',
    },
  };

  stroke: ApexStroke = { width: 0 };
  dataLabels: ApexDataLabels = { enabled: false };
  legend: ApexLegend = { show: false };

  xaxis = computed<ApexXAxis>(() => {
    const c = this.colors();
    return {
      categories: MONTH_LABELS,
      labels: {
        style: { colors: c.default500, fontSize: '10px' },
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
