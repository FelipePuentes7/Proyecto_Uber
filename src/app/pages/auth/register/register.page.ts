import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterPayload } from '../../../core/models/api.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonIcon],
  template: `
    <ion-content [fullscreen]="true">
      <div class="reg-shell">
        <div class="reg-container uber-card">
          <div class="reg-top">
            <a routerLink="/login" class="back-link">
              <ion-icon name="arrow-back-outline"></ion-icon>
              <span>Volver al inicio de sesión</span>
            </a>
            <div class="brand-mini">
              <span class="logo-dot">U</span> Uber<strong>Move</strong>
            </div>
          </div>

          <div class="reg-header">
            <h1>Crear cuenta en la plataforma</h1>
            <p>Elige tu perfil para registrarte en <code>POST /api/auth/register</code></p>
          </div>

          <!-- Role Selector -->
          <div class="role-selector">
            <button
              type="button"
              class="role-tab"
              [class.active]="selectedRole() === 'client'"
              (click)="selectedRole.set('client')"
            >
              <ion-icon name="person-outline"></ion-icon>
              <div>
                <strong>Pasajero / Cliente</strong>
                <small>Solicita viajes y estima tarifas</small>
              </div>
            </button>

            <button
              type="button"
              class="role-tab"
              [class.active]="selectedRole() === 'driver'"
              (click)="selectedRole.set('driver')"
            >
              <ion-icon name="car-sport-outline"></ion-icon>
              <div>
                <strong>Socio Conductor</strong>
                <small>Registra tu licencia y vehículo</small>
              </div>
            </button>
          </div>

          @if (errorMessage()) {
            <div class="alert-error">
              <ion-icon name="alert-circle-outline"></ion-icon>
              <div>{{ errorMessage() }}</div>
            </div>
          }

          <form (ngSubmit)="onRegister()">
            <div class="section-label">Datos personales de la cuenta</div>
            <div class="grid-2">
              <div class="uber-input-group">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  class="uber-input"
                  [(ngModel)]="form.name"
                  name="name"
                  placeholder="Ej. Daniela Morales"
                  required
                />
              </div>

              <div class="uber-input-group">
                <label>Teléfono móvil *</label>
                <input
                  type="tel"
                  class="uber-input"
                  [(ngModel)]="form.phone"
                  name="phone"
                  placeholder="Ej. 3109876543"
                  required
                />
              </div>
            </div>

            <div class="grid-2">
              <div class="uber-input-group">
                <label>Correo electrónico *</label>
                <input
                  type="email"
                  class="uber-input"
                  [(ngModel)]="form.email"
                  name="email"
                  placeholder="daniela@ejemplo.com"
                  required
                />
              </div>

              <div class="uber-input-group">
                <label>Contraseña *</label>
                <input
                  type="password"
                  class="uber-input"
                  [(ngModel)]="form.password"
                  name="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            @if (selectedRole() === 'driver') {
              <div class="driver-box">
                <div class="section-label">
                  <ion-icon name="car-outline"></ion-icon>
                  Información de Licencia y Vehículo (Requerido para Conductor)
                </div>

                <div class="grid-2">
                  <div class="uber-input-group">
                    <label>Número de Licencia *</label>
                    <input
                      type="text"
                      class="uber-input mono"
                      [(ngModel)]="form.license_number"
                      name="license_number"
                      placeholder="LC-88291-CO"
                      required
                    />
                  </div>

                  <div class="uber-input-group">
                    <label>Placa del Vehículo *</label>
                    <input
                      type="text"
                      class="uber-input mono"
                      [(ngModel)]="form.plate"
                      name="plate"
                      placeholder="HJK-987"
                      required
                    />
                  </div>
                </div>

                <div class="grid-2">
                  <div class="uber-input-group">
                    <label>Marca *</label>
                    <input
                      type="text"
                      class="uber-input"
                      [(ngModel)]="form.brand"
                      name="brand"
                      placeholder="Mazda"
                      required
                    />
                  </div>

                  <div class="uber-input-group">
                    <label>Modelo / Línea *</label>
                    <input
                      type="text"
                      class="uber-input"
                      [(ngModel)]="form.model"
                      name="model"
                      placeholder="Mazda 3"
                      required
                    />
                  </div>
                </div>

                <div class="grid-3">
                  <div class="uber-input-group">
                    <label>Año / Modelo *</label>
                    <input
                      type="number"
                      class="uber-input"
                      [(ngModel)]="form.year"
                      name="year"
                      placeholder="2024"
                      required
                    />
                  </div>

                  <div class="uber-input-group">
                    <label>Capacidad (Pasajeros) *</label>
                    <input
                      type="number"
                      class="uber-input"
                      [(ngModel)]="form.capacity"
                      name="capacity"
                      placeholder="4"
                      required
                    />
                  </div>

                  <div class="uber-input-group">
                    <label>Color *</label>
                    <input
                      type="text"
                      class="uber-input"
                      [(ngModel)]="form.color"
                      name="color"
                      placeholder="Rojo Metálico"
                      required
                    />
                  </div>
                </div>
              </div>
            }

            <button type="submit" class="uber-btn btn-primary submit-btn" [disabled]="loading()">
              @if (loading()) {
                <span>Registrando usuario en Laravel...</span>
              } @else {
                <span>Registrarme como {{ selectedRole() === 'client' ? 'Cliente' : 'Conductor' }}</span>
                <ion-icon name="checkmark-circle-outline"></ion-icon>
              }
            </button>
          </form>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .reg-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      background: #f8fafc;
    }

    .reg-container {
      width: 100%;
      max-width: 680px;
      padding: 32px;
    }

    .reg-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #52525b;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;

      &:hover {
        color: #09090b;
      }
    }

    .brand-mini {
      font-size: 16px;
      font-weight: 800;

      .logo-dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        background: #09090b;
        color: #fff;
        font-size: 13px;
      }

      strong {
        color: #10b981;
      }
    }

    .reg-header {
      margin-bottom: 22px;

      h1 {
        font-size: 26px;
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0 0 6px;
      }

      p {
        margin: 0;
        color: #71717a;
        font-size: 14px;
      }
    }

    .role-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }

    .role-tab {
      display: flex;
      align-items: center;
      gap: 12px;
      text-align: left;
      padding: 16px;
      border-radius: 16px;
      border: 2px solid #e4e4e7;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.18s;

      ion-icon {
        font-size: 26px;
        color: #71717a;
      }

      strong {
        display: block;
        font-size: 14px;
        color: #09090b;
      }

      small {
        font-size: 12px;
        color: #71717a;
      }

      &.active {
        border-color: #09090b;
        background: #fafafa;
        box-shadow: 0 6px 20px rgba(9, 9, 11, 0.06);

        ion-icon {
          color: #10b981;
        }
      }
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #09090b;
      margin-bottom: 14px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 14px;
    }

    .driver-box {
      margin-top: 8px;
      margin-bottom: 16px;
      padding: 20px;
      border-radius: 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .alert-error {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      padding: 12px 16px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 18px;
    }

    .submit-btn {
      margin-top: 8px;
    }

    @media (max-width: 640px) {
      .role-selector,
      .grid-2,
      .grid-3 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RegisterPage {
  private readonly auth = inject(AuthService);

  readonly selectedRole = signal<'client' | 'driver'>('client');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  form = {
    name: '',
    email: '',
    phone: '',
    password: '',
    license_number: '',
    plate: '',
    brand: '',
    model: '',
    year: 2024,
    capacity: 4,
    color: ''
  };

  onRegister(): void {
    this.errorMessage.set(null);

    if (!this.form.name.trim() || !this.form.email.trim() || !this.form.phone.trim() || !this.form.password) {
      this.errorMessage.set('Por favor completa todos los campos obligatorios.');
      return;
    }

    let payload: RegisterPayload;

    if (this.selectedRole() === 'client') {
      payload = {
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        phone: this.form.phone.trim(),
        password: this.form.password,
        role: 'client'
      };
    } else {
      if (
        !this.form.license_number.trim() ||
        !this.form.plate.trim() ||
        !this.form.brand.trim() ||
        !this.form.model.trim() ||
        !this.form.color.trim()
      ) {
        this.errorMessage.set('Completa todos los datos de licencia y vehículo para registrarte como conductor.');
        return;
      }
      payload = {
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        phone: this.form.phone.trim(),
        password: this.form.password,
        role: 'driver',
        license_number: this.form.license_number.trim(),
        plate: this.form.plate.trim().toUpperCase(),
        brand: this.form.brand.trim(),
        model: this.form.model.trim(),
        year: Number(this.form.year),
        capacity: Number(this.form.capacity),
        color: this.form.color.trim()
      };
    }

    this.loading.set(true);
    this.auth.register(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.auth.navigateByRole(res.user.role);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 422 && err?.error?.errors) {
          const firstErr = Object.values(err.error.errors).flat()[0] as string;
          this.errorMessage.set(firstErr || 'Error de validación en los datos enviados.');
        } else {
          this.errorMessage.set(err?.error?.message || 'Error al registrar el usuario.');
        }
      }
    });
  }
}

