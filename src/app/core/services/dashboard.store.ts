import { inject, Injectable, signal } from '@angular/core';
import { DashboardApi, DashboardSummary, CategoryExpense } from '../../../lib/api/dashboard';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private api = inject(DashboardApi);

  private _summary = signal<DashboardSummary | null>(null);
  summary = this._summary.asReadonly();

  async loadSummary(year: number, month: number) {
    const data = await this.api.getDashboardSummary(year, month);
    this._summary.set(data);
  }

  async getCategoryBreakdown(filter: string): Promise<CategoryExpense[]> {
    return this.api.getCategoryBreakdown(filter);
  }
}
