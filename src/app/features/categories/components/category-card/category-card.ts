import { Component, inject, input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Category } from '../../../../../lib/types/category';
import { Button } from '../../../../shared/components/button/button';
import { Icon } from '../../../../shared/components/icon/icon';
import { CategoriesStore } from '../../../../core/services/categories.store';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { CategoryDialog, CategoryDialogData } from '../category-dialog/category-dialog';

@Component({
  selector: 'app-category-card',
  imports: [Button, Icon],
  templateUrl: './category-card.html',
  styleUrl: './category-card.scss',
})
export class CategoryCard {
  private dialog = inject(MatDialog);
  private categoriesStore = inject(CategoriesStore);

  category = input.required<Omit<Category, 'userId'>>();

  onEdit() {
    this.dialog.open<CategoryDialog, CategoryDialogData, boolean>(CategoryDialog, {
      data: { category: this.category() },
      width: '480px',
      maxWidth: '95vw',
    });
  }

  onDelete() {
    const ref = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Eliminare categoria?',
        message: 'Questa azione non può essere annullata.',
        confirmLabel: 'Elimina',
        variant: 'danger',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.categoriesStore.deleteCategory(this.category().categoryId);
      }
    });
  }
}
