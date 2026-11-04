import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  InvestmentAccount,
  InvestmentLog,
  InvestmentLogType,
  PagedInvestmentLogs,
} from '../../../../../lib/types/investment';
import { InvestmentsStore } from '../../../../core/services/investments.store';
import { AuthStore } from '../../../../core/services/auth.store';
import { Button } from '../../../../shared/components/button/button';
import { Icon } from '../../../../shared/components/icon/icon';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';
import {
  InvestmentLogEditDialog,
  InvestmentLogEditDialogData,
} from '../investment-log-edit-dialog/investment-log-edit-dialog';
import { toast } from 'ngx-sonner';

export interface InvestmentLogsDialogData {
  account: InvestmentAccount;
}

/** Metadati di presentazione per ciascun tipo di movimento */
interface LogMeta {
  label: string;
  icon: string;
  variant: 'deposit' | 'withdrawal' | 'interest' | 'snapshot';
  sign: '+' | '-' | '';
}

@Component({
  selector: 'app-investment-logs-dialog',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatProgressSpinner, Button, Icon],
  templateUrl: './investment-logs-dialog.html',
  styleUrl: './investment-logs-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentLogsDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<InvestmentLogsDialog>);
  private dialog = inject(MatDialog);
  private authStore = inject(AuthStore);
  protected store = inject(InvestmentsStore);
  protected data = inject<InvestmentLogsDialogData>(MAT_DIALOG_DATA);

  protected readonly pageSize = 10;

  private userCurrency = computed(() => this.authStore.state()?.user.currency || 'EUR');

  /** true durante il caricamento di una pagina */
  loading = signal(false);

  pagedState = computed<PagedInvestmentLogs | undefined>(
    () => this.store.logsByAccount()[this.data.account.id],
  );

  /** Account aggiornato dallo store (i totali cambiano dopo modifica/eliminazione) */
  account = computed<InvestmentAccount>(
    () => this.store.accounts().find((a) => a.id === this.data.account.id) ?? this.data.account,
  );

  async ngOnInit(): Promise<void> {
    await this.loadPage(1);
  }

  private async loadPage(page: number) {
    this.loading.set(true);
    try {
      await this.store.loadAccountLogs(this.data.account.id, page, this.pageSize);
    } finally {
      this.loading.set(false);
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

  getLogMeta(type: InvestmentLogType): LogMeta {
    switch (type) {
      case InvestmentLogType.DEPOSIT:
        return { label: 'Versamento', icon: 'south_west', variant: 'deposit', sign: '+' };
      case InvestmentLogType.WITHDRAWAL:
        return { label: 'Prelievo', icon: 'north_east', variant: 'withdrawal', sign: '-' };
      case InvestmentLogType.INTEREST:
        return { label: 'Interesse accreditato', icon: 'savings', variant: 'interest', sign: '+' };
      case InvestmentLogType.VALUE_SNAPSHOT:
        return { label: 'Valore attuale segnato', icon: 'sync', variant: 'snapshot', sign: '' };
      default:
        return { label: 'Movimento', icon: 'swap_horiz', variant: 'snapshot', sign: '' };
    }
  }

  async setPage(page: number) {
    const paged = this.pagedState();
    if (!paged || page < 1 || page > paged.totalPages || this.loading()) return;
    await this.loadPage(page);
  }

  openEditLogModal(log: InvestmentLog) {
    this.dialog.open<InvestmentLogEditDialog, InvestmentLogEditDialogData, boolean>(
      InvestmentLogEditDialog,
      {
        data: { account: this.account(), log },
        width: '500px',
        maxWidth: '95vw',
      },
    );
  }

  deleteLog(log: InvestmentLog) {
    const ref = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Eliminare movimento?',
        message:
          "Questa operazione ricalcolerà i saldi ed eliminerà l'eventuale transazione collegata.",
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

  close() {
    this.dialogRef.close();
  }
}
