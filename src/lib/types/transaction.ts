export enum TransactionType {
  Income = "income",
  Expense = "expense",
  TransferOut = "transfer_out",
  TransferIn = "transfer_in",
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
  totalTransfers: number;
  balance: number;
}

export type TransactionCreateDto = Omit<Transaction, "transactionId">;

export type TransactionUpdateDto = Omit<Transaction, "transactionId">;
