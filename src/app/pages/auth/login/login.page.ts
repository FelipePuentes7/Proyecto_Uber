import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { ApiConfigService } from '../../../core/services/api-config.service';
import { ClientService } from '../../../core/services/client.service';
import { Fare } from '../../../core/models/api.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonIcon],
  template: `
    <ion-content [fullscreen]="true">
      <div class="auth-layout">
        <!-- Left Hero Panel -->
        <div class="auth-hero">
          <div class="hero-top">
            <div class="brand-badge">
              <span class="logo-box">U</span>
              <span>Uber<strong>Move</strong></span>
            </div>
            <div class="ip-chip" (click)="editingServer.set(!editingServer())">
              <span class="pulse-dot"></span>
              <span class="mono">{{ apiConfig.apiUrl() }}</span>
              <ion-icon name="options-outline"></ion-icon>
            </div>
          </div>

          @if (editingServer()) {
            <div class="ip-editor">
              <label>URL Base del Backend Laravel (IP Profesor: 20.20.2.171)</label>
              <div class="ip-row">
                <input
                  type="text"
                  class="mono"
                  [(ngModel)]="tempApiUrl"
                  placeholder="http://20.20.2.171:8000/api"
                />
                <button type="button" (click)="saveApiUrl()">Guardar</button>
              </div>
            </div>
          }

          <div class="hero-copy">
            <span class="eyebrow">PLATAFORMA DE MOVILIDAD URBANA</span>
            <h1>Viaja, conduce y gestiona en tiempo real.</h1>
            <p>
              Conectado a la API REST en Laravel 12 con autenticación JWT, cálculo geográfico Haversine y control transaccional de concurrencia en PostgreSQL 18.
            </p>

            @if (activeFare(); as fare) {
              <div class="live-fare-widget">
                <div class="fare-header">
                  <span class="pulse-dot"></span>
                  <span>TARIFA URBANA ACTIVA · {{ fare.name }}</span>
                </div>
                <div class="fare-metrics">
                  <div>
                    <small>Base</small>
                    <strong>\${{ fare.base_fare | number }}</strong>
                  </div>
                  <div>
                    <small>Por Km</small>
                    <strong>\${{ fare.price_per_km | number }}</strong>
                  </div>
                  <div>
                    <small>Por Min</small>
                    <strong>\${{ fare.price_per_minute | number }}</strong>
                  </div>
                  <div>
                    <small>Mínima</small>
                    <strong>\${{ fare.minimum_fare | number }}</strong>
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="hero-footer">
            <div class="role-pill">
              <ion-icon name="person-outline"></ion-icon> Cliente
            </div>
            <div class="role-pill">
              <ion-icon name="car-sport-outline"></ion-icon> Conductor
            </div>
            <div class="role-pill">
              <ion-icon name="shield-checkmark-outline"></ion-icon> Admin RBAC
            </div>
          </div>
        </div>

        <!-- Right Form Panel -->
        <div class="auth-panel">
          <div class="auth-card">
            @if (!showForgotModal()) {
              <div class="card-head">
                <h2>Iniciar sesión</h2>
                <p>Ingresa con tu correo electrónico o número de teléfono</p>
              </div>

              @if (errorMessage()) {
                <div class="alert-box alert-error">
                  <ion-icon name="alert-circle-outline"></ion-icon>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              @if (successMessage()) {
                <div class="alert-box alert-success">
                  <ion-icon name="checkmark-circle-outline"></ion-icon>
                  <span>{{ successMessage() }}</span>
                </div>
              }

              <form (ngSubmit)="onLogin()">
                <div class="uber-input-group">
                  <label>Correo o Teléfono</label>
                  <input
                    type="text"
                    class="uber-input"
                    [(ngModel)]="loginInput"
                    name="loginInput"
                    placeholder="cliente@uber.com o 3001234567"
                    required
                  />
                </div>

                <div class="uber-input-group">
                  <div class="label-row">
                    <label>Contraseña</label>
                    <button type="button" class="link-btn" (click)="showForgotModal.set(true)">
                      ¿Olvidaste tu clave?
                    </button>
                  </div>
                  <div class="password-wrap">
                    <input
                      [type]="showPassword() ? 'text' : 'password'"
                      class="uber-input"
                      [(ngModel)]="passwordInput"
                      name="passwordInput"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      class="eye-btn"
                      (click)="showPassword.set(!showPassword())"
                    >
                      <ion-icon [name]="showPassword() ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                    </button>
                  </div>
                </div>

                <button type="submit" class="uber-btn btn-primary" [disabled]="loading()">
                  @if (loading()) {
                    <span>Autenticando con JWT...</span>
                  } @else {
                    <span>Continuar</span>
                    <ion-icon name="chevron-forward-outline"></ion-icon>
                  }
                </button>
              </form>

              <div class="quick-demo-section">
                <span class="demo-title">Acceso rápido de prueba (Seeders API)</span>
                <div class="demo-grid">
                  <button type="button" class="demo-chip" (click)="fillDemo('cliente@uber.com', 'cliente123')">
                    <ion-icon name="person-outline"></ion-icon>
                    <span>Cliente</span>
                  </button>
                  <button type="button" class="demo-chip" (click)="fillDemo('conductor@uber.com', 'conductor123')">
                    <ion-icon name="car-sport-outline"></ion-icon>
                    <span>Conductor</span>
                  </button>
                  <button type="button" class="demo-chip" (click)="fillDemo('admin@uber.com', 'admin123')">
                    <ion-icon name="shield-checkmark-outline"></ion-icon>
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              <div class="auth-switch">
                <span>¿Aún no tienes cuenta en la plataforma?</span>
                <a routerLink="/register">Crear cuenta como Cliente o Conductor</a>
              </div>
            } @else {
              <!-- Forgot Password View (POST /api/auth/forgot-password) -->
              <div class="card-head">
                <button type="button" class="back-pill" (click)="showForgotModal.set(false)">
                  <ion-icon name="arrow-back-outline"></ion-icon> Volver al login
                </button>
                <h2>Restablecer contraseña</h2>
                <p>Endpoint RF-CLI-03: <code>POST /api/auth/forgot-password</code></p>
              </div>

              @if (errorMessage()) {
                <div class="alert-box alert-error">
                  <ion-icon name="alert-circle-outline"></ion-icon>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <form (ngSubmit)="onResetPassword()">
                <div class="uber-input-group">
                  <label>Correo electrónico registrado</label>
                  <input
                    type="email"
                    class="uber-input"
                    [(ngModel)]="resetEmail"
                    name="resetEmail"
                    placeholder="cliente@uber.com"
                    required
                  />
                </div>

                <div class="uber-input-group">
                  <label>Nueva contraseña segura</label>
                  <input
                    type="password"
                    class="uber-input"
                    [(ngModel)]="resetNewPassword"
                    name="resetNewPassword"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>

                <button type="submit" class="uber-btn btn-primary" [disabled]="loading()">
                  @if (loading()) {
                    <span>Actualizando clave...</span>
                  } @else {
                    <span>Actualizar contraseña</span>
                  }
                </button>
              </form>
            }
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1.08fr 1fr;
      background: #f8fafc;
    }

    .auth-hero {
      background: #09090b;
      color: #ffffff;
      padding: 40px 48px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }

    .auth-hero::after {
      content: '';
      position: absolute;
      width: 420px;
      height: 420px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0) 70%);
      bottom: -140px;
      right: -100px;
      pointer-events: none;
    }

    .hero-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .brand-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.03em;

      strong {
        color: #10b981;
      }
    }

    .logo-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #ffffff;
      color: #09090b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
    }

    .ip-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.09);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      cursor: pointer;
    }

    .ip-editor {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 14px;
      padding: 14px;
      margin-top: 12px;

      label {
        display: block;
        font-size: 11px;
        text-transform: uppercase;
        color: #a1a1aa;
        margin-bottom: 8px;
      }

      .ip-row {
        display: flex;
        gap: 8px;

        input {
          flex: 1;
          background: #18181b;
          border: 1px solid #3f3f46;
          color: #ffffff;
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 12px;
        }

        button {
          background: #10b981;
          color: #09090b;
          border: none;
          border-radius: 10px;
          padding: 0 14px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }
      }
    }

    .hero-copy {
      max-width: 520px;
      margin: 40px 0;

      .eyebrow {
        display: inline-block;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.14em;
        color: #10b981;
        margin-bottom: 14px;
      }

      h1 {
        font-size: 42px;
        font-weight: 800;
        line-height: 1.08;
        letter-spacing: -0.03em;
        margin: 0 0 16px;
      }

      p {
        font-size: 15px;
        line-height: 1.6;
        color: #a1a1aa;
        margin: 0 0 28px;
      }
    }

    .live-fare-widget {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      padding: 18px;
    }

    .fare-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #d4d4d8;
      margin-bottom: 12px;
    }

    .fare-metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;

      small {
        display: block;
        font-size: 11px;
        color: #a1a1aa;
      }

      strong {
        font-size: 16px;
        font-weight: 800;
        color: #ffffff;
      }
    }

    .hero-footer {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .role-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.07);
      font-size: 12px;
      font-weight: 600;
      color: #e4e4e7;
    }

    .auth-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
      background: #ffffff;
      border-radius: 24px;
      padding: 36px 32px;
      border: 1px solid rgba(9, 9, 11, 0.07);
      box-shadow: 0 20px 50px rgba(9, 9, 11, 0.06);
    }

    .card-head {
      margin-bottom: 24px;

      h2 {
        font-size: 26px;
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0 0 6px;
      }

      p {
        font-size: 14px;
        color: #71717a;
        margin: 0;
      }
    }

    .label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;

      label {
        margin-bottom: 0;
      }
    }

    .link-btn {
      background: none;
      border: none;
      color: #2563eb;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
    }

    .password-wrap {
      position: relative;

      .eye-btn {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #71717a;
        font-size: 18px;
        cursor: pointer;
      }
    }

    .alert-box {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 18px;

      ion-icon {
        font-size: 18px;
        flex-shrink: 0;
        margin-top: 1px;
      }
    }

    .alert-error {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .alert-success {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }

    .quick-demo-section {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #f4f4f5;

      .demo-title {
        display: block;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #71717a;
        margin-bottom: 10px;
      }
    }

    .demo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .demo-chip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 9px 10px;
      border-radius: 12px;
      background: #f4f4f5;
      border: 1px solid transparent;
      font-size: 12px;
      font-weight: 700;
      color: #09090b;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: #09090b;
        color: #ffffff;
      }
    }

    .auth-switch {
      margin-top: 24px;
      text-align: center;
      font-size: 13px;
      color: #52525b;
      display: flex;
      flex-direction: column;
      gap: 4px;

      a {
        color: #09090b;
        font-weight: 800;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .back-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f4f4f5;
      border: none;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      margin-bottom: 12px;
    }

    @media (max-width: 920px) {
      .auth-layout {
        grid-template-columns: 1fr;
      }
      .auth-hero {
        padding: 28px 24px;
      }
      .hero-copy h1 {
        font-size: 30px;
      }
    }
  `]
})
export class LoginPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly clientService = inject(ClientService);
  readonly apiConfig = inject(ApiConfigService);

  loginInput = '';
  passwordInput = '';
  resetEmail = '';
  resetNewPassword = '';

  readonly showPassword = signal(false);
  readonly showForgotModal = signal(false);
  readonly editingServer = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly activeFare = signal<Fare | null>(null);

  tempApiUrl = this.apiConfig.baseUrl;

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.auth.navigateByRole();
      return;
    }
    this.loadPublicFare();
  }

  loadPublicFare(): void {
    this.clientService.getActiveFare().subscribe({
      next: (res) => {
        if (res?.fare) {
          this.activeFare.set(res.fare);
        }
      },
      error: () => {
        // Silent fallback if offline
      }
    });
  }

  saveApiUrl(): void {
    if (this.tempApiUrl.trim()) {
      this.apiConfig.setBaseUrl(this.tempApiUrl);
      this.editingServer.set(false);
      this.loadPublicFare();
    }
  }

  fillDemo(login: string, pass: string): void {
    this.loginInput = login;
    this.passwordInput = pass;
    this.errorMessage.set(null);
  }

  onLogin(): void {
    if (!this.loginInput.trim() || !this.passwordInput) {
      this.errorMessage.set('Por favor ingresa tu correo/teléfono y contraseña.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.auth.login(this.loginInput.trim(), this.passwordInput).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.auth.navigateByRole(res.user.role);
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err?.error?.message ||
          (err?.status === 0
            ? `No se pudo conectar al servidor Laravel en ${this.apiConfig.baseUrl}. Verifica la red o IP.`
            : 'Credenciales inválidas o cuenta no autorizada.');
        this.errorMessage.set(msg);
      }
    });
  }

  onResetPassword(): void {
    if (!this.resetEmail.trim() || !this.resetNewPassword) {
      this.errorMessage.set('Completa el correo electrónico y la nueva contraseña.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.forgotPassword(this.resetEmail.trim(), this.resetNewPassword).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.showForgotModal.set(false);
        this.loginInput = this.resetEmail.trim();
        this.passwordInput = '';
        this.successMessage.set(
          res.message || 'Contraseña restablecida exitosamente. Ya puede iniciar sesión con su nueva clave.'
        );
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err?.error?.message || 'No fue posible restablecer la contraseña. Verifica el correo.'
        );
      }
    });
  }
}

