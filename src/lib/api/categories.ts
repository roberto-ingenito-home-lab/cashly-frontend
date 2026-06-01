import { inject, Injectable } from '@angular/core';
import { CategoryResponseDto, CategoryCreateDto, CategoryUpdateDto } from '../types/category';
import { ApiClient } from './client';

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  private client = inject(ApiClient);

  getCategories(): Promise<CategoryResponseDto[]> {
    return this.client.get<CategoryResponseDto[]>('/Categories');
  }

  createCategory(data: CategoryCreateDto): Promise<CategoryResponseDto> {
    return this.client.post<CategoryResponseDto>('/Categories', data);
  }

  updateCategory({
    categoryId,
    data,
  }: {
    categoryId: number;
    data: CategoryUpdateDto;
  }): Promise<CategoryResponseDto> {
    return this.client.put<CategoryResponseDto>(`/Categories/${categoryId}`, data);
  }

  deleteCategory(categoryId: number): Promise<void> {
    return this.client.delete(`/Categories/${categoryId}`);
  }
}
