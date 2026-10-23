import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { toast } from 'ngx-sonner';
import { InvestmentsStore } from '../../../../core/services/investments.store';
import { InvestmentAccount, InvestmentLogType } from '../../../../../lib/types/investment';
import { Button } from '../../../../shared/components/button/button';
import { Input } from '../../../../shared/components/input/input';

export interface InvestmentOperationDialogData {
  account: InvestmentAccount;
  initialType?: InvestmentLogType;
}

@Component({
  selector: 'app-investment-operation-dialog',
  imports: [ReactiveFormsModule, MatDialogTitle, MatDialogContent, MatDialogActions, Button, Input],
  templateUrl: './investment-operation-dialog.html',
  styleUrl: './investment-operation-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentOperationDialog {
  private dialogRef = inject(MatDialogRef<InvestmentOperationDialog, boolean>);
  private store = inject(InvestmentsStore);
  protected data = inject<InvestmentOperationDialogData>(MAT_DIALOG_DATA);

  protected readonly InvestmentLogType = InvestmentLogType;

  protected submitting = signal(false);
  protected error = signal<string | null>(null);

  protected selectedType = signal<InvestmentLogType>(
    this.data.initialType ?? InvestmentLogType.DEPOSIT,
  );

  protected form = new FormGroup({
    amount: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
    logDate: new FormControl<string>(new Date().toISOString().slice(0, 10), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    note: new FormControl<string>('', { nonNullable: true }),
  });

  protected amountLabel = computed(() => {
    switch (this.selectedType()) {
      case InvestmentLogType.DEPOSIT:
        return 'Importo Versato (€) *';
      case InvestmentLogType.WITHDRAWAL:
        return 'Importo Prelevato (€) *';
      case InvestmentLogType.INTEREST:
        return 'Interesse Accreditato (€) *';
      default:
        return 'Importo (€) *';
    }
  });

  protected setType(type: InvestmentLogType) {
    this.selectedType.set(type);
  }

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

    const val = this.form.getRawValue();

    try {
      await this.store.recordOperation({
        accountId: this.data.account.id,
        operationType: this.selectedType(),
        amount: Number(val.amount),
        logDate: val.logDate,
        note: val.note.trim() ? val.note.trim() : undefined,
      });
      toast.success('Operazione registrata e saldi ricalcolati!');
      this.dialogRef.close(true);
    } catch {
      this.error.set("Errore durante il salvataggio dell'operazione. Riprova.");
      this.submitting.set(false);
    }
  }
}
