import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { InvestmentAccount } from '../../../../../lib/types/investment';
import { AuthStore } from '../../../../core/services/auth.store';
import { Button } from '../../../../shared/components/button/button';
import { Icon } from '../../../../shared/components/icon/icon';

export interface InvestmentPerformanceDialogData {
  account: InvestmentAccount;
}

@Component({
  selector: 'app-investment-performance-dialog',
  imports: [DecimalPipe, MatDialogTitle, MatDialogContent, MatDialogActions, Button, Icon],
  templateUrl: './investment-performance-dialog.html',
  styleUrl: './investment-performance-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentPerformanceDialog {
  private dialogRef = inject(MatDialogRef<InvestmentPerformanceDialog>);
  private authStore = inject(AuthStore);
  protected data = inject<InvestmentPerformanceDialogData>(MAT_DIALOG_DATA);

  private userCurrency = computed(() => this.authStore.state()?.user.currency || 'EUR');

  formatCurrency(value: number): string {
    return (value ?? 0).toLocaleString('it-IT', {
      style: 'currency',
      currency: this.userCurrency(),
    });
  }

  close() {
    this.dialogRef.close();
  }
}
