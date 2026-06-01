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

  protected isFullscreen = signal(false);

  constructor() {
    fromEvent(document, 'fullscreenchange')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isFullscreen.set(document.fullscreenElement === this.host.nativeElement);
      });
  }

  protected toggleFullscreen(): void {
    if (document.fullscreenElement === this.host.nativeElement) {
      document.exitFullscreen();
      return;
    }

    this.host.nativeElement.requestFullscreen?.();
  }
}
