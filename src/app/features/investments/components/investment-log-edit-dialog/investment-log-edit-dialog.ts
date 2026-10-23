import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
import { InvestmentAccount, InvestmentLog, InvestmentLogType } from '../../../../../lib/types/investment';
import { Button } from '../../../../shared/components/button/button';
import { Input } from '../../../../shared/components/input/input';

export interface InvestmentLogEditDialogData {
  account: InvestmentAccount;
  log: InvestmentLog;
}

@Component({
  selector: 'app-investment-log-edit-dialog',
  imports: [ReactiveFormsModule, MatDialogTitle, MatDialogContent, MatDialogActions, Button, Input],
  templateUrl: './investment-log-edit-dialog.html',
  styleUrl: './investment-log-edit-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentLogEditDialog {
  private dialogRef = inject(MatDialogRef<InvestmentLogEditDialog, boolean>);
  private store = inject(InvestmentsStore);
  protected data = inject<InvestmentLogEditDialogData>(MAT_DIALOG_DATA);

  protected submitting = signal(false);
  protected error = signal<string | null>(null);

  protected form = new FormGroup({
    actionType: new FormControl<number>(this.data.log.actionType, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    amount: new FormControl<number | null>(this.data.log.amount, {
      validators: [Validators.required, Validators.min(0)],
    }),
    logDate: new FormControl<string>(
      this.data.log.logDate
        ? new Date(this.data.log.logDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      { nonNullable: true, validators: [Validators.required] },
    ),
    note: new FormControl<string>(this.data.log.note || '', { nonNullable: true }),
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

    const val = this.form.getRawValue();

    try {
      await this.store.updateLog(this.data.log.id, this.data.log.accountId, {
        actionType: Number(val.actionType) as InvestmentLogType,
        amount: Number(val.amount),
        logDate: val.logDate,
        note: val.note.trim() ? val.note.trim() : undefined,
      });
      toast.success('Operazione modificata e saldi ricalcolati!');
      this.dialogRef.close(true);
    } catch {
      this.error.set('Errore durante la modifica del movimento. Riprova.');
      this.submitting.set(false);
    }
  }
}
