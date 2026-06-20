import { ChangeDetectionStrategy, Component, computed, inject, input, signal, effect } from '@angular/core';
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
import { CategoriesStore } from '../../../../core/services/categories.store';
import { useChartColors, useChartThemeMode } from '../chart-theme';
import { Icon } from '../../../../shared/components/icon/icon';
import { DashboardStore } from '../../../../core/services/dashboard.store';
import { CategoryExpense } from '../../../../../lib/api/dashboard';

type TimeRange = 'all' | 'current_year' | 'current_month' | 'last_3_months' | 'last_6_months' | 'last_year';

@Component({
  selector: 'app-category-breakdown-chart',
  imports: [ChartComponent, Icon],
  templateUrl: './category-breakdown-chart.html',
  styleUrl: './category-breakdown-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryBreakdownChart {
  private categoriesStore = inject(CategoriesStore);
  private colors = useChartColors();
  private themeMode = useChartThemeMode();
  private dashboardStore = inject(DashboardStore);

  currency = input.required<string>();

  selectedFilter = signal<TimeRange>('current_month');
  isAscending = signal<boolean>(false);
  currentPage = signal<number>(0);

  private categoryData = signal<CategoryExpense[]>([]);

  constructor() {
    effect(() => {
      const filter = this.selectedFilter();
      this.dashboardStore.getCategoryBreakdown(filter).then((data) => {
        this.categoryData.set(data);
      });
    });
  }

  private categoryTotals = computed(() => {
    const data = this.categoryData();
    const categories = this.categoriesStore.state() ?? [];
    
    const mapped = data.map((d) => {
      const cat = categories.find((c) => c.categoryId === d.categoryId);
      return {
        name: cat?.categoryName ?? 'Senza categoria',
        amount: d.amount,
      };
    });

    const asc = this.isAscending();
    const sorted = mapped.sort((a, b) => {
      return asc ? a.amount - b.amount : b.amount - a.amount;
    });

    return sorted;
  });

  totalPages = computed(() => {
    const count = this.categoryTotals().length;
    return Math.max(1, Math.ceil(count / 6));
  });

  safeCurrentPage = computed(() => {
    const maxPage = this.totalPages() - 1;
    const current = this.currentPage();
    return current > maxPage ? 0 : current;
  });

  private paginatedCategories = computed(() => {
    const data = this.categoryTotals();
    const page = this.safeCurrentPage();
    return data.slice(page * 6, (page + 1) * 6);
  });

  hasData = computed(() => this.categoryTotals().length > 0);

  series = computed<ApexAxisChartSeries>(() => {
    const data = this.paginatedCategories();
    return [
      {
        name: 'Uscite',
        data: data.map((d) => Number(d.amount.toFixed(2))),
      },
    ];
  });

  labels = computed<string[]>(() => this.paginatedCategories().map((d) => d.name));

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
    return [c.danger];
  });

  plotOptions: ApexPlotOptions = {
    bar: {
      horizontal: true,
      columnWidth: '55%',
      barHeight: '70%',
      borderRadius: 2,
      borderRadiusApplication: 'end',
      dataLabels: {
        position: 'center',
      },
    },
  };

  stroke: ApexStroke = { width: 0 };
  dataLabels = computed<ApexDataLabels>(() => ({
    enabled: true,
    textAnchor: 'middle',
    formatter: (value: number) => this.formatCurrency(value, true),
    style: {
      colors: ['#ffffff'],
      fontSize: '11px',
      fontWeight: '600',
    },
  }));
  legend: ApexLegend = { show: false };

  xaxis = computed<ApexXAxis>(() => {
    const c = this.colors();
    return {
      categories: this.labels(),
      labels: {
        style: { colors: c.default500, fontSize: '10px' },
        formatter: (value: string) => this.formatCurrency(Number(value)),
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    };
  });

  yaxis = computed<ApexYAxis>(() => {
    const c = this.colors();
    return {
      labels: {
        style: { colors: c.default500, fontSize: '10px' },
        minWidth: 90,
        maxWidth: 90,
      },
    };
  });

  grid = computed<ApexGrid>(() => ({
    borderColor: this.colors().default200,
    strokeDashArray: 4,
    xaxis: { lines: { show: true } },
    yaxis: { lines: { show: false } },
    padding: { left: 10, right: 10 },
  }));

  tooltip = computed<ApexTooltip>(() => ({
    theme: this.themeMode(),
    shared: true,
    intersect: false,
    followCursor: true,
    y: {
      formatter: (value: number) => this.formatCurrency(value, true),
    },
  }));

  onFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as TimeRange;
    this.selectedFilter.set(value);
    this.currentPage.set(0);
  }

  toggleSort() {
    this.isAscending.update((v) => !v);
    this.currentPage.set(0);
  }

  prevPage() {
    this.currentPage.update((p) => Math.max(0, p - 1));
  }

  nextPage() {
    this.currentPage.update((p) => Math.min(this.totalPages() - 1, p + 1));
  }

  formatCurrency(value: number, precise = false) {
    return value.toLocaleString('it-IT', {
      style: 'currency',
      currency: this.currency(),
      minimumFractionDigits: precise ? 2 : 0,
      maximumFractionDigits: precise ? 2 : 0,
    });
  }
}
