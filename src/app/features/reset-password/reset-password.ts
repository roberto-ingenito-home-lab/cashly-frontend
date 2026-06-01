import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { isAxiosError } from 'axios';
import { toast } from 'ngx-sonner';
import { ApiError } from '../../../lib/types/api';
import { Input } from '../../shared/components/input/input';
import { Button } from '../../shared/components/button/button';
import * as auth from '../../../lib/api/auth';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, Input, Button],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  token = '';

  constructor() {
    // Legge il token dai parametri query dell'URL (?token=xxxx)
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  form = this.formBuilder.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [''],
    },
    { validators: confirmPasswordValidator },
  );

  async onSubmit() {
    if (!this.token) {
      toast.error("Token di ripristino mancante nell'URL.");
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password } = this.form.getRawValue();
    this.loading = true;

    try {
      const response = await auth.resetPassword(this.token, password);
      toast.success(response.message || 'Password reimpostata con successo. Ora puoi accedere.');
      this.router.navigate(['/login']);
    } catch (error) {
      if (isAxiosError(error) && error.response?.data) {
        const apiError = error.response.data as ApiError;
        toast.error(apiError.message);
      } else {
        toast.error('Si è verificato un errore. Il token potrebbe essere scaduto.');
      }
    } finally {
      this.loading = false;
    }
  }
}

const confirmPasswordValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword');

  if (password !== confirmPassword?.value) {
    confirmPassword?.setErrors({ passwordMismatch: true });
  } else {
    confirmPassword?.setErrors(null);
  }

  return null;
};
