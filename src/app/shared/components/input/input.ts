import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

@Component({
  selector: 'app-input',
  templateUrl: './input.html',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Input),
      multi: true,
    },
  ],
})
export class Input implements ControlValueAccessor {
  readonly inputId = `input-${nextId++}`;
  readonly errorId = `${this.inputId}-error`;

  label = input('');
  type = input<string>('text');
  placeholder = input('');
  autocomplete = input<HTMLInputElement['autocomplete']>('off');
  hasError = input(false);

  protected value = signal('');
  protected isDisabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // Angular chiama questo quando vuole impostare un valore nel campo
  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  // Angular ti passa la funzione da chiamare quando il valore cambia
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  // Angular ti passa la funzione da chiamare quando il campo viene "toccato"
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // Angular chiama questo quando il formControl viene disabilitato/abilitato
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected handleInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
