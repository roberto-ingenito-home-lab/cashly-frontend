import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'material-symbols-rounded',
    'aria-hidden': 'true',
    '[style.font-size.px]': 'size()',
    '[style.font-variation-settings]': 'variationSettings()',
  },
})
export class Icon {
  size = input<number>(24);
  filled = input<boolean>(true);
  weight = input<100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900>(400);

  protected variationSettings = computed(
    () =>
      `'FILL' ${this.filled() ? 1 : 0}, 'wght'  ${this.weight()}, 'GRAD' 0, 'opsz' ${this.size()}`,
  );
}
