import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.html',
  styleUrl: './textarea.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Textarea),
      multi: true,
    },
  ],
})
export class Textarea implements ControlValueAccessor {
  readonly inputId = `textarea-${nextId++}`;
  readonly errorId = `${this.inputId}-error`;

  label = input('');
  placeholder = input('');
  rows = input<number>(4);
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
    const val = (event.target as HTMLTextAreaElement).value;
    this.value.set(val);
    this.onChange(val);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
