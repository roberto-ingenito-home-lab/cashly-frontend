import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Category } from '../../../../../lib/types/category';
import { CategoriesStore } from '../../../../core/services/categories.store';
import { Button } from '../../../../shared/components/button/button';
import { Icon } from '../../../../shared/components/icon/icon';
import { Input } from '../../../../shared/components/input/input';

export interface CategoryDialogData {
  category?: Omit<Category, 'userId'>;
}

const ICON_OPTIONS = [
  'local_offer',
  'shopping_cart',
  'restaurant',
  'local_cafe',
  'local_bar',
  'local_grocery_store',
  'home',
  'local_gas_station',
  'flight',
  'train',
  'directions_bus',
  'medical_services',
  'fitness_center',
  'school',
  'savings',
  'payments',
  'card_giftcard',
  'checkroom',
  'movie',
  'music_note',
  'sports_esports',
  'wifi',
  'bolt',
  'water_drop',
  'celebration',
  'spa',
  'business_center',
  'health_and_safety',
  'sports_tennis',
  'sports_soccer',
  'smoking_rooms',
  'attach_money',
  'fastfood',
];

const COLOR_OPTIONS = [
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#ca8a04',
  '#65a30d',
  '#16a34a',
  '#059669',
  '#0891b2',
  '#2563eb',
  '#4f46e5',
  '#7c3aed',
  '#c026d3',
  '#db2777',
  '#78716c',
];

@Component({
  selector: 'app-category-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    Button,
    Icon,
    Input,
  ],
  templateUrl: './category-dialog.html',
  styleUrl: './category-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryDialog {
  private dialogRef = inject(MatDialogRef<CategoryDialog, boolean>);
  private data = inject<CategoryDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};
  private categoriesStore = inject(CategoriesStore);

  protected readonly iconOptions = ICON_OPTIONS;
  protected readonly colorOptions = COLOR_OPTIONS;

  protected isEdit = computed(() => !!this.data.category);
  protected submitting = signal(false);
  protected error = signal<string | null>(null);

  protected selectedIcon = signal<string>(this.data.category?.iconName ?? ICON_OPTIONS[0]);
  protected selectedColor = signal<string>(this.data.category?.colorHex ?? COLOR_OPTIONS[0]);

  protected form = new FormGroup({
    categoryName: new FormControl<string>(this.data.category?.categoryName ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
  });

  protected selectIcon(icon: string) {
    this.selectedIcon.set(icon);
  }

  protected selectColor(color: string) {
    this.selectedColor.set(color);
  }

  protected onColorPickerChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.selectedColor.set(value);
  }

  protected cancel() {
    this.dialogRef.close(false);
  }

  protected async submit() {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const value = this.form.getRawValue();
    const payload = {
      categoryName: value.categoryName.trim(),
      iconName: this.selectedIcon(),
      colorHex: this.selectedColor(),
    };

    try {
      if (this.data.category) {
        await this.categoriesStore.updateCategory(this.data.category.categoryId, payload);
      } else {
        await this.categoriesStore.createCategory(payload);
      }
      this.dialogRef.close(true);
    } catch {
      this.error.set('Si è verificato un errore. Riprova.');
      this.submitting.set(false);
    }
  }
}
