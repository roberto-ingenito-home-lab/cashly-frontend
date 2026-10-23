import { inject, Injectable, signal } from '@angular/core';
import { InvestmentsApi } from '../../../lib/api/investments';
import {
  CreateInvestmentAccountDto,
  InvestmentAccount,
  InvestmentCashOperationDto,
  InvestmentLogType,
  PagedInvestmentLogs,
  UpdateInvestmentLogDto,
} from '../../../lib/types/investment';

function normalizeLogType(val: unknown): InvestmentLogType {
  if (typeof val === 'number') return val as InvestmentLogType;
  switch (val) {
    case 'DEPOSIT':
      return InvestmentLogType.DEPOSIT;
    case 'WITHDRAWAL':
      return InvestmentLogType.WITHDRAWAL;
    case 'INTEREST':
      return InvestmentLogType.INTEREST;
    case 'VALUE_SNAPSHOT':
      return InvestmentLogType.VALUE_SNAPSHOT;
    default:
      return InvestmentLogType.DEPOSIT;
  }
}

@Injectable({ providedIn: 'root' })
export class InvestmentsStore {
  private api = inject(InvestmentsApi);

  accounts = signal<InvestmentAccount[]>([]);
  logsByAccount = signal<Record<number, PagedInvestmentLogs>>({});
  loading = signal<boolean>(false);

  async init(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.api.getAccounts();
      this.accounts.set(data ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  async loadAccountLogs(accountId: number, page = 1, pageSize = 10): Promise<void> {
    const res = await this.api.getAccountLogs(accountId, page, pageSize);

    const normalized: PagedInvestmentLogs = {
      ...res,
      items: (res?.items ?? []).map((l) => ({
        ...l,
        actionType: normalizeLogType(l.actionType),
      })),
    };

    this.logsByAccount.update((prev) => ({
      ...prev,
      [accountId]: normalized,
    }));
  }

  async createAccount(dto: CreateInvestmentAccountDto): Promise<void> {
    await this.api.createAccount(dto);
    await this.load();
  }

  async recordOperation(dto: InvestmentCashOperationDto): Promise<void> {
    await this.api.recordOperation(dto);
    await this.load();
    const currentPaged = this.logsByAccount()[dto.accountId];
    if (currentPaged) {
      await this.loadAccountLogs(dto.accountId, currentPaged.page, currentPaged.pageSize);
    }
  }

  async updateAccountValue(
    id: number,
    currentValue: number,
    logDate?: string,
    note?: string,
  ): Promise<void> {
    await this.api.updateAccountValue(id, {
      currentValue,
      logDate,
      note,
    });
    await this.load();
    const currentPaged = this.logsByAccount()[id];
    if (currentPaged) {
      await this.loadAccountLogs(id, currentPaged.page, currentPaged.pageSize);
    }
  }

  async updateLog(
    id: number,
    accountId: number,
    dto: UpdateInvestmentLogDto,
  ): Promise<void> {
    await this.api.updateLog(id, dto);
    await this.load();
    const currentPaged = this.logsByAccount()[accountId];
    if (currentPaged) {
      await this.loadAccountLogs(accountId, currentPaged.page, currentPaged.pageSize);
    }
  }

  async deleteLog(id: number, accountId: number): Promise<void> {
    await this.api.deleteLog(id);
    await this.load();
    const currentPaged = this.logsByAccount()[accountId];
    if (currentPaged) {
      await this.loadAccountLogs(accountId, currentPaged.page, currentPaged.pageSize);
    }
  }

  async deleteAccount(id: number): Promise<void> {
    await this.api.deleteAccount(id);
    await this.load();
  }
}
