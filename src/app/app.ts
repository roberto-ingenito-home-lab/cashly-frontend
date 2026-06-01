import { afterNextRender, Component, effect, inject, OnInit, ApplicationRef } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter, first } from 'rxjs';
import { ThemeService } from './core/services/theme.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSonnerToaster],
  template: '<router-outlet /><ngx-sonner-toaster position="bottom-right" />',
})
export class App implements OnInit {
  private theme = inject(ThemeService);
  private router = inject(Router);
  private appRef = inject(ApplicationRef);
  private updates = inject(SwUpdate);

  constructor() {
    // Primo caricamento: rimuove la classe dopo che Angular ha renderizzato
    afterNextRender(() => {
      this.removeNoTransitions();
    });

    // Navigazioni successive: re-aggiunge la classe a ogni cambio route
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        document.body.classList.add('no-transitions');
      });

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.removeNoTransitions();
      });

    this.setupUpdateChecks();
  }

  ngOnInit() {
    this.theme.init();
    this.markIconsReadyWhenFontLoaded();
  }

  private setupUpdateChecks(): void {
    if (!this.updates.isEnabled) {
      return;
    }

    this.appRef.isStable
      .pipe(
        filter((stable) => stable),
        first(),
      )
      .subscribe(() => {
        this.checkForUpdate();
      });

    this.updates.versionUpdates.subscribe((evt) => {
      if (evt.type === 'VERSION_READY') {
        toast.info('Nuova versione disponibile!', {
          description: 'Clicca su "Aggiorna" per caricare l\'ultima versione.',
          action: {
            label: 'Aggiorna',
            onClick: () => {
              this.updates.activateUpdate().then(() => {
                document.location.reload();
              });
            },
          },
          duration: Infinity,
        });
      }
    });
  }

  private checkForUpdate(): void {
    this.updates.checkForUpdate().catch((err) => {
      console.error('Errore durante la ricerca di aggiornamenti:', err);
    });
  }

  private markIconsReadyWhenFontLoaded(): void {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts) {
      document.documentElement.classList.add('icons-ready');
      return;
    }
    fonts.load("24px 'Material Symbols Rounded Variable'").finally(() => {
      document.documentElement.classList.add('icons-ready');
    });
  }

  private removeNoTransitions(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.remove('no-transitions');
      });
    });
  }
}
