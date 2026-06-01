import { inject, Injectable, signal } from '@angular/core';
import { Category, CategoryCreateDto, CategoryUpdateDto } from '../../../lib/types/category';
import { CategoriesApi } from '../../../lib/api/categories';

type Categories = Omit<Category, 'userId'>[];

@Injectable({ providedIn: 'root' })
export class CategoriesStore {
  private _state = signal<Categories | null>(null);
  private api = inject(CategoriesApi);

  state = this._state.asReadonly();

  async init() {
    const categories = await this.api.getCategories();
    this._state.set(this.sort(categories));
  }

  reset = () => this._state.set(null);

  async createCategory(data: CategoryCreateDto) {
    const created = await this.api.createCategory(data);
    this._state.set(this.sort([...(this.state() ?? []), created]));
  }

  async updateCategory(categoryId: number, data: CategoryUpdateDto) {
    const updated = await this.api.updateCategory({ categoryId, data });
    this._state.set(
      this.sort(this.state()?.map((c) => (c.categoryId === categoryId ? updated : c)) ?? []),
    );
  }

  async deleteCategory(categoryId: number) {
    await this.api.deleteCategory(categoryId);
    this._state.set(this.state()?.filter((c) => c.categoryId !== categoryId) ?? []);
  }

  private sort(categories: Categories): Categories {
    return [...categories].sort((a, b) =>
      a.categoryName.toLowerCase().localeCompare(b.categoryName.toLowerCase()),
    );
  }
}
