import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-investments',
  imports: [FormsModule, DecimalPipe, Button, Icon],
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

  accountModalOpen = signal(false);
  accountForm = {
    name: '',
    initialDeposit: 1000,
    initialCurrentValue: 1000 as number | null,
    colorHex: '#4a7063',
    iconName: 'account_balance',
  };

  selectedAccount = signal<InvestmentAccount | null>(null);

  operationModalOpen = signal(false);
  operationForm = {
    operationType: InvestmentLogType.DEPOSIT,
    amount: 1000,
    logDate: new Date().toISOString().slice(0, 10),
    note: '',
  };

  valueModalOpen = signal(false);
  valueForm = {
    currentValue: 0,
    logDate: new Date().toISOString().slice(0, 10),
    note: '',
  };

  editLogModalOpen = signal(false);
  editingLog = signal<InvestmentLog | null>(null);
  editLogForm = {
    actionType: InvestmentLogType.DEPOSIT,
    amount: 0,
    logDate: new Date().toISOString().slice(0, 10),
    note: '',
  };

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
    this.accountForm = {
      name: '',
      initialDeposit: 1000,
      initialCurrentValue: 1000,
      colorHex: '#4a7063',
      iconName: 'account_balance',
    };
    this.accountModalOpen.set(true);
  }

  openOperationModal(acc: InvestmentAccount, type: InvestmentLogType) {
    this.selectedAccount.set(acc);
    this.operationForm = {
      operationType: type,
      amount: type === InvestmentLogType.INTEREST ? 25 : 1000,
      logDate: new Date().toISOString().slice(0, 10),
      note: '',
    };
    this.operationModalOpen.set(true);
  }

  openValueModal(acc: InvestmentAccount) {
    this.selectedAccount.set(acc);
    this.valueForm = {
      currentValue: acc.totalCurrentValue,
      logDate: new Date().toISOString().slice(0, 10),
      note: '',
    };
    this.valueModalOpen.set(true);
  }

  openEditLogModal(acc: InvestmentAccount, log: InvestmentLog) {
    this.selectedAccount.set(acc);
    this.editingLog.set(log);
    const dateFormatted = log.logDate
      ? new Date(log.logDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    this.editLogForm = {
      actionType: log.actionType,
      amount: log.amount,
      logDate: dateFormatted,
      note: log.note || '',
    };
    this.editLogModalOpen.set(true);
  }

  closeModals() {
    this.accountModalOpen.set(false);
    this.operationModalOpen.set(false);
    this.valueModalOpen.set(false);
    this.editLogModalOpen.set(false);
    this.editingLog.set(null);
  }

  async saveAccount() {
    if (!this.accountForm.name.trim()) {
      toast.error('Inserisci il nome del conto.');
      return;
    }
    try {
      const initialDep = Number(this.accountForm.initialDeposit || 0);
      const initialVal =
        this.accountForm.initialCurrentValue !== null &&
        this.accountForm.initialCurrentValue !== undefined
          ? Number(this.accountForm.initialCurrentValue)
          : initialDep;

      await this.store.createAccount({
        name: this.accountForm.name,
        initialDeposit: initialDep,
        initialCurrentValue: initialVal,
        colorHex: this.accountForm.colorHex,
        iconName: this.accountForm.iconName,
      });
      toast.success('Conto creato con successo.');
      this.closeModals();
    } catch {
      toast.error('Errore durante la creazione del conto.');
    }
  }

  async saveOperation() {
    const acc = this.selectedAccount();
    if (!acc || this.operationForm.amount <= 0) {
      toast.error('Inserisci un importo valido.');
      return;
    }
    try {
      await this.store.recordOperation({
        accountId: acc.id,
        operationType: Number(this.operationForm.operationType),
        amount: Number(this.operationForm.amount),
        logDate: this.operationForm.logDate,
        note: this.operationForm.note,
      });
      toast.success('Operazione registrata e saldi ricalcolati!');
      this.closeModals();
    } catch {
      toast.error("Errore durante il salvataggio dell'operazione.");
    }
  }

  async saveValue() {
    const acc = this.selectedAccount();
    if (!acc || this.valueForm.currentValue < 0) {
      toast.error('Inserisci un valore valido.');
      return;
    }
    try {
      await this.store.updateAccountValue(
        acc.id,
        Number(this.valueForm.currentValue),
        this.valueForm.logDate,
        this.valueForm.note,
      );
      toast.success('Valore attuale aggiornato!');
      this.closeModals();
    } catch {
      toast.error("Errore durante l'aggiornamento del valore.");
    }
  }

  async saveEditedLog() {
    const log = this.editingLog();
    if (!log || this.editLogForm.amount < 0) {
      toast.error('Inserisci un importo valido.');
      return;
    }
    try {
      await this.store.updateLog(log.id, log.accountId, {
        actionType: Number(this.editLogForm.actionType),
        amount: Number(this.editLogForm.amount),
        logDate: this.editLogForm.logDate,
        note: this.editLogForm.note,
      });
      toast.success('Operazione modificata e saldi ricalcolati!');
      this.closeModals();
    } catch {
      toast.error('Errore durante la modifica del movimento.');
    }
  }

  async deleteLog(log: InvestmentLog) {
    try {
      await this.store.deleteLog(log.id, log.accountId);
      toast.success('Movimento rimosso e tutti i saldi sono stati ricalcolati.');
    } catch {
      toast.error('Errore rimozione voce.');
    }
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
