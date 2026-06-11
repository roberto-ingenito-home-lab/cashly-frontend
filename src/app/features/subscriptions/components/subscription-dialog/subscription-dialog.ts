import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Subscription, SubscriptionFrequency } from '../../../../../lib/types/subscription';
import { TransactionType } from '../../../../../lib/types/transaction';
import { CategoriesStore } from '../../../../core/services/categories.store';
import { SubscriptionsStore } from '../../../../core/services/subscriptions.store';
import { Button } from '../../../../shared/components/button/button';
import { Input } from '../../../../shared/components/input/input';

export interface SubscriptionDialogData {
  subscription?: Subscription;
}

@Component({
  selector: 'app-subscription-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    Button,
    Input,
  ],
  templateUrl: './subscription-dialog.html',
  styleUrl: './subscription-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionDialog {
  private dialogRef = inject(MatDialogRef<SubscriptionDialog, boolean>);
  private data = inject<SubscriptionDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};
  private subscriptionsStore = inject(SubscriptionsStore);

  protected readonly TransactionType = TransactionType;
  protected readonly SubscriptionFrequency = SubscriptionFrequency;
  protected categoriesStore = inject(CategoriesStore);

  protected isEdit = computed(() => !!this.data.subscription);
  protected submitting = signal(false);
  protected error = signal<string | null>(null);

  protected frequencies = [
    { value: SubscriptionFrequency.Weekly, label: 'Settimanale' },
    { value: SubscriptionFrequency.Monthly, label: 'Mensile' },
    { value: SubscriptionFrequency.Bimonthly, label: 'Bimestrale' },
    { value: SubscriptionFrequency.Quarterly, label: 'Trimestrale' },
    { value: SubscriptionFrequency.SemiAnnually, label: 'Semestrale' },
    { value: SubscriptionFrequency.Annually, label: 'Annuale' },
  ];

  protected form = new FormGroup({
    name: new FormControl<string>(this.data.subscription?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    amount: new FormControl<number | null>(this.data.subscription?.amount ?? null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
    type: new FormControl<TransactionType>(this.data.subscription?.type ?? TransactionType.Expense, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    frequency: new FormControl<SubscriptionFrequency>(this.data.subscription?.frequency ?? SubscriptionFrequency.Monthly, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    startDate: new FormControl<string>(
      this.data.subscription?.startDate
        ? this.data.subscription.startDate.split('T')[0]
        : '',
      { nonNullable: true },
    ),
    endDate: new FormControl<string>(
      this.data.subscription?.endDate
        ? this.data.subscription.endDate.split('T')[0]
        : '',
      { nonNullable: true },
    ),
    categoryId: new FormControl<number | null>(this.data.subscription?.categoryId ?? null),
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

    const value = this.form.getRawValue();

    const payload = {
      name: value.name.trim(),
      amount: Number(value.amount),
      type: value.type,
      frequency: value.frequency,
      startDate: value.startDate ? new Date(value.startDate).toISOString() : null,
      endDate: value.endDate ? new Date(value.endDate).toISOString() : null,
      categoryId: value.categoryId !== null ? Number(value.categoryId) : null,
    };


    try {
      if (this.data.subscription) {
        await this.subscriptionsStore.updateSubscription(
          this.data.subscription.subscriptionId,
          payload,
        );
      } else {
        await this.subscriptionsStore.createSubscription(payload);
      }
      this.dialogRef.close(true);
    } catch {
      this.error.set('Si è verificato un errore. Riprova.');
      this.submitting.set(false);
    }
  }
}
