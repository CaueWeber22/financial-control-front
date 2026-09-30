import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'cointrol-theme';
  private readonly mode = signal<ThemeMode>(this.initialTheme());

  readonly current = this.mode.asReadonly();
  readonly isDark = computed(() => this.mode() === 'dark');

  constructor() {
    this.applyTheme(this.mode());
    this.watchSystemTheme();
  }

  toggle(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  private setTheme(mode: ThemeMode): void {
    this.mode.set(mode);
    this.applyTheme(mode);
    this.writeStoredTheme(mode);
  }

  private initialTheme(): ThemeMode {
    const view = this.document.defaultView;
    const stored = this.readStoredTheme();

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    return view?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(mode: ThemeMode): void {
    const root = this.document.documentElement;
    root.dataset['theme'] = mode;
    root.style.colorScheme = mode;
  }

  private watchSystemTheme(): void {
    const view = this.document.defaultView;
    const media = view?.matchMedia('(prefers-color-scheme: dark)');

    media?.addEventListener('change', event => {
      const stored = this.readStoredTheme();

      if (stored === 'light' || stored === 'dark') {
        return;
      }

      const nextTheme = event.matches ? 'dark' : 'light';
      this.mode.set(nextTheme);
      this.applyTheme(nextTheme);
    });
  }

  private readStoredTheme(): string | null {
    try {
      return this.document.defaultView?.localStorage.getItem(this.storageKey) ?? null;
    } catch {
      return null;
    }
  }

  private writeStoredTheme(mode: ThemeMode): void {
    try {
      this.document.defaultView?.localStorage.setItem(this.storageKey, mode);
    } catch {
      // Theme still applies for the current session when storage is unavailable.
    }
  }
}
