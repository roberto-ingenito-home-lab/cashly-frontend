import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isAxiosError } from 'axios';
import { toast } from 'ngx-sonner';
import { ApiError } from '../../../lib/types/api';
import { Input } from '../../shared/components/input/input';
import { Button } from '../../shared/components/button/button';
import * as auth from '../../../lib/api/auth';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, Input, Button],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);

  loading = false;

  form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email } = this.form.getRawValue();
    this.loading = true;

    try {
      const response = await auth.forgotPassword(email);
      toast.success(response.message || 'Email di ripristino inviata con successo.');
      this.router.navigate(['/login']);
    } catch (error) {
      if (isAxiosError(error) && error.response?.data) {
        const apiError = error.response.data as ApiError;
        toast.error(apiError.message);
      } else {
        toast.error('Si è verificato un errore. Riprova.');
      }
    } finally {
      this.loading = false;
    }
  }
}
