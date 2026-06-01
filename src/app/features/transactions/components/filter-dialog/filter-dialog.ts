import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TransactionType } from '../../../../../lib/types/transaction';
import { CategoriesStore } from '../../../../core/services/categories.store';
import { Button } from '../../../../shared/components/button/button';
import { Input } from '../../../../shared/components/input/input';

export interface TransactionFilters {
  type: TransactionType | null;
  categoryId: number | null;
  dateFrom: string | null;
  dateTo: string | null;
}

@Component({
  selector: 'app-filter-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    Button,
    Input,
  ],
  templateUrl: './filter-dialog.html',
  styleUrl: './filter-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterDialog {
  private dialogRef = inject(MatDialogRef<FilterDialog, TransactionFilters>);
  private data = inject<TransactionFilters>(MAT_DIALOG_DATA);

  protected readonly TransactionType = TransactionType;
  protected categoriesStore = inject(CategoriesStore);

  protected form = new FormGroup({
    type: new FormControl<TransactionType | null>(this.data.type),
    categoryId: new FormControl<number | null>(this.data.categoryId),
    dateFrom: new FormControl<string | null>(this.data.dateFrom),
    dateTo: new FormControl<string | null>(this.data.dateTo),
  });

  protected cancel() {
    this.dialogRef.close();
  }

  protected apply() {
    const value = this.form.getRawValue();
    this.dialogRef.close({
      type: value.type ?? null,
      categoryId: value.categoryId !== null ? Number(value.categoryId) : null,
      dateFrom: value.dateFrom || null,
      dateTo: value.dateTo || null,
    });
  }

  protected reset() {
    this.form.reset({ type: null, categoryId: null, dateFrom: null, dateTo: null });
  }
}
