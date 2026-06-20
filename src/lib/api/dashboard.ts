import { inject, Injectable } from '@angular/core';
import { ApiClient } from './client';

export interface DashboardSummary {
  firstTransactionDate: string | null;
  cumulativeBalance: { x: number; y: number }[];
  expenseDistribution: { categoryId: number | null; amount: number }[];
  dailyTrends: { timestamp: number; incomes: number; expenses: number }[];
  yearlyOverview: { month: number; incomes: number; expenses: number }[];
}

export interface CategoryExpense {
  categoryId: number | null;
  amount: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private client = inject(ApiClient);

  getDashboardSummary(year: number, month: number): Promise<DashboardSummary> {
    return this.client.get<DashboardSummary>(`/Dashboard/summary?year=${year}&month=${month}`);
  }

  getCategoryBreakdown(filter: string): Promise<CategoryExpense[]> {
    return this.client.get<CategoryExpense[]>(`/Dashboard/category-breakdown?filter=${filter}`);
  }
}
