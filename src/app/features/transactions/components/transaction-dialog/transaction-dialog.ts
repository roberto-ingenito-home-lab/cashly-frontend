import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Transaction, TransactionType } from '../../../../../lib/types/transaction';
import { CategoriesStore } from '../../../../core/services/categories.store';
import { TransactionsStore } from '../../../../core/services/transactions.store';
import { Button } from '../../../../shared/components/button/button';
import { Input } from '../../../../shared/components/input/input';
import { Textarea } from '../../../../shared/components/textarea/textarea';

export interface TransactionDialogData {
  transaction?: Transaction;
}

@Component({
  selector: 'app-transaction-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    Button,
    Input,
    Textarea,
  ],
  templateUrl: './transaction-dialog.html',
  styleUrl: './transaction-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionDialog {
  private dialogRef = inject(MatDialogRef<TransactionDialog, boolean>);
  private data = inject<TransactionDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};
  private transactionsStore = inject(TransactionsStore);

  protected readonly TransactionType = TransactionType;
  protected categoriesStore = inject(CategoriesStore);

  protected isEdit = computed(() => !!this.data.transaction);
  protected submitting = signal(false);
  protected error = signal<string | null>(null);

  parseDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().slice(0, 5),
    };
  };

  protected form = new FormGroup({
    type: new FormControl<TransactionType>(this.data.transaction?.type ?? TransactionType.Expense, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    amount: new FormControl<number | null>(this.data.transaction?.amount ?? null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
    transactionDate: new FormControl<string>(
      !!this.data.transaction?.transactionDate
        ? this.parseDateTime(this.data.transaction?.transactionDate!).date
        : this.todayIso().date,
      { nonNullable: true, validators: [Validators.required] },
    ),
    transactionTime: new FormControl<string>(
      !!this.data.transaction?.transactionDate
        ? this.parseDateTime(this.data.transaction?.transactionDate!).time
        : this.todayIso().time,
      { nonNullable: true, validators: [Validators.required] },
    ),
    categoryId: new FormControl<number | null>(this.data.transaction?.categoryId ?? null),
    description: new FormControl<string>(this.data.transaction?.description ?? '', {
      nonNullable: true,
    }),
  });

  protected cancel() {
    this.dialogRef.close(false);
  }

  protected async submit() {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const value = this.form.getRawValue();
    const dateString = `${value.transactionDate}T${value.transactionTime}:00`;

    const payload = {
      type: value.type,
      amount: Number(value.amount),
      transactionDate: new Date(dateString).toISOString(),
      categoryId: value.categoryId !== null ? Number(value.categoryId) : null,
      description: value.description?.trim() ? value.description.trim() : null,
    };

    try {
      if (this.data.transaction) {
        await this.transactionsStore.updateTransaction(
          this.data.transaction.transactionId,
          payload,
        );
      } else {
        await this.transactionsStore.createTransaction(payload);
      }
      this.dialogRef.close(true);
    } catch {
      this.error.set('Si è verificato un errore. Riprova.');
      this.submitting.set(false);
    }
  }

  private todayIso() {
    const d = new Date();

    return {
      date: d.toISOString().split('T')[0],
      time: d.toTimeString().slice(0, 5),
    };
  }
}
