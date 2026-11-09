import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CategoriesStore } from '../../../core/services/categories.store';

let nextId = 0;

@Component({
  selector: 'app-category-select',
  imports: [FormsModule],
  templateUrl: './category-select.html',
  styleUrl: './category-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategorySelect),
      multi: true,
    },
  ],
})
export class CategorySelect implements ControlValueAccessor {
  private categoriesStore = inject(CategoriesStore);

  readonly selectId = `category-select-${nextId++}`;

  label = input<string>('Categoria');
  emptyLabel = input<string>('Nessuna');

  protected value = signal<number | null>(null);
  protected isDisabled = signal(false);

  protected visibleCategories = computed(() => {
    const all = this.categoriesStore.state() ?? [];
    return all
      .filter((c) => !c.isHidden)
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'it', { sensitivity: 'base' }));
  });

  protected hiddenCategories = computed(() => {
    const all = this.categoriesStore.state() ?? [];
    return all
      .filter((c) => !!c.isHidden)
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'it', { sensitivity: 'base' }));
  });

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected handleChange(val: number | null): void {
    this.value.set(val);
    this.onChange(val);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
