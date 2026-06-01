import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TransactionsStore } from '../../core/services/transactions.store';
import { AuthStore } from '../../core/services/auth.store';
import { ChartCard } from './components/chart-card/chart-card';
import { ExpenseDistributionChart } from './components/expense-distribution-chart/expense-distribution-chart';
import { CumulativeBalanceChart } from './components/cumulative-balance-chart/cumulative-balance-chart';
import { DailyTrendChart } from './components/daily-trend-chart/daily-trend-chart';
import { YearlyOverviewChart } from './components/yearly-overview-chart/yearly-overview-chart';

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
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private transactionsStore = inject(TransactionsStore);
  private authStore = inject(AuthStore);

  transactions = computed(() => this.transactionsStore.state() ?? []);

  userCurrency = computed(() => this.authStore.state()?.user.currency ?? 'EUR');

  private today = new Date();

  private currentYear = this.today.getFullYear();
  private currentMonth = this.today.getMonth();

  selectedYear = signal(this.currentYear);
  selectedMonth = signal(this.currentMonth);

  private firstTransactionCursor = computed<{ year: number; month: number }>(() => {
    const txs = this.transactions();
    if (txs.length === 0) return { year: this.currentYear, month: this.currentMonth };
    let minMs = Number.POSITIVE_INFINITY;
    for (const t of txs) {
      const ms = new Date(t.transactionDate).getTime();
      if (ms < minMs) minMs = ms;
    }
    const d = new Date(minMs);
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
