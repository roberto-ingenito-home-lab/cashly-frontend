import { inject, Injectable, signal } from '@angular/core';
import { TransactionsApi } from '../../../lib/api/transactions';
import {
  PaginatedTransactions,
  TransactionCreateDto,
  TransactionUpdateDto,
} from '../../../lib/types/transaction';

@Injectable({ providedIn: 'root' })
export class TransactionsStore {
  private _state = signal<PaginatedTransactions | null>(null);
  private api = inject(TransactionsApi);

  private currentParams: Record<string, any> = { page: 0, pageSize: 20 };

  state = this._state.asReadonly();

  async load(params: Record<string, any>) {
    this.currentParams = { ...this.currentParams, ...params };
    const data = await this.api.getTransactions(this.currentParams);
    this._state.set(data);
  }

  async init() {
    await this.load(this.currentParams);
  }

  reset = () => this._state.set(null);

  async deleteTransaction(id: number) {
    await this.api.deleteTransaction(id);
    await this.init(); // Reload current page
  }

  async createTransaction(data: TransactionCreateDto) {
    await this.api.createTransaction(data);
    await this.init(); // Reload current page
  }

  async updateTransaction(transactionId: number, data: TransactionUpdateDto) {
    await this.api.updateTransaction({ transactionId, data });
    await this.init(); // Reload current page
  }
}
