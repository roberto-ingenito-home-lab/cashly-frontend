import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Button } from '../../shared/components/button/button';
import { TransactionsStore } from '../../core/services/transactions.store';
import { TransactionCard } from './components/transaction-card/transaction-card';
import { Icon } from '../../shared/components/icon/icon';
import { TransactionType } from '../../../lib/types/transaction';
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

  hasActiveFilters = computed(() => {
    const f = this.filters();
    return f.type !== null || f.categoryId !== null || f.dateFrom !== null || f.dateTo !== null;
  });

  filteredTransactions = computed(() => {
    const all = this.transactionsStore.state();
    if (!all) return null;

    const { type, categoryId, dateFrom, dateTo } = this.filters();

    return all.filter((t) => {
      if (type !== null && t.type !== type) return false;
      if (categoryId !== null && t.categoryId !== categoryId) return false;
      if (dateFrom && t.transactionDate < dateFrom) return false;
      if (dateTo && t.transactionDate > dateTo + 'T23:59:59') return false;
      return true;
    });
  });

  statistics = computed(() => {
    const list = this.filteredTransactions();

    const income = list
      ?.filter((t) => t.type === TransactionType.Income)
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = list
      ?.filter((t) => t.type === TransactionType.Expense)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income: income ?? 0,
      expense: expense ?? 0,
      balance: (income ?? 0) - (expense ?? 0),
    };
  });

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
      if (result) this.filters.set(result);
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
