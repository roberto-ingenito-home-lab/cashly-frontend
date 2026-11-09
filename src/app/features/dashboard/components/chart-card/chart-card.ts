import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-chart-card',
  imports: [Icon],
  templateUrl: './chart-card.html',
  styleUrl: './chart-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.title]': 'null',
    '[class.is-fullscreen]': 'isFullscreen()',
  },
})
export class ChartCard {
  private host = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);

  title = input.required<string>();
  subtitle = input.required<string>();
  showNav = input<boolean>(true);
  canGoBack = input<boolean>(true);
  canGoForward = input<boolean>(true);

  back = output<void>();
  forward = output<void>();

  readonly isFullscreen = signal(false);

  constructor() {
    fromEvent(document, 'fullscreenchange')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const isFs = document.fullscreenElement === this.host.nativeElement;
        this.isFullscreen.set(isFs);
        if (!isFs) {
          this.unlockOrientation();
        }
        requestAnimationFrame(() => {
          window.dispatchEvent(new Event('resize'));
        });
      });
  }

  protected async toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement === this.host.nativeElement) {
      this.unlockOrientation();
      await document.exitFullscreen();
      return;
    }

    try {
      await this.host.nativeElement.requestFullscreen?.();
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: string) => Promise<void>;
      };
      await orientation?.lock?.('landscape');
    } catch {
      // Ignorato se il browser o il dispositivo non supporta il blocco dell'orientamento
    }
  }

  private unlockOrientation(): void {
    try {
      screen.orientation?.unlock?.();
    } catch {
      // Ignorato se non supportato
    }
  }
}
