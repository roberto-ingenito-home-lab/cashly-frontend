import { Component, computed, inject, input } from '@angular/core';
import { Transaction, TransactionType } from '../../../../../lib/types/transaction';
import { Button } from '../../../../shared/components/button/button';
import { Icon } from '../../../../shared/components/icon/icon';
import { CategoriesStore } from '../../../../core/services/categories.store';
import { MatDialog } from '@angular/material/dialog';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { TransactionsStore } from '../../../../core/services/transactions.store';
import {
  TransactionDialog,
  TransactionDialogData,
} from '../transaction-dialog/transaction-dialog';

@Component({
  selector: 'app-transaction-card',
  imports: [Button, Icon],
  templateUrl: './transaction-card.html',
  styleUrl: './transaction-card.scss',
})
export class TransactionCard {
  private dialog = inject(MatDialog);

  categoriesStore = inject(CategoriesStore);
  transactionsStore = inject(TransactionsStore);

  transaction = input.required<Transaction>();

  category = computed(() =>
    this.categoriesStore //
      .state()
      ?.find((x) => x.categoryId === this.transaction().categoryId),
  );

  isIncome = computed(() => this.transaction().type === TransactionType.Income);

  formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  onEdit() {
    this.dialog.open<TransactionDialog, TransactionDialogData, boolean>(TransactionDialog, {
      data: { transaction: this.transaction() },
      width: '480px',
      maxWidth: '95vw',
    });
  }

  onDelete() {
    const ref = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Eliminare transazione?',
        message: 'Questa azione non può essere annullata.',
        confirmLabel: 'Elimina',
        variant: 'danger',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.transactionsStore.deleteTransaction(this.transaction().transactionId);
      }
    });
  }
}
