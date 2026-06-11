import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Button } from '../../shared/components/button/button';
import { Icon } from '../../shared/components/icon/icon';
import { SubscriptionsStore } from '../../core/services/subscriptions.store';
import { AuthStore } from '../../core/services/auth.store';
import { CategoriesStore } from '../../core/services/categories.store';
import { Subscription, SubscriptionFrequency } from '../../../lib/types/subscription';
import { TransactionType } from '../../../lib/types/transaction';
import { SubscriptionDialog, SubscriptionDialogData } from './components/subscription-dialog/subscription-dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-subscriptions',
  imports: [Button, Icon],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subscriptions {
  subscriptionsStore = inject(SubscriptionsStore);
  authStore = inject(AuthStore);
  categoriesStore = inject(CategoriesStore);
  private dialog = inject(MatDialog);

  userCurrency = computed(() => this.authStore.state()?.user.currency ?? 'EUR');

  subscriptions = computed(() => this.subscriptionsStore.state() ?? []);

  // Compute monthly total for expenses
  monthlyExpenses = computed(() => {
    const list = this.subscriptions().filter((s) => s.type === TransactionType.Expense);
    return list.reduce((sum, s) => sum + this.getMonthlyEquivalent(s.amount, s.frequency), 0);
  });

  // Compute monthly total for incomes
  monthlyIncomes = computed(() => {
    const list = this.subscriptions().filter((s) => s.type === TransactionType.Income);
    return list.reduce((sum, s) => sum + this.getMonthlyEquivalent(s.amount, s.frequency), 0);
  });

  private getMonthlyEquivalent(amount: number, frequency: SubscriptionFrequency): number {
    switch (frequency) {
      case SubscriptionFrequency.Weekly:
        return amount * (52 / 12);
      case SubscriptionFrequency.Monthly:
        return amount;
      case SubscriptionFrequency.Bimonthly:
        return amount / 2;
      case SubscriptionFrequency.Quarterly:
        return amount / 3;
      case SubscriptionFrequency.SemiAnnually:
        return amount / 6;
      case SubscriptionFrequency.Annually:
        return amount / 12;
      default:
        return amount;
    }
  }

  getFrequencyLabel(frequency: SubscriptionFrequency): string {
    switch (frequency) {
      case SubscriptionFrequency.Weekly:
        return 'Settimanale';
      case SubscriptionFrequency.Monthly:
        return 'Mensile';
      case SubscriptionFrequency.Bimonthly:
        return 'Bimestrale';
      case SubscriptionFrequency.Quarterly:
        return 'Trimestrale';
      case SubscriptionFrequency.SemiAnnually:
        return 'Semestrale';
      case SubscriptionFrequency.Annually:
        return 'Annuale';
      default:
        return frequency;
    }
  }

  formatDate(dateString?: string | null) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('it-IT', {
      style: 'currency',
      currency: this.userCurrency(),
    });
  }

  getCategory(categoryId?: number | null) {
    if (!categoryId) return null;
    return this.categoriesStore.state()?.find((c) => c.categoryId === categoryId);
  }

  openSubscriptionDialog(subscription?: Subscription) {
    this.dialog.open<SubscriptionDialog, SubscriptionDialogData, boolean>(SubscriptionDialog, {
      data: { subscription },
      width: '480px',
      maxWidth: '95vw',
    });
  }

  onDelete(subscription: Subscription) {
    const ref = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Eliminare abbonamento?',
        message: `Sei sicuro di voler eliminare l'abbonamento "${subscription.name}"? Lo storico e le transazioni già registrate non verranno eliminate.`,
        confirmLabel: 'Elimina',
        variant: 'danger',
      },
    });

    ref.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        try {
          await this.subscriptionsStore.deleteSubscription(subscription.subscriptionId);
          toast.success('Abbonamento eliminato con successo.');
        } catch {
          toast.error("Errore durante l'eliminazione dell'abbonamento.");
        }
      }
    });
  }

  async onPostTransaction(subscription: Subscription) {
    try {
      await this.subscriptionsStore.postTransaction(subscription.subscriptionId);
      toast.success(`Transazione registrata per "${subscription.name}"!`);
    } catch {
      toast.error('Errore durante la registrazione della transazione.');
    }
  }
}
