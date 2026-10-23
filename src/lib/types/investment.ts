export enum InvestmentLogType {
  DEPOSIT = 0, // Versamento nel conto (es. bonifico 1.000€, rata PAC, ecc.)
  WITHDRAWAL = 1, // Prelievo dal conto
  INTEREST = 2, // Interesse accreditato (in €)
  VALUE_SNAPSHOT = 3, // Aggiornamento manuale del valore attuale del conto
}

export interface InvestmentLog {
  id: number;
  accountId: number;
  actionType: InvestmentLogType;
  amount: number;
  logDate: string;
  note?: string;
}

export interface PagedInvestmentLogs {
  items: InvestmentLog[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface InvestmentAccount {
  id: number;
  name: string;
  colorHex: string;
  iconName: string;
  updatedAt: string;
  totalTransferred: number;
  totalCurrentValue: number;
  totalInterestCredited: number;
  totalLogsCount: number;
  profitLoss: number;
  unrealizedMarketProfitLoss: number;
  returnPercentage: number;
}

export interface CreateInvestmentAccountDto {
  name: string;
  initialDeposit: number;
  initialCurrentValue?: number | null;
  colorHex: string;
  iconName: string;
}

export interface InvestmentCashOperationDto {
  accountId: number;
  operationType: InvestmentLogType;
  amount: number;
  logDate?: string;
  note?: string;
}

export interface UpdateInvestmentAccountValueDto {
  currentValue: number;
  logDate?: string;
  note?: string;
}

export interface UpdateInvestmentLogDto {
  actionType: InvestmentLogType;
  amount: number;
  logDate?: string;
  note?: string;
}
