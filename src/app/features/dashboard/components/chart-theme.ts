import { computed, inject, Signal } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

export type ChartThemeMode = 'light' | 'dark';

export function useChartThemeMode(): Signal<ChartThemeMode> {
  const themeService = inject(ThemeService);
  return computed(() => themeService.theme());
}

export interface ChartColors {
  primary: string;
  secondary: string;
  secondaryStrong: string;
  success: string;
  successStrong: string;
  danger: string;
  dangerLight: string;
  dangerStrong: string;
  default200: string;
  default400: string;
  default500: string;
  default600: string;
  foreground: string;
}

export function useChartColors() {
  const themeService = inject(ThemeService);

  return computed<ChartColors>(() => {
    themeService.theme();
    const root = getComputedStyle(document.documentElement);
    const v = (name: string) => root.getPropertyValue(name).trim();
    return {
      primary: v('--color-primary'),
      secondary: v('--color-secondary'),
      secondaryStrong: v('--color-secondary-600'),
      success: v('--color-success-500'),
      successStrong: v('--color-success-600'),
      danger: v('--color-danger-500'),
      dangerLight: v('--color-danger-400'),
      dangerStrong: v('--color-danger-600'),
      default200: v('--color-default-200'),
      default400: v('--color-default-400'),
      default500: v('--color-default-500'),
      default600: v('--color-default-600'),
      foreground: v('--color-foreground'),
    };
  });
}
