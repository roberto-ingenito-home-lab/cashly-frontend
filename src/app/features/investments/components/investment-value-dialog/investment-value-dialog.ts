import { DecimalPipe } from '@angular/common';
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
import { InvestmentAccount } from '../../../../../lib/types/investment';
import { Button } from '../../../../shared/components/button/button';
import { Input } from '../../../../shared/components/input/input';

export interface InvestmentValueDialogData {
  account: InvestmentAccount;
}

@Component({
  selector: 'app-investment-value-dialog',
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    Button,
    Input,
  ],
  templateUrl: './investment-value-dialog.html',
  styleUrl: './investment-value-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentValueDialog {
  private dialogRef = inject(MatDialogRef<InvestmentValueDialog, boolean>);
  private store = inject(InvestmentsStore);
  protected data = inject<InvestmentValueDialogData>(MAT_DIALOG_DATA);

  protected submitting = signal(false);
  protected error = signal<string | null>(null);

  protected form = new FormGroup({
    currentValue: new FormControl<number | null>(this.data.account.totalCurrentValue ?? null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    logDate: new FormControl<string>(new Date().toISOString().slice(0, 10), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    note: new FormControl<string>('', { nonNullable: true }),
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
      await this.store.updateAccountValue(
        this.data.account.id,
        Number(val.currentValue),
        val.logDate,
        val.note.trim() ? val.note.trim() : undefined,
      );
      toast.success('Valore attuale aggiornato!');
      this.dialogRef.close(true);
    } catch {
      this.error.set("Errore durante l'aggiornamento del valore. Riprova.");
      this.submitting.set(false);
    }
  }
}
