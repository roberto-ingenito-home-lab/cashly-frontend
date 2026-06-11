import { inject, Injectable } from '@angular/core';
import { Subscription, SubscriptionCreateDto, SubscriptionUpdateDto } from '../types/subscription';
import { Transaction } from '../types/transaction';
import { ApiClient } from './client';

@Injectable({ providedIn: 'root' })
export class SubscriptionsApi {
  private client = inject(ApiClient);

  getSubscriptions(): Promise<Subscription[]> {
    return this.client.get<Subscription[]>(`/Subscriptions`);
  }

  createSubscription(data: SubscriptionCreateDto): Promise<Subscription> {
    return this.client.post<Subscription>(`/Subscriptions`, data);
  }

  deleteSubscription(subscriptionId: number): Promise<void> {
    return this.client.delete(`/Subscriptions/${subscriptionId}`);
  }

  updateSubscription({
    subscriptionId,
    data,
  }: {
    subscriptionId: number;
    data: SubscriptionUpdateDto;
  }): Promise<Subscription> {
    return this.client.put<Subscription>(`/Subscriptions/${subscriptionId}`, data);
  }

  postTransactionFromSubscription(subscriptionId: number): Promise<Transaction> {
    return this.client.post<Transaction>(`/Subscriptions/${subscriptionId}/post-transaction`);
  }
}
