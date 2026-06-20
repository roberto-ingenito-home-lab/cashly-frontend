export enum TransactionType {
  Income = "income",
  Expense = "expense",
}

export interface Transaction {
  transactionId: number;
  amount: number;
  type: TransactionType;
  transactionDate: string;
  description: string | null;
  categoryId: number | null;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  totalCount: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export type TransactionCreateDto = Omit<Transaction, "transactionId">;

export type TransactionUpdateDto = Omit<Transaction, "transactionId">;
