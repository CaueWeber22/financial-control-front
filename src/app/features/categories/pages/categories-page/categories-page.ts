import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { FinanceStoreService } from '../../../../core/services/finance-store';
import { SessionService } from '../../../../core/services/session';

@Component({
  selector: 'app-categories-page',
  imports: [ReactiveFormsModule],
  templateUrl: './categories-page.html',
  styleUrl: './categories-page.scss',
})
export class CategoriesPage {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(SessionService);
  protected readonly store = inject(FinanceStoreService);

  protected readonly categoryForm = this.fb.nonNullable.group({
    name: ['Supermercado', Validators.required],
    kind: ['EXPENSE', Validators.required]
  });

  protected createCategory(): void {
    if (this.categoryForm.invalid) {
      this.session.showError('Informe nome e tipo da categoria.');
      return;
    }

    this.store.createCategory(this.categoryForm.getRawValue());
  }
}
