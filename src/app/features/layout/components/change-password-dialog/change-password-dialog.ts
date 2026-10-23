import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { toast } from 'ngx-sonner';
import { ApiClient } from '../../../../../lib/api/client';
import { ApiError } from '../../../../../lib/types/api';
import { Button } from '../../../../shared/components/button/button';
import { Input } from '../../../../shared/components/input/input';

const confirmPasswordValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword');

  if (!confirmPassword) return null;

  if (confirmPassword.value && newPassword !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
    return { passwordMismatch: true };
  }

  if (confirmPassword.errors?.['passwordMismatch']) {
    const { passwordMismatch: _, ...rest } = confirmPassword.errors;
    confirmPassword.setErrors(Object.keys(rest).length ? rest : null);
  }

  return null;
};

@Component({
  selector: 'app-change-password-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    Button,
    Input,
  ],
  templateUrl: './change-password-dialog.html',
  styleUrl: './change-password-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordDialog {
  private dialogRef = inject(MatDialogRef<ChangePasswordDialog, boolean>);
  private client = inject(ApiClient);

  protected submitting = signal(false);
  protected error = signal<string | null>(null);

  protected form = new FormGroup(
    {
      currentPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      newPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      }),
      confirmPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [confirmPasswordValidator] },
  );

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

    const { currentPassword, newPassword } = this.form.getRawValue();

    try {
      const res = await this.client.post<{ message: string }>('/Users/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success(res.message || 'Password aggiornata con successo.');
      this.dialogRef.close(true);
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(apiError?.message || 'Si è verificato un errore. Riprova.');
      this.submitting.set(false);
    }
  }
}
