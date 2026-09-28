import { Component, ElementRef, Injector, afterNextRender, inject, signal, viewChild } from '@angular/core';
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
  private readonly injector = inject(Injector);
  private readonly formHeading = viewChild<ElementRef<HTMLHeadingElement>>('formHeading');
  protected readonly session = inject(SessionService);
  protected readonly showRegistration = signal(false);

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  protected readonly registerForm = this.fb.nonNullable.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    gender: ['', Validators.required],
    date_of_birth: ['', Validators.required],
    password: ['', Validators.required]
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
        password: ''
      });
      this.registerForm.reset();
      this.showRegistration.set(false);
      this.focusHeading();
    });
  }

  protected openRegistration(): void {
    this.showRegistration.set(true);
    this.session.showMessage('');
    this.focusHeading();
  }

  protected backToLogin(): void {
    this.showRegistration.set(false);
    this.session.showMessage('');
    this.focusHeading();
  }

  private focusHeading(): void {
    afterNextRender(() => this.formHeading()?.nativeElement.focus(), { injector: this.injector });
  }
}
