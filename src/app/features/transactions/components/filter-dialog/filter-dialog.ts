import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TransactionType } from '../../../../../lib/types/transaction';
import { Button } from '../../../../shared/components/button/button';
import { CategorySelect } from '../../../../shared/components/category-select/category-select';

export interface TransactionFilters {
  type?: TransactionType | null;
  types?: TransactionType[] | null;
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
    MatFormFieldModule,
    MatDatepickerModule,
    MatCheckboxModule,
    Button,
    CategorySelect,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './filter-dialog.html',
  styleUrl: './filter-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterDialog {
  private dialogRef = inject(MatDialogRef<FilterDialog, TransactionFilters>);
  private data = inject<TransactionFilters>(MAT_DIALOG_DATA);

  protected readonly TransactionType = TransactionType;

  protected typesForm = new FormGroup({
    income: new FormControl<boolean>(this.isTypeSelected(TransactionType.Income)),
    expense: new FormControl<boolean>(this.isTypeSelected(TransactionType.Expense)),
    transferOut: new FormControl<boolean>(this.isTypeSelected(TransactionType.TransferOut)),
    transferIn: new FormControl<boolean>(this.isTypeSelected(TransactionType.TransferIn)),
  });

  protected form = new FormGroup({
    categoryId: new FormControl<number | null>(this.data.categoryId),
  });

  private isTypeSelected(type: TransactionType): boolean {
    if (this.data.types && this.data.types.length > 0) {
      return this.data.types.includes(type);
    }
    if (this.data.type) {
      return this.data.type === type;
    }
    return false;
  }

  protected rangeForm = new FormGroup({
    start: new FormControl<Date | null>(this.parseIsoDate(this.data.dateFrom)),
    end: new FormControl<Date | null>(this.parseIsoDate(this.data.dateTo)),
  });

  private parseIsoDate(value: string | null): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  private formatIsoDate(date: Date | null): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  protected cancel() {
    this.dialogRef.close();
  }

  protected apply() {
    const value = this.form.getRawValue();
    const rangeValue = this.rangeForm.getRawValue();
    const typesValue = this.typesForm.getRawValue();

    const selectedTypes: TransactionType[] = [];
    if (typesValue.income) selectedTypes.push(TransactionType.Income);
    if (typesValue.expense) selectedTypes.push(TransactionType.Expense);
    if (typesValue.transferOut) selectedTypes.push(TransactionType.TransferOut);
    if (typesValue.transferIn) selectedTypes.push(TransactionType.TransferIn);

    const parsedCategoryId =
      value.categoryId !== null && value.categoryId !== undefined
        ? Number(value.categoryId)
        : null;

    this.dialogRef.close({
      type: selectedTypes.length === 1 ? selectedTypes[0] : null,
      types: selectedTypes.length > 0 ? selectedTypes : null,
      categoryId: parsedCategoryId !== null && !isNaN(parsedCategoryId) ? parsedCategoryId : null,
      dateFrom: this.formatIsoDate(rangeValue.start),
      dateTo: this.formatIsoDate(rangeValue.end),
    });
  }

  protected reset() {
    this.typesForm.reset({ income: false, expense: false, transferOut: false, transferIn: false });
    this.form.reset({ categoryId: null });
    this.rangeForm.reset({ start: null, end: null });
  }
}
