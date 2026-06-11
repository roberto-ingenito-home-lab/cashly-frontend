import { inject, Injectable, signal } from '@angular/core';
import { Subscription, SubscriptionCreateDto, SubscriptionUpdateDto } from '../../../lib/types/subscription';
import { SubscriptionsApi } from '../../../lib/api/subscriptions';
import { TransactionsStore } from './transactions.store';

@Injectable({ providedIn: 'root' })
export class SubscriptionsStore {
  private _state = signal<Subscription[] | null>(null);
  private api = inject(SubscriptionsApi);
  private transactionsStore = inject(TransactionsStore);

  state = this._state.asReadonly();

  async init() {
    const subscriptions = await this.api.getSubscriptions();
    this._state.set(subscriptions);
  }

  reset = () => this._state.set(null);

  async createSubscription(data: SubscriptionCreateDto) {
    const created = await this.api.createSubscription(data);
    this._state.set([...(this.state() ?? []), created]);
  }

  async updateSubscription(subscriptionId: number, data: SubscriptionUpdateDto) {
    const updated = await this.api.updateSubscription({ subscriptionId, data });
    this._state.set(
      this.state()?.map((s) => (s.subscriptionId === subscriptionId ? updated : s)) ?? [],
    );
  }

  async deleteSubscription(subscriptionId: number) {
    await this.api.deleteSubscription(subscriptionId);
    this._state.set(this.state()?.filter((s) => s.subscriptionId !== subscriptionId) ?? []);
  }

  async postTransaction(subscriptionId: number) {
    await this.api.postTransactionFromSubscription(subscriptionId);
    
    // Refresh the transactions store to show the new transaction and update dashboard charts/total balance
    await this.transactionsStore.init();

    // Update the lastPaymentDate of the subscription in the local state
    const nowIso = new Date().toISOString();
    this._state.set(
      this.state()?.map((s) =>
        s.subscriptionId === subscriptionId ? { ...s, lastPaymentDate: nowIso } : s,
      ) ?? [],
    );
  }
}
