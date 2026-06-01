import { inject, Injectable } from '@angular/core';
import { Transaction, TransactionCreateDto, TransactionUpdateDto } from '../types/transaction';
import { ApiClient } from './client';

@Injectable({ providedIn: 'root' })
export class TransactionsApi {
  private client = inject(ApiClient);

  getTransactions(): Promise<Transaction[]> {
    return this.client.get<Transaction[]>(`/Transactions`);
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
