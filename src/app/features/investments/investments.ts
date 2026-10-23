import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { InvestmentsStore } from '../../core/services/investments.store';
import {
  InvestmentAccount,
  InvestmentLog,
  InvestmentLogType,
  PagedInvestmentLogs,
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
  InvestmentLogEditDialog,
  InvestmentLogEditDialogData,
} from './components/investment-log-edit-dialog/investment-log-edit-dialog';
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
  expandedIds = signal<Set<number>>(new Set());

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

  getLogLabel(type: InvestmentLogType): string {
    switch (type) {
      case InvestmentLogType.DEPOSIT:
        return '→ VERSAMENTO';
      case InvestmentLogType.WITHDRAWAL:
        return '← PRELIEVO';
      case InvestmentLogType.INTEREST:
        return '+ INTERESSE ACCREDITATO';
      case InvestmentLogType.VALUE_SNAPSHOT:
        return 'VALORE ATTUALE SEGNATO';
      default:
        return 'MOVIMENTO';
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedIds().has(id);
  }

  async toggleLogs(acc: InvestmentAccount) {
    const next = new Set(this.expandedIds());
    if (next.has(acc.id)) {
      next.delete(acc.id);
      this.expandedIds.set(next);
    } else {
      next.add(acc.id);
      this.expandedIds.set(next);
      await this.store.loadAccountLogs(acc.id, 1, this.pageSize);
    }
  }

  getAccountPagedState(accId: number): PagedInvestmentLogs | undefined {
    return this.store.logsByAccount()[accId];
  }

  async setPage(acc: InvestmentAccount, page: number) {
    await this.store.loadAccountLogs(acc.id, page, this.pageSize);
  }

  openAccountModal() {
    this.dialog.open(InvestmentAccountDialog, {
      width: '500px',
      maxWidth: '95vw',
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

  openEditLogModal(acc: InvestmentAccount, log: InvestmentLog) {
    this.dialog.open<InvestmentLogEditDialog, InvestmentLogEditDialogData, boolean>(
      InvestmentLogEditDialog,
      {
        data: { account: acc, log },
        width: '500px',
        maxWidth: '95vw',
      },
    );
  }

  deleteLog(log: InvestmentLog) {
    const ref = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Eliminare movimento?',
        message: "Questa operazione ricalcolera i saldi ed eliminera l'eventuale transazione collegata.",
        confirmLabel: 'Elimina',
        variant: 'danger',
      },
    });

    ref.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await this.store.deleteLog(log.id, log.accountId);
          toast.success('Movimento rimosso e tutti i saldi sono stati ricalcolati.');
        } catch {
          toast.error('Errore rimozione voce.');
        }
      }
    });
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
