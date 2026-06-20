import { inject, Injectable } from '@angular/core';
import { PaginatedTransactions, Transaction, TransactionCreateDto, TransactionUpdateDto } from '../types/transaction';
import { ApiClient } from './client';

@Injectable({ providedIn: 'root' })
export class TransactionsApi {
  private client = inject(ApiClient);

  getTransactions(params?: Record<string, any>): Promise<PaginatedTransactions> {
    const queryParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
          queryParams.append(key, String(value));
        }
      }
    }
    const queryString = queryParams.toString();
    return this.client.get<PaginatedTransactions>(`/Transactions${queryString ? '?' + queryString : ''}`);
  }

  createTransaction(data: TransactionCreateDto): Promise<Transaction> {
    return this.client.post<Transaction>(`/Transactions`, data);
  }

  deleteTransaction(transactionId: number): Promise<void> {
    return this.client.delete(`/Transactions/${transactionId}`);
  }

  updateTransaction({
    transactionId,
    data,
  }: {
    transactionId: number;
    data: TransactionUpdateDto;
  }): Promise<Transaction> {
    return this.client.put<Transaction>(`/Transactions/${transactionId}`, data);
  }
}
