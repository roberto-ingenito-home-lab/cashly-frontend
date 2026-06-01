import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Button } from '../../shared/components/button/button';
import { CategoriesStore } from '../../core/services/categories.store';
import { CategoryCard } from './components/category-card/category-card';
import { CategoryDialog, CategoryDialogData } from './components/category-dialog/category-dialog';

@Component({
  selector: 'app-categories',
  imports: [Button, CategoryCard],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Categories {
  categoriesStore = inject(CategoriesStore);
  private dialog = inject(MatDialog);

  openCategoryDialog() {
    this.dialog.open<CategoryDialog, CategoryDialogData, boolean>(CategoryDialog, {
      data: {},
      width: '480px',
      maxWidth: '95vw',
    });
  }
}
