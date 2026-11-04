import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { InvestmentsStore } from '../../core/services/investments.store';
import {
  InvestmentAccount,
  InvestmentLogType,
} from '../../../lib/types/investment';
import { AuthStore } from '../../core/services/auth.store';
import { Button } from '../../shared/components/button/button';
import { Icon } from '../../shared/components/icon/icon';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog';
import {
  InvestmentAccountDialog,
} from './components/investment-account-dialog/investment-account-dialog';
import {
  InvestmentAccountEditDialog,
  InvestmentAccountEditDialogData,
} from './components/investment-account-edit-dialog/investment-account-edit-dialog';
import {
  InvestmentPerformanceDialog,
  InvestmentPerformanceDialogData,
} from './components/investment-performance-dialog/investment-performance-dialog';
import {
  InvestmentOperationDialog,
  InvestmentOperationDialogData,
} from './components/investment-operation-dialog/investment-operation-dialog';
import {
  InvestmentValueDialog,
  InvestmentValueDialogData,
} from './components/investment-value-dialog/investment-value-dialog';
import {
  InvestmentLogsDialog,
  InvestmentLogsDialogData,
} from './components/investment-logs-dialog/investment-logs-dialog';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-investments',
  imports: [DecimalPipe, Button, Icon],
  templateUrl: './investments.html',
  styleUrl: './investments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Investments implements OnInit {
  protected store = inject(InvestmentsStore);
  private authStore = inject(AuthStore);
  private dialog = inject(MatDialog);

  protected readonly pageSize = 10;

  userCurrency = computed(() => this.authStore.state()?.user.currency || 'EUR');

  totalTransferred = computed(() =>
    this.store.accounts().reduce((sum, a) => sum + a.totalTransferred, 0),
  );

  totalCurrentValue = computed(() =>
    this.store.accounts().reduce((sum, a) => sum + a.totalCurrentValue, 0),
  );

  totalInterestCredited = computed(() =>
    this.store.accounts().reduce((sum, a) => sum + a.totalInterestCredited, 0),
  );

  totalProfitLoss = computed(() => this.totalCurrentValue() - this.totalTransferred());

  totalUnrealizedMarket = computed(() => this.totalProfitLoss() - this.totalInterestCredited());

  totalReturnPct = computed(() => {
    const tr = this.totalTransferred();
    return tr > 0 ? (this.totalProfitLoss() / tr) * 100 : 0;
  });

  async ngOnInit(): Promise<void> {
    if (this.store.accounts().length === 0) {
      await this.store.load();
    }
  }

  formatCurrency(value: number): string {
    return (value ?? 0).toLocaleString('it-IT', {
      style: 'currency',
      currency: this.userCurrency(),
    });
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  openAccountModal() {
    this.dialog.open(InvestmentAccountDialog, {
      width: '500px',
      maxWidth: '95vw',
    });
  }

  openLogsModal(acc: InvestmentAccount) {
    this.dialog.open<InvestmentLogsDialog, InvestmentLogsDialogData>(InvestmentLogsDialog, {
      data: { account: acc },
      width: '700px',
      maxWidth: '95vw',
      height: '620px',
      maxHeight: '90vh',
    });
  }

  openEditAccountModal(acc: InvestmentAccount) {
    this.dialog.open<InvestmentAccountEditDialog, InvestmentAccountEditDialogData, boolean>(
      InvestmentAccountEditDialog,
      {
        data: { account: acc },
        width: '450px',
        maxWidth: '95vw',
      },
    );
  }

  openPerformanceModal(acc: InvestmentAccount) {
    this.dialog.open<InvestmentPerformanceDialog, InvestmentPerformanceDialogData>(
      InvestmentPerformanceDialog,
      {
        data: { account: acc },
        width: '480px',
        maxWidth: '95vw',
      },
    );
  }

  openOperationModal(acc: InvestmentAccount, type: InvestmentLogType) {
    this.dialog.open<InvestmentOperationDialog, InvestmentOperationDialogData, boolean>(
      InvestmentOperationDialog,
      {
        data: { account: acc, initialType: type },
        width: '500px',
        maxWidth: '95vw',
      },
    );
  }

  openValueModal(acc: InvestmentAccount) {
    this.dialog.open<InvestmentValueDialog, InvestmentValueDialogData, boolean>(
      InvestmentValueDialog,
      {
        data: { account: acc },
        width: '500px',
        maxWidth: '95vw',
      },
    );
  }

  onDeleteAccount(acc: InvestmentAccount) {
    const ref = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Eliminare conto?',
        message: `Sei sicuro di voler eliminare "${acc.name}" e tutto lo storico?`,
        confirmLabel: 'Elimina',
        variant: 'danger',
      },
    });

    ref.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await this.store.deleteAccount(acc.id);
          toast.success('Conto eliminato.');
        } catch {
          toast.error("Errore durante l'eliminazione.");
        }
      }
    });
  }
}
