import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { toast } from 'ngx-sonner';
import { InvestmentsStore } from '../../../../core/services/investments.store';
import { Button } from '../../../../shared/components/button/button';
import { Input } from '../../../../shared/components/input/input';

@Component({
  selector: 'app-investment-account-dialog',
  imports: [ReactiveFormsModule, MatDialogTitle, MatDialogContent, MatDialogActions, Button, Input],
  templateUrl: './investment-account-dialog.html',
  styleUrl: './investment-account-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentAccountDialog {
  private dialogRef = inject(MatDialogRef<InvestmentAccountDialog, boolean>);
  private store = inject(InvestmentsStore);

  protected submitting = signal(false);
  protected error = signal<string | null>(null);

  protected form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    initialDeposit: new FormControl<number | null>(null),
    initialCurrentValue: new FormControl<number | null>(null),
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
    const initialDep = Number(val.initialDeposit || 0);
    const initialVal =
      val.initialCurrentValue !== null && val.initialCurrentValue !== undefined
        ? Number(val.initialCurrentValue)
        : initialDep;

    try {
      await this.store.createAccount({
        name: val.name.trim(),
        initialDeposit: initialDep,
        initialCurrentValue: initialVal,
        colorHex: '#4a7063',
        iconName: 'account_balance',
      });
      toast.success('Conto creato con successo.');
      this.dialogRef.close(true);
    } catch {
      this.error.set('Errore durante la creazione del conto. Riprova.');
      this.submitting.set(false);
    }
  }
}
