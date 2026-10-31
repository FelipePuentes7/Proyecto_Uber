import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { TopNavbarComponent } from '../../shared/components/top-navbar.component';
import { AdminService } from '../../core/services/admin.service';
import { AdminDashboardStats, DriverInfo, Fare } from '../../core/models/api.models';

type AdminSection = 'kpis' | 'drivers' | 'fares' | 'trips' | 'reports' | 'audit';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, TopNavbarComponent],
  template: `
    <ion-content [fullscreen]="true">
      <app-top-navbar></app-top-navbar>

      <div class="uber-shell">
        <!-- Header Banner -->
        <div class="admin-hero uber-card-dark">
          <div>
            <span class="eyebrow">PANEL EJECUTIVO RBAC · ROL ADMIN</span>
            <h1>Centro de Monitoreo y Gobierno Operativo</h1>
            <p>
              Gestión de socios conductores, tarifas dinámicas, auditoría RF-ADM-15 y métricas en tiempo real
            </p>
          </div>
          <button type="button" class="sync-all-btn" (click)="refreshCurrentSection()">
            <ion-icon name="refresh-outline"></ion-icon>
            <span>Sincronizar Datos</span>
          </button>
        </div>

        <!-- Navigation Pills -->
        <div class="admin-nav">
          <button
            type="button"
            class="nav-pill"
            [class.active]="section() === 'kpis'"
            (click)="selectSection('kpis')"
          >
            <ion-icon name="speedometer-outline"></ion-icon>
            <span>Dashboard KPIs</span>
          </button>

          <button
            type="button"
            class="nav-pill"
            [class.active]="section() === 'drivers'"
            (click)="selectSection('drivers')"
          >
            <ion-icon name="people-outline"></ion-icon>
            <span>Conductores y Aprobación</span>
            @if (stats().pending_drivers > 0) {
              <span class="count-badge">{{ stats().pending_drivers }}</span>
            }
          </button>

          <button
            type="button"
            class="nav-pill"
            [class.active]="section() === 'fares'"
            (click)="selectSection('fares')"
          >
            <ion-icon name="cash-outline"></ion-icon>
            <span>Tarifas Urbanas</span>
          </button>

          <button
            type="button"
            class="nav-pill"
            [class.active]="section() === 'trips'"
            (click)="selectSection('trips')"
          >
            <ion-icon name="car-sport-outline"></ion-icon>
            <span>Monitoreo de Viajes</span>
          </button>

          <button
            type="button"
            class="nav-pill"
            [class.active]="section() === 'reports'"
            (click)="selectSection('reports')"
          >
            <ion-icon name="analytics-outline"></ion-icon>
            <span>Reportes Consolidados</span>
          </button>

          <button
            type="button"
            class="nav-pill"
            [class.active]="section() === 'audit'"
            (click)="selectSection('audit')"
          >
            <ion-icon name="shield-checkmark-outline"></ion-icon>
            <span>Logs de Auditoría</span>
          </button>
        </div>

        @if (bannerMessage()) {
          <div class="admin-toast" [attr.data-type]="bannerMessage()!.type">
            <ion-icon
              [name]="bannerMessage()!.type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'"
            ></ion-icon>
            <span>{{ bannerMessage()!.text }}</span>
            <button type="button" (click)="bannerMessage.set(null)">✕</button>
          </div>
        }

        <!-- SECTION 1: DASHBOARD KPIs (GET /api/admin/dashboard) -->
        @if (section() === 'kpis') {
          <div class="kpi-grid">
            <div class="kpi-card uber-card highlight-emerald">
              <small>Ingresos Totales (Revenue)</small>
              <div class="kpi-val">\${{ stats().total_revenue | number }}</div>
              <span class="kpi-foot">COP acumulados en viajes completados</span>
            </div>

            <div class="kpi-card uber-card">
              <small>Clientes Registrados</small>
              <div class="kpi-val">{{ stats().total_clients }}</div>
              <span class="kpi-foot">Usuarios rol <code>client</code></span>
            </div>

            <div class="kpi-card uber-card">
              <small>Conductores Totales</small>
              <div class="kpi-val">{{ stats().total_drivers }}</div>
              <span class="kpi-foot">
                {{ stats().approved_drivers }} aprobados · {{ stats().pending_drivers }} pendientes
              </span>
            </div>

            <div class="kpi-card uber-card">
              <small>Viajes Completados</small>
              <div class="kpi-val">{{ stats().completed_trips }}</div>
              <span class="kpi-foot">
                {{ stats().active_trips }} activos · {{ stats().cancelled_trips }} cancelados
              </span>
            </div>

            <div class="kpi-card uber-card">
              <small>Solicitudes en Espera</small>
              <div class="kpi-val">{{ stats().pending_requests }}</div>
              <span class="kpi-foot">En cola de asignación</span>
            </div>

            <div class="kpi-card uber-card" (click)="selectSection('drivers')" style="cursor:pointer">
              <small>Aprobaciones Pendientes</small>
              <div class="kpi-val warn-text">{{ stats().pending_drivers }}</div>
              <span class="kpi-foot">Ir a verificar documentos →</span>
            </div>
          </div>

          <div class="split-2">
            <!-- Recent Trips -->
            <div class="uber-card">
              <div class="sub-head">
                <h3>Viajes Recientes</h3>
                <span class="uber-badge badge-dark">{{ recentTrips().length }}</span>
              </div>
              @if (recentTrips().length === 0) {
                <p class="muted-empty">No hay viajes recientes registrados.</p>
              } @else {
                <div class="compact-list">
                  @for (t of recentTrips(); track $index) {
                    <div class="compact-item">
                      <div>
                        <strong class="mono">Viaje #{{ t.id }}</strong>
                        <small>{{ t.driver?.user?.name || t.client?.name || 'Servicio Urbano' }}</small>
                      </div>
                      <div class="right-col-item">
                        <span class="uber-badge badge-info">{{ t.status }}</span>
                        <strong>\${{ (t.final_fare || t.estimated_fare || 0) | number }}</strong>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Recent Incidents -->
            <div class="uber-card">
              <div class="sub-head">
                <h3>Incidencias Reportadas</h3>
                <span class="uber-badge badge-danger">{{ recentIncidents().length }}</span>
              </div>
              @if (recentIncidents().length === 0) {
                <p class="muted-empty">Sin incidencias de seguridad reportadas recientemente.</p>
              } @else {
                <div class="compact-list">
                  @for (inc of recentIncidents(); track $index) {
                    <div class="compact-item incident-row">
                      <div>
                        <strong>Reporte #{{ inc.id || ($index + 1) }}</strong>
                        <small>{{ inc.comment || inc.description || 'Incidencia en calificación de viaje' }}</small>
                      </div>
                      <span class="uber-badge badge-danger">Calificación: {{ inc.score || '!' }}★</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- SECTION 2: DRIVERS & APPROVALS (GET /api/admin/drivers & PATCH /api/admin/drivers/{id}/approval) -->
        @if (section() === 'drivers') {
          <div class="uber-card">
            <div class="filter-bar">
              <div>
                <h2>Gestión y Aprobación de Conductores</h2>
                <p>Endpoint: <code>GET /api/admin/drivers</code> & <code>PATCH /api/admin/drivers/&#123;id&#125;/approval</code></p>
              </div>
              <div class="filter-pills">
                <button
                  type="button"
                  [class.active]="driverFilter() === 'all'"
                  (click)="filterDrivers('all')"
                >
                  Todos
                </button>
                <button
                  type="button"
                  [class.active]="driverFilter() === 'pending'"
                  (click)="filterDrivers('pending')"
                >
                  Pendientes
                </button>
                <button
                  type="button"
                  [class.active]="driverFilter() === 'approved'"
                  (click)="filterDrivers('approved')"
                >
                  Aprobados
                </button>
                <button
                  type="button"
                  [class.active]="driverFilter() === 'suspended'"
                  (click)="filterDrivers('suspended')"
                >
                  Suspendidos
                </button>
              </div>
            </div>

            @if (driversList().length === 0) {
              <p class="muted-empty">No se encontraron conductores con el filtro seleccionado.</p>
            } @else {
              <div class="drivers-grid">
                @for (drv of driversList(); track drv.id) {
                  <div class="driver-admin-card">
                    <div class="drv-top">
                      <div>
                        <strong>{{ drv.user?.name || 'Conductor #' + drv.id }}</strong>
                        <small>{{ drv.user?.email }}</small>
                      </div>
                      <span
                        class="uber-badge"
                        [ngClass]="{
                          'badge-success': drv.approval_status === 'approved',
                          'badge-warning': drv.approval_status === 'pending',
                          'badge-danger': drv.approval_status === 'rejected' || drv.approval_status === 'suspended'
                        }"
                      >
                        {{ drv.approval_status }}
                      </span>
                    </div>

                    <div class="drv-meta">
                      <div>
                        <small>Licencia</small>
                        <strong class="mono">{{ drv.license_number || 'N/A' }}</strong>
                      </div>
                      <div>
                        <small>Calificación</small>
                        <strong>★ {{ drv.rating_average || '5.0' }}</strong>
                      </div>
                    </div>

                    @if (drv.vehicles && drv.vehicles.length > 0) {
                      <div class="drv-vehicles">
                        @for (v of drv.vehicles; track v.plate) {
                          <div class="v-chip">
                            <span class="mono plate">{{ v.plate }}</span>
                            <span>{{ v.brand }} {{ v.model }} ({{ v.year }})</span>
                          </div>
                        }
                      </div>
                    }

                    <div class="drv-actions">
                      <button
                        type="button"
                        class="uber-btn btn-emerald"
                        (click)="openApprovalModal(drv, 'approved')"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        class="uber-btn btn-outline"
                        (click)="openApprovalModal(drv, 'suspended')"
                      >
                        Suspender
                      </button>
                      <button
                        type="button"
                        class="uber-btn btn-danger"
                        (click)="openApprovalModal(drv, 'rejected')"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- SECTION 3: URBAN FARES (GET /api/admin/fares & POST /api/admin/fares) -->
        @if (section() === 'fares') {
          <div class="split-2">
            <!-- Create New Fare Form -->
            <div class="uber-card">
              <h2>Configurar Nueva Tarifa Urbana</h2>
              <p class="sub-p">Endpoint: <code>POST /api/admin/fares</code></p>

              <form (ngSubmit)="onCreateFare()">
                <div class="uber-input-group">
                  <label>Nombre de la Tarifa *</label>
                  <input
                    type="text"
                    class="uber-input"
                    [(ngModel)]="newFare.name"
                    name="name"
                    placeholder="Tarifa Hora Pico"
                    required
                  />
                </div>

                <div class="grid-2">
                  <div class="uber-input-group">
                    <label>Tarifa Base (COP) *</label>
                    <input
                      type="number"
                      class="uber-input mono"
                      [(ngModel)]="newFare.base_fare"
                      name="base_fare"
                      required
                    />
                  </div>
                  <div class="uber-input-group">
                    <label>Precio por Km (COP) *</label>
                    <input
                      type="number"
                      class="uber-input mono"
                      [(ngModel)]="newFare.price_per_km"
                      name="price_per_km"
                      required
                    />
                  </div>
                </div>

                <div class="grid-3">
                  <div class="uber-input-group">
                    <label>Precio por Min *</label>
                    <input
                      type="number"
                      class="uber-input mono"
                      [(ngModel)]="newFare.price_per_minute"
                      name="price_per_minute"
                      required
                    />
                  </div>
                  <div class="uber-input-group">
                    <label>Tarifa Mínima *</label>
                    <input
                      type="number"
                      class="uber-input mono"
                      [(ngModel)]="newFare.minimum_fare"
                      name="minimum_fare"
                      required
                    />
                  </div>
                  <div class="uber-input-group">
                    <label>Multiplicador Surge *</label>
                    <input
                      type="number"
                      step="0.1"
                      class="uber-input mono"
                      [(ngModel)]="newFare.surge_multiplier"
                      name="surge_multiplier"
                      required
                    />
                  </div>
                </div>

                <label class="active-check">
                  <input type="checkbox" [(ngModel)]="newFare.active" name="active" />
                  <span>Activar inmediatamente como tarifa predeterminada de la plataforma</span>
                </label>

                <button type="submit" class="uber-btn btn-primary" [disabled]="savingFare()">
                  <ion-icon name="add-circle-outline"></ion-icon>
                  <span>{{ savingFare() ? 'Guardando tarifa...' : 'Guardar y Publicar Tarifa' }}</span>
                </button>
              </form>
            </div>

            <!-- Configured Fares List -->
            <div class="uber-card">
              <h2>Catálogo de Tarifas Configuradas</h2>
              <p class="sub-p">Endpoint: <code>GET /api/admin/fares</code></p>

              @if (faresList().length === 0) {
                <p class="muted-empty">No hay tarifas adicionales listadas.</p>
              } @else {
                <div class="compact-list">
                  @for (f of faresList(); track $index) {
                    <div class="fare-item">
                      <div class="fare-top">
                        <strong>{{ f.name }}</strong>
                        <span class="uber-badge" [ngClass]="f.active ? 'badge-success' : 'badge-dark'">
                          {{ f.active ? 'ACTIVA' : 'INACTIVA' }}
                        </span>
                      </div>
                      <div class="fare-nums mono">
                        <span>Base: \${{ f.base_fare | number }}</span>
                        <span>Km: \${{ f.price_per_km | number }}</span>
                        <span>Min: \${{ f.price_per_minute | number }}</span>
                        <span>Mín: \${{ f.minimum_fare | number }}</span>
                        <span>Surge: {{ f.surge_multiplier }}x</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- SECTION 4: TRIPS MONITOR (GET /api/admin/trips) -->
        @if (section() === 'trips') {
          <div class="uber-card">
            <h2>Monitoreo Exhaustivo de Viajes</h2>
            <p class="sub-p">
              Endpoint: <code>GET /api/admin/trips</code> con filtros por estado, conductor, cliente y fecha
            </p>

            <div class="filters-grid">
              <div class="uber-input-group">
                <label>Estado</label>
                <select [(ngModel)]="tripFilters.status">
                  <option value="">Todos los estados</option>
                  <option value="assigned">assigned</option>
                  <option value="driver_arrived">driver_arrived</option>
                  <option value="in_progress">in_progress</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>

              <div class="uber-input-group">
                <label>ID Conductor</label>
                <input
                  type="text"
                  class="uber-input mono"
                  [(ngModel)]="tripFilters.driver_id"
                  placeholder="Ej. 1"
                />
              </div>

              <div class="uber-input-group">
                <label>ID Cliente</label>
                <input
                  type="text"
                  class="uber-input mono"
                  [(ngModel)]="tripFilters.client_id"
                  placeholder="Ej. 2"
                />
              </div>

              <div class="uber-input-group">
                <label>Fecha (YYYY-MM-DD)</label>
                <input type="date" class="uber-input mono" [(ngModel)]="tripFilters.date" />
              </div>

              <div class="filter-btn-wrap">
                <button type="button" class="uber-btn btn-primary" (click)="loadAdminTrips()">
                  <ion-icon name="filter-outline"></ion-icon>
                  <span>Filtrar</span>
                </button>
              </div>
            </div>

            @if (adminTrips().length === 0) {
              <p class="muted-empty">No se encontraron viajes para los filtros seleccionados.</p>
            } @else {
              <div class="table-responsive">
                <table class="uber-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Estado</th>
                      <th>Cliente</th>
                      <th>Conductor</th>
                      <th>Tarifa</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (tr of adminTrips(); track $index) {
                      <tr>
                        <td class="mono">#{{ tr.id }}</td>
                        <td>
                          <span class="uber-badge badge-info">{{ tr.status }}</span>
                        </td>
                        <td>{{ tr.client?.name || tr.client?.user?.name || 'Cliente #' + (tr.client_id || '-') }}</td>
                        <td>{{ tr.driver?.user?.name || 'Conductor #' + (tr.driver_id || '-') }}</td>
                        <td class="mono">\${{ (tr.final_fare || tr.estimated_fare || 0) | number }}</td>
                        <td>{{ (tr.completed_at || tr.created_at) | date:'short' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- SECTION 5: CONSOLIDATED REPORTS (GET /api/admin/reports) -->
        @if (section() === 'reports') {
          <div class="uber-card">
            <div class="sub-head">
              <div>
                <h2>Reporte Consolidado de Cancelaciones, Ingresos y Desempeño</h2>
                <p class="sub-p">Endpoint: <code>GET /api/admin/reports</code></p>
              </div>
              <button type="button" class="uber-btn btn-outline w-auto" (click)="loadReports()">
                <ion-icon name="refresh-outline"></ion-icon> Actualizar Reporte
              </button>
            </div>

            @if (reportsData()) {
              <div class="report-cards-grid">
                @for (entry of objectEntries(reportsData()); track entry.key) {
                  <div class="report-box">
                    <span class="rep-key">{{ entry.key }}</span>
                    @if (isPrimitive(entry.value)) {
                      <strong class="rep-val">{{ entry.value }}</strong>
                    } @else {
                      <pre class="mono json-preview">{{ entry.value | json }}</pre>
                    }
                  </div>
                }
              </div>
            } @else {
              <p class="muted-empty">Cargando reporte consolidado...</p>
            }
          </div>
        }

        <!-- SECTION 6: AUDIT LOGS (GET /api/admin/audit-logs) -->
        @if (section() === 'audit') {
          <div class="uber-card">
            <div class="sub-head">
              <div>
                <h2>Registro Cronológico de Auditoría y Seguridad (RF-ADM-15)</h2>
                <p class="sub-p">Endpoint: <code>GET /api/admin/audit-logs</code></p>
              </div>
              <button type="button" class="uber-btn btn-outline w-auto" (click)="loadAuditLogs()">
                <ion-icon name="refresh-outline"></ion-icon> Actualizar Logs
              </button>
            </div>

            @if (auditLogs().length === 0) {
              <p class="muted-empty">No se encontraron registros de auditoría aún.</p>
            } @else {
              <div class="audit-timeline">
                @for (log of auditLogs(); track $index) {
                  <div class="audit-item">
                    <div class="audit-dot"></div>
                    <div class="audit-body">
                      <div class="audit-top">
                        <strong>{{ log.action || log.event || 'Acción Administrativa' }}</strong>
                        <span class="mono">{{ (log.created_at || log.timestamp) | date:'medium' }}</span>
                      </div>
                      <p>{{ log.description || log.details || (log | json) }}</p>
                      @if (log.user || log.ip_address) {
                        <small class="mono">
                          Usuario: {{ log.user?.name || log.user_id || 'Sistema' }}
                          @if (log.ip_address) {
                            · IP: {{ log.ip_address }}
                          }
                        </small>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- DRIVER APPROVAL MODAL (PATCH /api/admin/drivers/{id}/approval) -->
        @if (approvalTarget(); as target) {
          <div class="modal-backdrop" (click)="approvalTarget.set(null)">
            <div class="approval-modal uber-card" (click)="$event.stopPropagation()">
              <h3>Actualizar Estado de Conductor #{{ target.driver.id }}</h3>
              <p>
                Socio: <strong>{{ target.driver.user?.name }}</strong> · Nuevo estado:
                <span class="uber-badge badge-info">{{ target.status }}</span>
              </p>

              <div class="uber-input-group">
                <label>Notas Administrativas (<code>admin_notes</code>)</label>
                <textarea
                  rows="3"
                  [(ngModel)]="adminNotesInput"
                  placeholder="Documentación de SOAT y licencia verificada."
                ></textarea>
              </div>

              <div class="modal-btns">
                <button type="button" class="uber-btn btn-outline" (click)="approvalTarget.set(null)">
                  Cancelar
                </button>
                <button
                  type="button"
                  class="uber-btn btn-primary"
                  [disabled]="savingApproval()"
                  (click)="confirmDriverApproval()"
                >
                  {{ savingApproval() ? 'Actualizando...' : 'Confirmar Decisión' }}
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .admin-hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;

      .eyebrow {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.12em;
        color: #10b981;
      }

      h1 {
        margin: 6px 0 4px;
        font-size: 24px;
        font-weight: 800;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #a1a1aa;
      }

      .sync-all-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #10b981;
        color: #09090b;
        border: none;
        padding: 12px 18px;
        border-radius: 14px;
        font-weight: 800;
        font-size: 13px;
        cursor: pointer;
      }
    }

    .admin-nav {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 6px;
      margin-bottom: 20px;
    }

    .nav-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 999px;
      background: #ffffff;
      border: 1.5px solid #e4e4e7;
      font-size: 13px;
      font-weight: 700;
      color: #52525b;
      white-space: nowrap;
      cursor: pointer;

      &.active {
        background: #09090b;
        color: #ffffff;
        border-color: #09090b;
      }

      .count-badge {
        background: #f59e0b;
        color: #09090b;
        font-size: 11px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 999px;
      }
    }

    .admin-toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 14px;
      margin-bottom: 18px;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      font-size: 13px;
      font-weight: 600;

      &[data-type="error"] {
        background: #fef2f2;
        color: #b91c1c;
        border-color: #fecaca;
      }

      button {
        margin-left: auto;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 700;
      }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 22px;
    }

    .kpi-card {
      small {
        display: block;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        color: #71717a;
      }

      .kpi-val {
        font-size: 32px;
        font-weight: 800;
        margin: 8px 0 4px;
        letter-spacing: -0.03em;
      }

      .warn-text {
        color: #d97706;
      }

      .kpi-foot {
        font-size: 12px;
        color: #71717a;
      }

      &.highlight-emerald {
        background: #09090b;
        color: #ffffff;

        small,
        .kpi-foot {
          color: #a1a1aa;
        }
        .kpi-val {
          color: #10b981;
        }
      }
    }

    .split-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .sub-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;

      h2,
      h3 {
        margin: 0;
        font-weight: 800;
      }
    }

    .sub-p {
      font-size: 12px;
      color: #71717a;
      margin: 4px 0 18px;
    }

    .compact-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .compact-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-radius: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;

      strong {
        display: block;
        font-size: 13px;
      }
      small {
        font-size: 12px;
        color: #71717a;
      }

      .right-col-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }

    .filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;

      h2 {
        margin: 0 0 4px;
        font-size: 20px;
        font-weight: 800;
      }
      p {
        margin: 0;
        font-size: 12px;
        color: #71717a;
      }

      .filter-pills {
        display: flex;
        gap: 6px;

        button {
          padding: 7px 14px;
          border-radius: 999px;
          border: 1px solid #e4e4e7;
          background: #f4f4f5;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;

          &.active {
            background: #09090b;
            color: #ffffff;
          }
        }
      }
    }

    .drivers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .driver-admin-card {
      border: 1.5px solid #e4e4e7;
      border-radius: 18px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .drv-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;

        strong {
          display: block;
          font-size: 15px;
        }
        small {
          color: #71717a;
          font-size: 12px;
        }
      }

      .drv-meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        background: #f8fafc;
        padding: 10px 12px;
        border-radius: 12px;

        small {
          display: block;
          font-size: 10px;
          color: #71717a;
        }
        strong {
          font-size: 13px;
        }
      }

      .v-chip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #f4f4f5;
        padding: 8px 12px;
        border-radius: 10px;
        font-size: 12px;

        .plate {
          background: #fbbf24;
          color: #09090b;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
        }
      }

      .drv-actions {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;

        button {
          padding: 9px 10px;
          font-size: 12px;
        }
      }
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }

    .active-check {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
      cursor: pointer;
    }

    .fare-item {
      padding: 14px;
      border-radius: 14px;
      border: 1px solid #e4e4e7;

      .fare-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .fare-nums {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        font-size: 12px;
        color: #52525b;
      }
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr) auto;
      gap: 12px;
      align-items: end;
      margin-bottom: 18px;

      .filter-btn-wrap {
        margin-bottom: 16px;
      }
    }

    .table-responsive {
      overflow-x: auto;
    }

    .uber-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;

      th,
      td {
        text-align: left;
        padding: 12px 14px;
        border-bottom: 1px solid #f4f4f5;
      }

      th {
        font-size: 11px;
        text-transform: uppercase;
        color: #71717a;
        font-weight: 800;
      }
    }

    .report-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 14px;
    }

    .report-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px;

      .rep-key {
        display: block;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        color: #71717a;
        margin-bottom: 6px;
      }

      .rep-val {
        font-size: 22px;
        font-weight: 800;
      }

      .json-preview {
        font-size: 11px;
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
      }
    }

    .audit-timeline {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .audit-item {
      display: flex;
      gap: 12px;
      padding: 14px;
      background: #f8fafc;
      border-radius: 14px;
      border-left: 4px solid #09090b;

      .audit-body {
        flex: 1;
      }

      .audit-top {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 13px;
      }

      p {
        margin: 0 0 4px;
        font-size: 13px;
        color: #3f3f46;
      }

      small {
        color: #71717a;
        font-size: 11px;
      }
    }

    .muted-empty {
      color: #71717a;
      font-size: 13px;
      text-align: center;
      padding: 28px 0;
    }

    .w-auto {
      width: auto !important;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(9, 9, 11, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 2500;
    }

    .approval-modal {
      width: 100%;
      max-width: 440px;

      h3 {
        margin: 0 0 6px;
      }

      .modal-btns {
        display: grid;
        grid-template-columns: 1fr 1.3fr;
        gap: 10px;
      }
    }

    @media (max-width: 900px) {
      .split-2,
      .filters-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardPage implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly section = signal<AdminSection>('kpis');
  readonly bannerMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  readonly stats = signal<AdminDashboardStats>({
    total_clients: 0,
    total_drivers: 0,
    pending_drivers: 0,
    approved_drivers: 0,
    active_trips: 0,
    completed_trips: 0,
    cancelled_trips: 0,
    pending_requests: 0,
    total_revenue: 0
  });
  readonly recentTrips = signal<any[]>([]);
  readonly recentIncidents = signal<any[]>([]);

  readonly driverFilter = signal<string>('all');
  readonly driversList = signal<DriverInfo[]>([]);
  readonly approvalTarget = signal<{
    driver: DriverInfo;
    status: 'approved' | 'rejected' | 'suspended';
  } | null>(null);
  adminNotesInput = 'Documentación de SOAT y licencia verificada.';
  readonly savingApproval = signal(false);

  readonly faresList = signal<Fare[]>([]);
  readonly savingFare = signal(false);
  newFare: Fare = {
    name: 'Tarifa Hora Pico',
    base_fare: 4500,
    price_per_km: 1500,
    price_per_minute: 350,
    minimum_fare: 8000,
    surge_multiplier: 1.3,
    active: true
  };

  tripFilters = {
    status: '',
    driver_id: '',
    client_id: '',
    date: ''
  };
  readonly adminTrips = signal<any[]>([]);
  readonly reportsData = signal<any | null>(null);
  readonly auditLogs = signal<any[]>([]);

  ngOnInit(): void {
    this.loadDashboard();
  }

  selectSection(sec: AdminSection): void {
    this.section.set(sec);
    this.refreshCurrentSection();
  }

  refreshCurrentSection(): void {
    const sec = this.section();
    if (sec === 'kpis') this.loadDashboard();
    if (sec === 'drivers') this.loadDrivers();
    if (sec === 'fares') this.loadFares();
    if (sec === 'trips') this.loadAdminTrips();
    if (sec === 'reports') this.loadReports();
    if (sec === 'audit') this.loadAuditLogs();
  }

  loadDashboard(): void {
    this.adminService.getDashboard().subscribe({
      next: (res) => {
        if (res?.stats) this.stats.set(res.stats);
        if (Array.isArray(res?.recent_trips)) this.recentTrips.set(res.recent_trips);
        if (Array.isArray(res?.recent_incidents)) this.recentIncidents.set(res.recent_incidents);
      },
      error: (err) => {
        this.bannerMessage.set({
          type: 'error',
          text: err?.error?.message || 'Error al consultar /api/admin/dashboard'
        });
      }
    });
  }

  filterDrivers(status: string): void {
    this.driverFilter.set(status);
    this.loadDrivers();
  }

  loadDrivers(): void {
    this.adminService.getDrivers(this.driverFilter()).subscribe({
      next: (res) => {
        if (Array.isArray(res?.drivers)) {
          this.driversList.set(res.drivers);
        }
      },
      error: (err) => {
        this.bannerMessage.set({
          type: 'error',
          text: err?.error?.message || 'No se pudo cargar la lista de conductores.'
        });
      }
    });
  }

  openApprovalModal(driver: DriverInfo, status: 'approved' | 'rejected' | 'suspended'): void {
    this.approvalTarget.set({ driver, status });
    this.adminNotesInput =
      status === 'approved'
        ? 'Documentación de SOAT y licencia verificada.'
        : 'Observación administrativa registrada en revisión.';
  }

  confirmDriverApproval(): void {
    const target = this.approvalTarget();
    if (!target) return;

    this.savingApproval.set(true);
    this.adminService
      .updateDriverApproval(target.driver.id, {
        approval_status: target.status,
        admin_notes: this.adminNotesInput.trim()
      })
      .subscribe({
        next: (res) => {
          this.savingApproval.set(false);
          this.approvalTarget.set(null);
          this.bannerMessage.set({
            type: 'success',
            text: res.message || `Estado del conductor actualizado a: ${target.status}`
          });
          this.loadDrivers();
          this.loadDashboard();
        },
        error: (err) => {
          this.savingApproval.set(false);
          this.bannerMessage.set({
            type: 'error',
            text: err?.error?.message || 'No fue posible actualizar el estado del conductor.'
          });
        }
      });
  }

  loadFares(): void {
    this.adminService.getFares().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res?.fares)
          ? res.fares
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        this.faresList.set(list);
      },
      error: () => {}
    });
  }

  onCreateFare(): void {
    this.savingFare.set(true);
    this.adminService
      .createFare({
        name: this.newFare.name.trim(),
        base_fare: Number(this.newFare.base_fare),
        price_per_km: Number(this.newFare.price_per_km),
        price_per_minute: Number(this.newFare.price_per_minute),
        minimum_fare: Number(this.newFare.minimum_fare),
        surge_multiplier: Number(this.newFare.surge_multiplier),
        active: Boolean(this.newFare.active)
      })
      .subscribe({
        next: (res) => {
          this.savingFare.set(false);
          this.bannerMessage.set({
            type: 'success',
            text: res.message || 'Tarifa configurada exitosamente'
          });
          this.loadFares();
        },
        error: (err) => {
          this.savingFare.set(false);
          this.bannerMessage.set({
            type: 'error',
            text: err?.error?.message || 'Error al crear la configuración de tarifa.'
          });
        }
      });
  }

  loadAdminTrips(): void {
    this.adminService.getTrips(this.tripFilters).subscribe({
      next: (res) => {
        const list = Array.isArray(res?.trips?.data)
          ? res.trips.data
          : Array.isArray(res?.trips)
          ? res.trips
          : Array.isArray(res?.data)
          ? res.data
          : [];
        this.adminTrips.set(list);
      },
      error: () => {}
    });
  }

  loadReports(): void {
    this.adminService.getReports().subscribe({
      next: (res) => {
        this.reportsData.set(res?.report || res?.reports || res);
      },
      error: () => {}
    });
  }

  loadAuditLogs(): void {
    this.adminService.getAuditLogs().subscribe({
      next: (res) => {
        const list = Array.isArray(res?.logs?.data)
          ? res.logs.data
          : Array.isArray(res?.audit_logs?.data)
          ? res.audit_logs.data
          : Array.isArray(res?.logs)
          ? res.logs
          : Array.isArray(res?.audit_logs)
          ? res.audit_logs
          : Array.isArray(res?.data)
          ? res.data
          : [];
        this.auditLogs.set(list);
      },
      error: () => {}
    });
  }

  objectEntries(obj: any): { key: string; value: any }[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj).map(([key, value]) => ({ key, value }));
  }

  isPrimitive(val: any): boolean {
    return val === null || ['string', 'number', 'boolean'].includes(typeof val);
  }
}

