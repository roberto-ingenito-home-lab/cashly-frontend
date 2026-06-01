import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<Theme>('light');

  toggle() {
    this.apply(this.theme() === 'light' ? 'dark' : 'light');
  }

  init() {
    this.apply(this.readStored() ?? this.systemPreference());
  }

  private apply(next: Theme) {
    this.theme.set(next);
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.style.colorScheme = next;
    localStorage.setItem(STORAGE_KEY, next);
  }

  private readStored(): Theme | null {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  }

  private systemPreference(): Theme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
