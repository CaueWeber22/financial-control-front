import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SessionService } from '../../../../core/services/session';
import { HealthPill } from '../../../../shared/components/health-pill/health-pill';
import { Toast } from '../../../../shared/components/toast/toast';

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, HealthPill, Toast],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
})
export class AuthPage {
  private readonly fb = inject(FormBuilder);
  protected readonly session = inject(SessionService);

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  protected readonly registerForm = this.fb.nonNullable.group({
    first_name: ['Ada', Validators.required],
    last_name: ['Lovelace', Validators.required],
    email: ['ada@example.com', [Validators.required, Validators.email]],
    phone: ['+55 11 99999-9999'],
    gender: ['female', Validators.required],
    date_of_birth: ['1990-01-01', Validators.required],
    password: ['Valid@123', Validators.required]
  });

  constructor() {
    this.session.checkHealth();
  }

  protected login(): void {
    if (this.loginForm.invalid) {
      this.session.showError('Informe e-mail e senha para entrar.');
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.session.login(email, password);
  }

  protected register(): void {
    if (this.registerForm.invalid) {
      this.session.showError('Preencha os dados obrigatorios para criar o usuario.');
      return;
    }

    this.session.register(this.registerForm.getRawValue(), () => {
      this.loginForm.patchValue({
        email: this.registerForm.controls.email.value,
        password: this.registerForm.controls.password.value
      });
    });
  }
}
