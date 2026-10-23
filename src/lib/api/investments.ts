import { inject, Injectable } from '@angular/core';
import { ApiClient } from './client';
import {
  CreateInvestmentAccountDto,
  InvestmentAccount,
  InvestmentCashOperationDto,
  PagedInvestmentLogs,
  UpdateInvestmentAccountValueDto,
  UpdateInvestmentLogDto,
} from '../types/investment';

@Injectable({ providedIn: 'root' })
export class InvestmentsApi {
  private client = inject(ApiClient);

  getAccounts(): Promise<InvestmentAccount[]> {
    return this.client.get<InvestmentAccount[]>('/Investments/accounts');
  }

  getAccountLogs(accountId: number, page = 1, pageSize = 10): Promise<PagedInvestmentLogs> {
    return this.client.get<PagedInvestmentLogs>(`/Investments/accounts/${accountId}/logs`, {
      page,
      pageSize,
    });
  }

  createAccount(dto: CreateInvestmentAccountDto): Promise<InvestmentAccount> {
    return this.client.post<InvestmentAccount>('/Investments/accounts', dto);
  }

  recordOperation(dto: InvestmentCashOperationDto): Promise<InvestmentAccount> {
    return this.client.post<InvestmentAccount>('/Investments/operations', dto);
  }

  updateAccountValue(
    id: number,
    dto: UpdateInvestmentAccountValueDto,
  ): Promise<InvestmentAccount> {
    return this.client.patch<InvestmentAccount>(`/Investments/accounts/${id}/value`, dto);
  }

  updateLog(id: number, dto: UpdateInvestmentLogDto): Promise<InvestmentAccount> {
    return this.client.put<InvestmentAccount>(`/Investments/logs/${id}`, dto);
  }

  deleteLog(id: number): Promise<void> {
    return this.client.delete(`/Investments/logs/${id}`);
  }

  deleteAccount(id: number): Promise<void> {
    return this.client.delete(`/Investments/accounts/${id}`);
  }
}
