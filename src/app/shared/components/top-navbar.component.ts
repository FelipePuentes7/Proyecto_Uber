import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { ApiConfigService } from '../../core/services/api-config.service';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  template: `
    <header class="uber-navbar">
      <div class="navbar-inner">
        <div class="brand-area">
          <div class="logo-mark">U</div>
          <div>
            <div class="brand-title">
              Uber<span>Move</span>
            </div>
            <div class="server-pill" (click)="toggleServerModal()">
              <span class="pulse-dot"></span>
              <span class="mono">{{ apiConfig.apiUrl() }}</span>
              <ion-icon name="options-outline"></ion-icon>
            </div>
          </div>
        </div>

        @if (auth.currentUser(); as user) {
          <div class="user-actions">
            <div class="user-chip" (click)="refreshProfile()" title="Consultar GET /api/auth/me">
              <div class="avatar">{{ user.name.charAt(0).toUpperCase() }}</div>
              <div class="user-meta">
                <span class="user-name">{{ user.name }}</span>
                <span class="role-tag" [attr.data-role]="user.role">
                  {{ roleLabel(user.role) }}
                </span>
              </div>
            </div>

            <button class="logout-btn" (click)="onLogout()" [disabled]="loggingOut()" title="Cerrar Sesión">
              <ion-icon name="log-out-outline"></ion-icon>
              <span class="hide-sm">Salir</span>
            </button>
          </div>
        }
      </div>

      @if (profileMessage()) {
        <div class="profile-toast">
          <ion-icon name="checkmark-circle-outline"></ion-icon>
          <span>{{ profileMessage() }}</span>
        </div>
      }

      @if (showServerConfig()) {
        <div class="server-modal-backdrop" (click)="toggleServerModal()">
          <div class="server-modal uber-card" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h4>Configuración del Servidor Laravel</h4>
              <button class="close-btn" (click)="toggleServerModal()">
                <ion-icon name="close-circle-outline"></ion-icon>
              </button>
            </div>
            <p class="modal-sub">
              URL Base de la API REST (Por defecto IP del profesor: <code>http://20.20.2.171:8000/api</code>)
            </p>
            <div class="uber-input-group">
              <label>Endpoint Base API</label>
              <input
                type="text"
                class="uber-input mono"
                [(ngModel)]="customUrl"
                placeholder="http://20.20.2.171:8000/api"
              />
            </div>
            <div class="preset-btns">
              <button type="button" class="chip-btn" (click)="customUrl = 'http://20.20.2.171:8000/api'">
                IP Profesor (20.20.2.171:8000)
              </button>
              <button type="button" class="chip-btn" (click)="customUrl = 'http://127.0.0.1:8000/api'">
                Localhost (127.0.0.1:8000)
              </button>
            </div>
            <div class="modal-actions">
              <button type="button" class="uber-btn btn-outline" (click)="resetUrl()">Restablecer</button>
              <button type="button" class="uber-btn btn-primary" (click)="saveUrl()">Guardar URL</button>
            </div>
          </div>
        </div>
      }
    </header>
  `,
  styles: [`
    .uber-navbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(9, 9, 11, 0.08);
    }

    .navbar-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .brand-area {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-mark {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: #09090b;
      color: #ffffff;
      font-weight: 800;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: -0.03em;
    }

    .brand-title {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #09090b;
      line-height: 1.1;

      span {
        color: #10b981;
        margin-left: 2px;
      }
    }

    .server-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 3px;
      padding: 2px 8px;
      border-radius: 999px;
      background: #f4f4f5;
      font-size: 11px;
      color: #52525b;
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: #e4e4e7;
        color: #09090b;
      }
    }

    .user-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 5px 12px 5px 6px;
      border-radius: 999px;
      background: #f4f4f5;
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: #e4e4e7;
      }
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #09090b;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }

    .user-name {
      font-size: 13px;
      font-weight: 700;
      color: #09090b;
    }

    .role-tag {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #10b981;

      &[data-role="driver"] {
        color: #2563eb;
      }
      &[data-role="admin"] {
        color: #9333ea;
      }
    }

    .logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      padding: 9px 14px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: #fee2e2;
      }
    }

    .profile-toast {
      background: #09090b;
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .server-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(9, 9, 11, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 2000;
    }

    .server-modal {
      width: 100%;
      max-width: 460px;
    }

    .modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      h4 {
        margin: 0;
        font-size: 17px;
        font-weight: 800;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 22px;
        cursor: pointer;
        color: #71717a;
      }
    }

    .modal-sub {
      font-size: 13px;
      color: #52525b;
      margin-bottom: 16px;
    }

    .preset-btns {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 18px;
    }

    .chip-btn {
      background: #f4f4f5;
      border: 1px solid #e4e4e7;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        background: #09090b;
        color: #ffffff;
      }
    }

    .modal-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    @media (max-width: 600px) {
      .hide-sm {
        display: none;
      }
    }
  `]
})
export class TopNavbarComponent {
  readonly auth = inject(AuthService);
  readonly apiConfig = inject(ApiConfigService);

  readonly showServerConfig = signal(false);
  readonly loggingOut = signal(false);
  readonly profileMessage = signal<string | null>(null);
  customUrl = this.apiConfig.baseUrl;

  roleLabel(role: string): string {
    if (role === 'admin') return 'Administrador';
    if (role === 'driver') return 'Conductor';
    return 'Cliente';
  }

  toggleServerModal(): void {
    this.customUrl = this.apiConfig.baseUrl;
    this.showServerConfig.update((v) => !v);
  }

  saveUrl(): void {
    if (this.customUrl.trim()) {
      this.apiConfig.setBaseUrl(this.customUrl);
    }
    this.showServerConfig.set(false);
  }

  resetUrl(): void {
    this.apiConfig.resetToDefault();
    this.customUrl = this.apiConfig.baseUrl;
    this.showServerConfig.set(false);
  }

  refreshProfile(): void {
    this.auth.getMe().subscribe({
      next: (res) => {
        this.profileMessage.set(
          `Perfil sincronizado (/api/auth/me): ${res.user.name} · Estado: ${res.user.status}`
        );
        setTimeout(() => this.profileMessage.set(null), 3500);
      },
      error: () => {
        this.profileMessage.set('No se pudo sincronizar el perfil con el servidor.');
        setTimeout(() => this.profileMessage.set(null), 3500);
      }
    });
  }

  onLogout(): void {
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      next: () => this.loggingOut.set(false),
      error: () => this.loggingOut.set(false)
    });
  }
}

