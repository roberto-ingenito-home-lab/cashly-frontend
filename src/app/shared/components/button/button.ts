import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrl: './button.scss',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  type = input<'button' | 'submit' | 'reset'>('button');
  variant = input<'primary' | 'secondary' | 'outlined' | 'danger'>('primary');
  icon = input<string>();
  iconSize = input<number>(20);
  iconOnly = input(false);
  size = input<number>(32);
  padding = input<string>();
  disabled = input(false);
  clicked = output<void>();
}
