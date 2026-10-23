import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { ThemeService } from '../../core/services/theme.service';
import { AuthStore } from '../../core/services/auth.store';
import { CategoriesStore } from '../../core/services/categories.store';
import { TransactionsStore } from '../../core/services/transactions.store';
import { SubscriptionsStore } from '../../core/services/subscriptions.store';
import { InvestmentsStore } from '../../core/services/investments.store';
import { Icon } from '../../shared/components/icon/icon';
import { ChangePasswordDialog } from './components/change-password-dialog/change-password-dialog';
import { SwUpdate } from '@angular/service-worker';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatIconButton,
    MatTooltipModule,
    MatProgressSpinner,
    MatMenuModule,
    MatDividerModule,
    Icon,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthStore);
  private categoriesStore = inject(CategoriesStore);
  private transactionsStore = inject(TransactionsStore);
  private subscriptionsStore = inject(SubscriptionsStore);
  private investmentsStore = inject(InvestmentsStore);
  private dialog = inject(MatDialog);
  protected themeService = inject(ThemeService);
  private updates = inject(SwUpdate);

  protected readonly navItems = [
    { route: 'transactions', label: 'Transazioni', icon: 'receipt_long' },
    { route: 'subscriptions', label: 'Abbonamenti', icon: 'credit_card' },
    { route: 'investments', label: 'Investimenti', icon: 'trending_up' },
  ];

  isDark = computed(() => this.themeService.theme() === 'dark');
  userEmail = computed(() => this.auth.state()?.user.email ?? '');

  isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.categoriesStore.init(),
      this.transactionsStore.init(),
      this.subscriptionsStore.init(),
      this.investmentsStore.init(),
    ]);

    this.isLoading.set(false);
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  openChangePasswordDialog() {
    this.dialog.open(ChangePasswordDialog, {
      width: '420px',
      maxWidth: '95vw',
    });
  }

  async refreshPage() {
    if (!this.updates.isEnabled) {
      toast.success('Ricarico la pagina...');
      setTimeout(() => {
        document.location.reload();
      }, 500);
      return;
    }

    toast.info('Verifica aggiornamenti in corso...');
    try {
      const updateAvailable = await this.updates.checkForUpdate();
      if (updateAvailable) {
        toast.success('Nuova versione trovata! Aggiornamento in corso...');
        await this.updates.activateUpdate();
        document.location.reload();
      } else {
        toast.success('Applicazione aggiornata. Ricarico la pagina...');
        setTimeout(() => {
          document.location.reload();
        }, 800);
      }
    } catch (err) {
      console.error(err);
      toast.error('Errore durante la verifica degli aggiornamenti. Ricarico comunque...');
      setTimeout(() => {
        document.location.reload();
      }, 1500);
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
