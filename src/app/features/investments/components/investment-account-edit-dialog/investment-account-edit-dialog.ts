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

export interface InvestmentAccountEditDialogData {
  account: InvestmentAccount;
}

@Component({
  selector: 'app-investment-account-edit-dialog',
  imports: [ReactiveFormsModule, MatDialogTitle, MatDialogContent, MatDialogActions, Button, Input],
  templateUrl: './investment-account-edit-dialog.html',
  styleUrl: './investment-account-edit-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentAccountEditDialog {
  private dialogRef = inject(MatDialogRef<InvestmentAccountEditDialog, boolean>);
  private store = inject(InvestmentsStore);
  protected data = inject<InvestmentAccountEditDialogData>(MAT_DIALOG_DATA);

  protected submitting = signal(false);
  protected error = signal<string | null>(null);

  protected form = new FormGroup({
    name: new FormControl<string>(this.data.account.name, {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
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

    const val = this.form.getRawValue();

    try {
      await this.store.updateAccount(this.data.account.id, val.name.trim());
      toast.success('Conto modificato con successo.');
      this.dialogRef.close(true);
    } catch {
      this.error.set('Errore durante la modifica del conto. Riprova.');
      this.submitting.set(false);
    }
  }
}
