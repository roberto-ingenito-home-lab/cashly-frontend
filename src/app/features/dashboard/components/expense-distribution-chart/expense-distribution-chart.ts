import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  ApexChart,
  ApexDataLabels,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexStates,
  ApexStroke,
  ApexTooltip,
  ChartComponent,
} from 'ng-apexcharts';
import { Transaction, TransactionType } from '../../../../../lib/types/transaction';
import { CategoriesStore } from '../../../../core/services/categories.store';

interface Slice {
  key: string;
  label: string;
  amount: number;
  percent: number;
  color: string;
  onColor: string;
}

const FALLBACK_COLORS = [
  { bg: '#947155', fg: '#ffffff' },
  { bg: '#4a7063', fg: '#ffffff' },
  { bg: '#f4453a', fg: '#ffffff' },
  { bg: '#ffc435', fg: '#000000' },
  { bg: '#4caf50', fg: '#000000' },
  { bg: '#6b7280', fg: '#ffffff' },
];

const OTHER_COLOR = { bg: '#a8a29e', fg: '#000000' };

@Component({
  selector: 'app-expense-distribution-chart',
  imports: [ChartComponent],
  templateUrl: './expense-distribution-chart.html',
  styleUrl: './expense-distribution-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-selected-rel]': 'selectedRel()',
    '(document:click)': 'handleDocumentClick($event)',
  },
})
export class ExpenseDistributionChart {
  private categoriesStore = inject(CategoriesStore);
  private hostRef: ElementRef<HTMLElement> = inject(ElementRef);

  transactions = input.required<Transaction[]>();
  year = input.required<number>();
  month = input.required<number>();
  currency = input.required<string>();

  selectedKey = signal<string | null>(null);

  private monthlyExpenses = computed(() => {
    const y = this.year();
    const m = this.month();
    return this.transactions().filter((t) => {
      if (t.type !== TransactionType.Expense) return false;
      const d = new Date(t.transactionDate);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  });

  total = computed(() => this.monthlyExpenses().reduce((sum, t) => sum + t.amount, 0));

  slices = computed<Slice[]>(() => {
    const expenses = this.monthlyExpenses();
    const categories = this.categoriesStore.state() ?? [];
    const total = this.total();

    if (total === 0) return [];

    const grouped = new Map<string, { label: string; amount: number }>();

    for (const t of expenses) {
      const key = t.categoryId == null ? 'uncategorized' : String(t.categoryId);
      const existing = grouped.get(key);
      if (existing) {
        existing.amount += t.amount;
      } else {
        const cat = categories.find((c) => c.categoryId === t.categoryId);
        grouped.set(key, {
          label: cat?.categoryName ?? 'Senza categoria',
          amount: t.amount,
        });
      }
    }

    const sorted = [...grouped.entries()].sort((a, b) => b[1].amount - a[1].amount);

    const topSix = sorted.slice(0, 6);
    const rest = sorted.slice(6);
    const restAmount = rest.reduce((sum, [, v]) => sum + v.amount, 0);

    const displayItems: Array<{
      key: string;
      label: string;
      amount: number;
      color: string;
      onColor: string;
    }> = [];

    topSix.forEach(([key, v], i) => {
      displayItems.push({
        key,
        label: v.label,
        amount: v.amount,
        color: FALLBACK_COLORS[i % FALLBACK_COLORS.length].bg,
        onColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length].fg,
      });
    });

    if (restAmount > 0) {
      displayItems.push({
        key: 'others',
        label: 'Altre',
        amount: restAmount,
        color: OTHER_COLOR.bg,
        onColor: OTHER_COLOR.fg,
      });
    }

    return displayItems.map((it) => ({
      key: it.key,
      label: it.label,
      amount: it.amount,
      percent: it.amount / total,
      color: it.color,
      onColor: it.onColor,
    }));
  });

  hasData = computed(() => this.slices().length > 0);

  selectedSlice = computed<Slice | null>(() => {
    const key = this.selectedKey();
    if (!key) return null;
    return this.slices().find((s) => s.key === key) ?? null;
  });

  selectedRel = computed<string | null>(() => {
    const slice = this.selectedSlice();
    if (!slice) return null;
    const idx = this.slices().findIndex((s) => s.key === slice.key);
    return idx >= 0 ? String(idx + 1) : null;
  });

  series = computed<ApexNonAxisChartSeries>(() => this.slices().map((s) => s.amount));
  labels = computed<string[]>(() => this.slices().map((s) => s.label));
  chartColors = computed<string[]>(() => this.slices().map((s) => s.color));

  chart = computed<ApexChart>(() => ({
    type: 'donut',
    height: 260,
    fontFamily: 'inherit',
    background: 'transparent',
    animations: { enabled: true, speed: 400 },
    toolbar: { show: false },
    events: {
      dataPointSelection: (_event, _ctx, config?: { dataPointIndex?: number }) => {
        const idx = config?.dataPointIndex;
        if (idx == null) return;
        const slice = this.slices()[idx];
        if (slice) this.toggleSelection(slice.key);
      },
    },
  }));

  states: ApexStates = {
    hover: { filter: { type: 'none' } },
    active: { filter: { type: 'none' } },
  };

  plotOptions: ApexPlotOptions = {
    pie: {
      donut: {
        size: '70%',
        labels: { show: false },
      },
    },
  };

  stroke: ApexStroke = { width: 0 };
  dataLabels: ApexDataLabels = { enabled: false };
  legend: ApexLegend = { show: false };
  tooltip: ApexTooltip = { enabled: false };

  toggleSelection(key: string) {
    this.selectedKey.update((current) => (current === key ? null : key));
  }

  handleDocumentClick(event: MouseEvent) {
    if (this.selectedKey() === null) return;
    const path = event.composedPath();
    if (!path.includes(this.hostRef.nativeElement)) {
      this.selectedKey.set(null);
    }
  }

  formatAmount(value: number) {
    return value.toLocaleString('it-IT', {
      style: 'currency',
      currency: this.currency(),
      maximumFractionDigits: 2,
    });
  }
}
