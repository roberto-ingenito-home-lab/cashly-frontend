import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DashboardStore } from '../../core/services/dashboard.store';
import { AuthStore } from '../../core/services/auth.store';
import { ChartCard } from './components/chart-card/chart-card';
import { ExpenseDistributionChart } from './components/expense-distribution-chart/expense-distribution-chart';
import { CumulativeBalanceChart } from './components/cumulative-balance-chart/cumulative-balance-chart';
import { DailyTrendChart } from './components/daily-trend-chart/daily-trend-chart';
import { YearlyOverviewChart } from './components/yearly-overview-chart/yearly-overview-chart';
import { CategoryBreakdownChart } from './components/category-breakdown-chart/category-breakdown-chart';

const MONTH_NAMES = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

@Component({
  selector: 'app-dashboard',
  imports: [
    ChartCard,
    ExpenseDistributionChart,
    CumulativeBalanceChart,
    DailyTrendChart,
    YearlyOverviewChart,
    CategoryBreakdownChart,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private dashboardStore = inject(DashboardStore);
  private authStore = inject(AuthStore);

  summary = computed(() => this.dashboardStore.summary());

  userCurrency = computed(() => this.authStore.state()?.user.currency ?? 'EUR');

  private today = new Date();

  private currentYear = this.today.getFullYear();
  private currentMonth = this.today.getMonth();

  selectedYear = signal(this.currentYear);
  selectedMonth = signal(this.currentMonth);

  constructor() {
    effect(() => {
      this.dashboardStore.loadSummary(this.selectedYear(), this.selectedMonth());
    });
  }

  private firstTransactionCursor = computed<{ year: number; month: number }>(() => {
    const s = this.summary();
    if (!s || !s.firstTransactionDate) return { year: this.currentYear, month: this.currentMonth };
    const d = new Date(s.firstTransactionDate);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  monthSubtitle = computed(() => `${MONTH_NAMES[this.selectedMonth()]} ${this.selectedYear()}`);

  yearSubtitle = computed(() => String(this.selectedYear()));

  private cursorValue = computed(() => this.selectedYear() * 12 + this.selectedMonth());
  private maxCursor = this.currentYear * 12 + this.currentMonth;
  private minCursor = computed(() => {
    const { year, month } = this.firstTransactionCursor();
    return year * 12 + month;
  });

  canGoForwardMonth = computed(() => this.cursorValue() < this.maxCursor);
  canGoBackMonth = computed(() => this.cursorValue() > this.minCursor());

  canGoForwardYear = computed(() => this.selectedYear() < this.currentYear);
  canGoBackYear = computed(() => this.selectedYear() > this.firstTransactionCursor().year);

  goForwardMonth() {
    if (!this.canGoForwardMonth()) return;
    let m = this.selectedMonth() + 1;
    let y = this.selectedYear();
    if (m > 11) {
      m = 0;
      y += 1;
    }
    this.selectedMonth.set(m);
    this.selectedYear.set(y);
  }

  goBackMonth() {
    if (!this.canGoBackMonth()) return;
    let m = this.selectedMonth() - 1;
    let y = this.selectedYear();
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    this.selectedMonth.set(m);
    this.selectedYear.set(y);
  }

  goForwardYear() {
    if (!this.canGoForwardYear()) return;
    const y = this.selectedYear() + 1;
    let m = this.selectedMonth();
    if (y === this.currentYear && m > this.currentMonth) m = this.currentMonth;
    this.selectedYear.set(y);
    this.selectedMonth.set(m);
  }

  goBackYear() {
    if (!this.canGoBackYear()) return;
    const y = this.selectedYear() - 1;
    let m = this.selectedMonth();
    const first = this.firstTransactionCursor();
    if (y === first.year && m < first.month) m = first.month;
    this.selectedYear.set(y);
    this.selectedMonth.set(m);
  }
}
