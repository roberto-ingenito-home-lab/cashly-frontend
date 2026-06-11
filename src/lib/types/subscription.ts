import { Category } from './category';
import { TransactionType } from './transaction';

export enum SubscriptionFrequency {
  Weekly = "Weekly",
  Monthly = "Monthly",
  Bimonthly = "Bimonthly",
  Quarterly = "Quarterly",
  SemiAnnually = "SemiAnnually",
  Annually = "Annually",
}

export interface Subscription {
  subscriptionId: number;
  name: string;
  amount: number;
  type: TransactionType;
  frequency: SubscriptionFrequency;
  startDate?: string | null;
  endDate?: string | null;
  lastPaymentDate?: string | null;
  categoryId?: number | null;
  category?: Category | null;
}

export interface SubscriptionCreateDto {
  name: string;
  amount: number;
  type: TransactionType;
  frequency: SubscriptionFrequency;
  startDate?: string | null;
  endDate?: string | null;
  categoryId?: number | null;
}

export interface SubscriptionUpdateDto {
  name: string;
  amount: number;
  type: TransactionType;
  frequency: SubscriptionFrequency;
  startDate?: string | null;
  endDate?: string | null;
  categoryId?: number | null;
}

