import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Button } from '../../shared/components/button/button';
import { TransactionsStore } from '../../core/services/transactions.store';
import { TransactionCard } from './components/transaction-card/transaction-card';
import { Icon } from '../../shared/components/icon/icon';
import { AuthStore } from '../../core/services/auth.store';
import { FilterDialog, TransactionFilters } from './components/filter-dialog/filter-dialog';
import {
  TransactionDialog,
  TransactionDialogData,
} from './components/transaction-dialog/transaction-dialog';

@Component({
  selector: 'app-transactions',
  imports: [Button, TransactionCard, Icon],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Transactions {
  transactionsStore = inject(TransactionsStore);
  authStore = inject(AuthStore);
  private dialog = inject(MatDialog);

  userCurrency = computed(() => this.authStore.state()?.user.currency ?? 'EUR');

  filters = signal<TransactionFilters>({
    type: null,
    categoryId: null,
    dateFrom: null,
    dateTo: null,
  });

  page = signal(0);
  pageSize = signal(20);

  constructor() {
    effect(() => {
      const f = this.filters();
      const p = this.page();
      const ps = this.pageSize();

      const params: Record<string, any> = {
        page: p,
        pageSize: ps,
      };

      if (f.type !== null) params['type'] = f.type;
      if (f.categoryId !== null) params['categoryId'] = f.categoryId;
      if (f.dateFrom) params['dateFrom'] = f.dateFrom;
      if (f.dateTo) params['dateTo'] = f.dateTo;

      this.transactionsStore.load(params);
    });
  }

  hasActiveFilters = computed(() => {
    const f = this.filters();
    return f.type !== null || f.categoryId !== null || f.dateFrom !== null || f.dateTo !== null;
  });

  resetFilters() {
    this.page.set(0);
    this.filters.set({
      type: null,
      categoryId: null,
      dateFrom: null,
      dateTo: null,
    });
  }

  transactions = computed(() => this.transactionsStore.state()?.transactions ?? []);
  totalCount = computed(() => this.transactionsStore.state()?.totalCount ?? 0);

  statistics = computed(() => {
    const s = this.transactionsStore.state();
    return {
      income: s?.totalIncome ?? 0,
      expense: s?.totalExpense ?? 0,
      balance: s?.balance ?? 0,
    };
  });

  totalPages = computed(() => {
    const total = this.totalCount();
    const size = this.pageSize();
    if (total === 0) return 1;
    return Math.ceil(total / size);
  });

  goToPage(p: number) {
    if (p >= 0 && p < this.totalPages()) {
      this.page.set(p);
      // scorri verso l'alto dolcemente
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  openFilters() {
    const ref = this.dialog.open<FilterDialog, TransactionFilters, TransactionFilters>(
      FilterDialog,
      {
        data: this.filters(),
        width: '420px',
        maxWidth: '95vw',
      },
    );

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.page.set(0); // Reset to first page when filtering
        this.filters.set(result);
      }
    });
  }

  openTransactionDialog() {
    this.dialog.open<TransactionDialog, TransactionDialogData, boolean>(TransactionDialog, {
      data: {},
      width: '480px',
      maxWidth: '95vw',
    });
  }
}
