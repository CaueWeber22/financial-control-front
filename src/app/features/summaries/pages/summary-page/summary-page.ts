import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { FinanceStoreService } from '../../../../core/services/finance-store';

@Component({
  selector: 'app-summary-page',
  imports: [ReactiveFormsModule],
  templateUrl: './summary-page.html',
  styleUrl: './summary-page.scss',
})
export class SummaryPage {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(FinanceStoreService);

  protected readonly summaryForm = this.fb.nonNullable.group({
    from: [this.store.firstDayOfMonth(), Validators.required],
    to: [this.store.today(), Validators.required]
  });

  protected loadSummary(): void {
    const { from, to } = this.summaryForm.getRawValue();
    this.store.loadSummary(from, to);
  }

  protected money(value: number, currency = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency
    }).format(value || 0);
  }
}
