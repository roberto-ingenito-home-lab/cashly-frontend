export interface Category {
  categoryId: number;
  categoryName: string;
  iconName?: string;
  colorHex?: string;
  userId: number;
}

export type CategoryCreateDto = Omit<Category, "categoryId" | "userId">;

export type CategoryUpdateDto = Omit<Category, "categoryId" | "userId">;

export type CategoryResponseDto = Omit<Category, "userId">;
