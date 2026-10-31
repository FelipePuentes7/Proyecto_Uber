import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import * as L from 'leaflet';
import { TopNavbarComponent } from '../../shared/components/top-navbar.component';
import { DriverService } from '../../core/services/driver.service';
import { RideRequest, TripRecord } from '../../core/models/api.models';

@Component({
  selector: 'app-driver-home',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, TopNavbarComponent],
  template: `
    <ion-content [fullscreen]="true">
      <app-top-navbar></app-top-navbar>

      <div class="uber-shell">
        <!-- Top Driver Availability & Earnings Bar (PUT /api/driver/availability) -->
        <div class="driver-status-bar uber-card-dark">
          <div class="status-left">
            <div class="online-indicator" [class.online]="availability() === 'available'">
              <span class="dot"></span>
              <span>{{ availability() === 'available' ? 'EN LÍNEA · DISPONIBLE' : 'DESCONECTADO' }}</span>
            </div>
            <h1>Consola de Socio Conductor</h1>
            <p>
              Aceptación con bloqueo atómico transaccional (RNF-05) y telemetría GPS en tiempo real
            </p>
          </div>

          <div class="status-right">
            <div class="session-earnings">
              <small>Ingresos en Sesión ({{ completedSessionTrips().length }} viajes)</small>
              <strong>\${{ sessionEarnings() | number }} COP</strong>
            </div>

            <button
              type="button"
              class="power-btn"
              [class.is-online]="availability() === 'available'"
              [disabled]="loadingAvailability()"
              (click)="toggleAvailability()"
            >
              <ion-icon name="radio-button-on-outline"></ion-icon>
              <span>
                {{
                  loadingAvailability()
                    ? 'Cambiando...'
                    : availability() === 'available'
                    ? 'Pasar a Desconectado'
                    : 'Conectarse Ahora'
                }}
              </span>
            </button>
          </div>
        </div>

        <!-- Pending Approval Warning (403 Forbidden middleware driver.approved) -->
        @if (approvalStatus() === 'pending') {
          <div class="approval-alert">
            <ion-icon name="warning-outline"></ion-icon>
            <div>
              <strong>Cuenta de Conductor Pendiente de Aprobación (<code>403 Forbidden</code>)</strong>
              <p>
                Solo conductores aprobados por un Administrador (<code>PATCH /api/admin/drivers/&#123;id&#125;/approval</code>) pueden activar su disponibilidad y tomar viajes.
              </p>
            </div>
          </div>
        }

        <!-- Feedback / Concurrency Alert -->
        @if (feedback()) {
          <div class="feedback-bar" [attr.data-type]="feedback()!.type">
            <ion-icon
              [name]="
                feedback()!.type === 'error'
                  ? 'alert-circle-outline'
                  : feedback()!.type === 'conflict'
                  ? 'warning-outline'
                  : 'checkmark-circle-outline'
              "
            ></ion-icon>
            <span>{{ feedback()!.text }}</span>
            <button type="button" class="close-btn" (click)="feedback.set(null)">✕</button>
          </div>
        }

        <div class="driver-grid">
          <!-- Left Column: Active Trip Execution OR Pending Ride Requests -->
          <div class="left-col">
            <!-- ACTIVE TRIP EXECUTION CONSOLE (arrive -> start -> complete) -->
            @if (activeTrip(); as trip) {
              <div class="active-execution uber-card">
                <div class="exec-head">
                  <div>
                    <span class="uber-badge badge-info">VIAJE ACTIVO #{{ trip.id }}</span>
                    <h2>Ejecución del Servicio</h2>
                  </div>
                  <span class="status-pill">{{ trip.status | uppercase }}</span>
                </div>

                <!-- Step Progress Bar -->
                <div class="driver-steps">
                  <div class="d-step" [class.active]="trip.status === 'assigned'" [class.done]="tripStep(trip.status) > 1">
                    <span>1</span>
                    <small>Asignado</small>
                  </div>
                  <div class="d-step" [class.active]="trip.status === 'driver_arrived'" [class.done]="tripStep(trip.status) > 2">
                    <span>2</span>
                    <small>En Recogida</small>
                  </div>
                  <div class="d-step" [class.active]="trip.status === 'in_progress'" [class.done]="tripStep(trip.status) > 3">
                    <span>3</span>
                    <small>En Recorrido</small>
                  </div>
                  <div class="d-step" [class.done]="trip.status === 'completed'">
                    <span>4</span>
                    <small>Liquidado</small>
                  </div>
                </div>

                <div class="trip-summary-box">
                  @if (trip.origin_name) {
                    <div class="route-line-item">
                      <span class="badge-a">A</span>
                      <div>
                        <small>Punto de Recogida</small>
                        <strong>{{ trip.origin_name }}</strong>
                      </div>
                    </div>
                  }
                  @if (trip.destination_name) {
                    <div class="route-line-item">
                      <span class="badge-b">B</span>
                      <div>
                        <small>Destino</small>
                        <strong>{{ trip.destination_name }}</strong>
                      </div>
                    </div>
                  }
                  <div class="fare-row">
                    <span>Tarifa Estimada / Liquidada:</span>
                    <strong>\${{ (trip.final_fare || trip.estimated_fare || 6500) | number }} COP</strong>
                  </div>
                </div>

                <!-- STEP 1: ARRIVE (POST /api/driver/trips/{id}/arrive) -->
                @if (trip.status === 'assigned') {
                  <div class="step-action-box">
                    <p class="step-hint">
                      Dirígete al punto de recogida del pasajero y notifica tu llegada:
                    </p>
                    <button
                      type="button"
                      class="uber-btn btn-blue"
                      [disabled]="loadingAction()"
                      (click)="onArrive(trip.id)"
                    >
                      <ion-icon name="flag-outline"></ion-icon>
                      <span>{{ loadingAction() ? 'Registrando llegada...' : '1. Registrar Llegada al Punto (Arrive)' }}</span>
                    </button>
                  </div>
                }

                <!-- STEP 2: START (POST /api/driver/trips/{id}/start) -->
                @if (trip.status === 'driver_arrived') {
                  <div class="step-action-box">
                    <p class="step-hint">
                      El cliente fue notificado de tu llegada ({{ trip.driver_arrived_at | date:'shortTime' }}). Cuando aborde el vehículo, inicia el recorrido:
                    </p>
                    <button
                      type="button"
                      class="uber-btn btn-emerald"
                      [disabled]="loadingAction()"
                      (click)="onStartTrip(trip.id)"
                    >
                      <ion-icon name="play-outline"></ion-icon>
                      <span>{{ loadingAction() ? 'Iniciando viaje...' : '2. Iniciar Recorrido Oficialmente (Start)' }}</span>
                    </button>
                  </div>
                }

                <!-- STEP 3: COMPLETE (POST /api/driver/trips/{id}/complete) -->
                @if (trip.status === 'in_progress') {
                  <div class="complete-form-box">
                    <h4>Finalizar y Liquidar Viaje (<code>POST /api/driver/trips/{{ trip.id }}/complete</code>)</h4>
                    <div class="grid-2">
                      <div class="uber-input-group">
                        <label>Distancia Real Recorrida (km)</label>
                        <input
                          type="number"
                          step="0.01"
                          class="uber-input mono"
                          [(ngModel)]="actualDistanceKm"
                        />
                      </div>
                      <div class="uber-input-group">
                        <label>Duración Real (minutos)</label>
                        <input
                          type="number"
                          step="1"
                          class="uber-input mono"
                          [(ngModel)]="actualDurationMin"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      class="uber-btn btn-primary"
                      [disabled]="loadingAction()"
                      (click)="onCompleteTrip(trip.id)"
                    >
                      <ion-icon name="checkmark-done-outline"></ion-icon>
                      <span>{{ loadingAction() ? 'Liquidando tarifa...' : '3. Finalizar Viaje y Calcular Tarifa Definitiva' }}</span>
                    </button>
                  </div>
                }

                @if (trip.status === 'completed') {
                  <div class="completed-receipt">
                    <div class="receipt-head">
                      <ion-icon name="checkmark-circle-outline"></ion-icon>
                      <strong>¡Viaje #{{ trip.id }} Liquidado con Éxito!</strong>
                    </div>
                    <div class="receipt-details">
                      <div>
                        <small>Tarifa Final</small>
                        <strong>\${{ trip.final_fare | number }} COP</strong>
                      </div>
                      <div>
                        <small>Distancia</small>
                        <strong>{{ trip.distance_travelled_km }} km</strong>
                      </div>
                      <div>
                        <small>Duración</small>
                        <strong>{{ trip.duration_travelled_min }} min</strong>
                      </div>
                    </div>
                    <button type="button" class="uber-btn btn-outline" (click)="clearCompletedTrip()">
                      Volver al Radar de Solicitudes
                    </button>
                  </div>
                }
              </div>
            }

            <!-- PENDING RIDE REQUESTS RADAR (GET /api/driver/ride-requests) -->
            <div class="requests-card uber-card">
              <div class="card-head-row">
                <div>
                  <h2>Solicitudes Pendientes en Espera</h2>
                  <p>Endpoint: <code>GET /api/driver/ride-requests</code></p>
                </div>
                <button
                  type="button"
                  class="refresh-pill"
                  [disabled]="loadingRequests()"
                  (click)="loadPendingRequests()"
                >
                  <ion-icon name="refresh-outline"></ion-icon>
                  <span>{{ loadingRequests() ? 'Buscando...' : 'Actualizar' }}</span>
                </button>
              </div>

              @if (pendingRequests().length === 0) {
                <div class="empty-radar">
                  <div class="radar-circle">
                    <ion-icon name="compass-outline"></ion-icon>
                  </div>
                  <h3>Sin solicitudes pendientes en este instante</h3>
                  <p>
                    Mantén tu estado en <strong>Available</strong>. Cuando un cliente solicite un viaje aparecerá aquí automáticamente.
                  </p>
                </div>
              } @else {
                <div class="request-list">
                  @for (req of pendingRequests(); track req.id) {
                    <div class="req-item">
                      <div class="req-top">
                        <span class="mono req-id">Solicitud #{{ req.id }}</span>
                        <span class="req-fare">\${{ req.estimated_fare | number }} COP</span>
                      </div>

                      <div class="req-route">
                        <div class="point">
                          <span class="dot a">A</span>
                          <div>
                            <small>Origen</small>
                            <strong>{{ req.origin_name }}</strong>
                          </div>
                        </div>
                        <div class="point">
                          <span class="dot b">B</span>
                          <div>
                            <small>Destino</small>
                            <strong>{{ req.destination_name }}</strong>
                          </div>
                        </div>
                      </div>

                      <div class="req-meta">
                        <span class="uber-badge badge-dark">
                          {{ req.estimated_distance_km }} km
                        </span>
                        @if (req.client) {
                          <span class="client-tag">
                            <ion-icon name="person-outline"></ion-icon>
                            {{ req.client.name }}
                            @if (req.client.phone) {
                              · {{ req.client.phone }}
                            }
                          </span>
                        }
                      </div>

                      <button
                        type="button"
                        class="uber-btn btn-emerald"
                        [disabled]="acceptingId() === req.id"
                        (click)="onAcceptRequest(req)"
                      >
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                        <span>
                          {{
                            acceptingId() === req.id
                              ? 'Bloqueando transacción (lockForUpdate)...'
                              : 'Aceptar Servicio Ahora'
                          }}
                        </span>
                      </button>
                    </div>
                  }
                </div>
              }

              <!-- Manual Trip ID Recovery Tool -->
              <div class="manual-trip-loader">
                <small>¿Ya tienes un ID de viaje asignado y recargaste la página? Retómalo aquí:</small>
                <div class="manual-row">
                  <input
                    type="number"
                    placeholder="ID Viaje (ej. 3)"
                    [(ngModel)]="manualTripId"
                    class="mono"
                  />
                  <select [(ngModel)]="manualTripStatus">
                    <option value="assigned">assigned (Por llegar)</option>
                    <option value="driver_arrived">driver_arrived (En punto)</option>
                    <option value="in_progress">in_progress (En curso)</option>
                  </select>
                  <button type="button" (click)="resumeManualTrip()">Cargar Viaje</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: GPS Telemetry & Map (POST /api/driver/location) -->
          <div class="right-col">
            <div class="gps-card uber-card">
              <div class="gps-head">
                <div>
                  <h3>Telemetría GPS del Conductor</h3>
                  <p><code>POST /api/driver/location</code> · Haz clic en el mapa para mover tu vehículo</p>
                </div>
                <button
                  type="button"
                  class="sim-btn"
                  [class.sim-active]="simulatingGps()"
                  (click)="toggleSimulation()"
                >
                  <ion-icon name="pulse-outline"></ion-icon>
                  <span>{{ simulatingGps() ? 'Detener Simulación' : 'Simular Ruta GPS' }}</span>
                </button>
              </div>

              <div id="driver-leaflet-map" class="driver-map"></div>

              <div class="telemetry-controls">
                <div class="grid-4">
                  <div class="uber-input-group">
                    <label>Latitud</label>
                    <input type="number" step="0.0001" class="uber-input mono" [(ngModel)]="gpsLat" />
                  </div>
                  <div class="uber-input-group">
                    <label>Longitud</label>
                    <input type="number" step="0.0001" class="uber-input mono" [(ngModel)]="gpsLng" />
                  </div>
                  <div class="uber-input-group">
                    <label>Rumbo (Heading °)</label>
                    <input type="number" step="1" class="uber-input mono" [(ngModel)]="gpsHeading" />
                  </div>
                  <div class="uber-input-group">
                    <label>Velocidad (km/h)</label>
                    <input type="number" step="0.5" class="uber-input mono" [(ngModel)]="gpsSpeed" />
                  </div>
                </div>

                <div class="gps-actions">
                  <button type="button" class="uber-btn btn-outline" (click)="useRealDeviceGps()">
                    <ion-icon name="locate-outline"></ion-icon>
                    <span>Tomar mi GPS Físico</span>
                  </button>

                  <button
                    type="button"
                    class="uber-btn btn-blue"
                    [disabled]="sendingLocation()"
                    (click)="sendLocationUpdate()"
                  >
                    <ion-icon name="navigate-outline"></ion-icon>
                    <span>{{ sendingLocation() ? 'Transmitiendo...' : 'Transmitir Ubicación GPS' }}</span>
                  </button>
                </div>

                @if (lastRecordedLocation()) {
                  <div class="last-ping mono">
                    Último reporte registrado en servidor: {{ lastRecordedLocation() }}
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .driver-status-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 20px;
      flex-wrap: wrap;

      .online-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: #a1a1aa;
        margin-bottom: 6px;

        .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #71717a;
        }

        &.online {
          color: #10b981;

          .dot {
            background: #10b981;
            box-shadow: 0 0 12px #10b981;
          }
        }
      }

      h1 {
        margin: 0 0 4px;
        font-size: 24px;
        font-weight: 800;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #a1a1aa;
      }

      .status-right {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .session-earnings {
        background: rgba(255, 255, 255, 0.07);
        padding: 10px 16px;
        border-radius: 14px;
        text-align: right;

        small {
          display: block;
          font-size: 11px;
          color: #a1a1aa;
        }

        strong {
          font-size: 18px;
          font-weight: 800;
          color: #10b981;
        }
      }

      .power-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 14px 22px;
        border-radius: 14px;
        border: none;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        background: #10b981;
        color: #09090b;
        transition: all 0.18s;

        &.is-online {
          background: #ef4444;
          color: #ffffff;
        }
      }
    }

    .approval-alert {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 16px 18px;
      border-radius: 16px;
      margin-bottom: 18px;

      ion-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      strong {
        display: block;
        margin-bottom: 4px;
      }

      p {
        margin: 0;
        font-size: 13px;
      }
    }

    .feedback-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 13px 16px;
      border-radius: 14px;
      margin-bottom: 18px;
      font-size: 13px;
      font-weight: 600;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;

      &[data-type="error"] {
        background: #fef2f2;
        color: #b91c1c;
        border-color: #fecaca;
      }

      &[data-type="conflict"] {
        background: #fff7ed;
        color: #c2410c;
        border-color: #fed7aa;
      }

      .close-btn {
        margin-left: auto;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 700;
        color: inherit;
      }
    }

    .driver-grid {
      display: grid;
      grid-template-columns: 1fr 1.05fr;
      gap: 22px;
      align-items: start;
    }

    .left-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .active-execution {
      border: 2px solid #09090b;

      .exec-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;

        h2 {
          margin: 6px 0 0;
          font-size: 20px;
          font-weight: 800;
        }

        .status-pill {
          background: #09090b;
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }
      }
    }

    .driver-steps {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;

      .d-step {
        background: #f4f4f5;
        border-radius: 12px;
        padding: 10px 6px;
        text-align: center;
        opacity: 0.55;

        span {
          display: inline-flex;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #d4d4d8;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        small {
          display: block;
          font-size: 11px;
          font-weight: 700;
        }

        &.active {
          opacity: 1;
          background: #eff6ff;
          border: 1.5px solid #2563eb;

          span {
            background: #2563eb;
            color: #ffffff;
          }
        }

        &.done {
          opacity: 1;
          background: #ecfdf5;

          span {
            background: #10b981;
            color: #ffffff;
          }
        }
      }
    }

    .trip-summary-box {
      background: #f8fafc;
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 16px;

      .route-line-item {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;

        .badge-a,
        .badge-b {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          color: #ffffff;
          flex-shrink: 0;
        }
        .badge-a { background: #09090b; }
        .badge-b { background: #10b981; }

        small {
          display: block;
          font-size: 11px;
          color: #71717a;
        }
        strong {
          font-size: 13px;
        }
      }

      .fare-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 10px;
        border-top: 1px solid #e2e8f0;
        font-size: 13px;

        strong {
          font-size: 16px;
          color: #047857;
        }
      }
    }

    .step-action-box {
      .step-hint {
        font-size: 13px;
        color: #52525b;
        margin: 0 0 12px;
      }
    }

    .complete-form-box {
      background: #fafafa;
      border: 1px solid #e4e4e7;
      padding: 16px;
      border-radius: 16px;

      h4 {
        margin: 0 0 12px;
        font-size: 14px;
      }

      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
    }

    .completed-receipt {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 16px;
      border-radius: 16px;

      .receipt-head {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #047857;
        font-size: 15px;
        margin-bottom: 12px;
      }

      .receipt-details {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 14px;

        small {
          display: block;
          font-size: 11px;
          color: #065f46;
        }
        strong {
          font-size: 15px;
          color: #09090b;
        }
      }
    }

    .card-head-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      h2 {
        margin: 0 0 4px;
        font-size: 19px;
        font-weight: 800;
      }

      p {
        margin: 0;
        font-size: 12px;
        color: #71717a;
      }

      .refresh-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #f4f4f5;
        border: none;
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
    }

    .empty-radar {
      text-align: center;
      padding: 36px 20px;
      background: #fafafa;
      border-radius: 16px;

      .radar-circle {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #e4e4e7;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        margin-bottom: 10px;
      }

      h3 {
        margin: 0 0 6px;
        font-size: 16px;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #71717a;
      }
    }

    .request-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .req-item {
      border: 1.5px solid #e4e4e7;
      border-radius: 18px;
      padding: 16px;
      transition: border-color 0.15s;

      &:hover {
        border-color: #09090b;
      }

      .req-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;

        .req-id {
          font-weight: 800;
          font-size: 13px;
        }

        .req-fare {
          font-size: 18px;
          font-weight: 800;
          color: #047857;
        }
      }

      .req-route {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;

        .point {
          display: flex;
          align-items: center;
          gap: 10px;

          .dot {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            color: #ffffff;

            &.a { background: #09090b; }
            &.b { background: #10b981; }
          }

          small {
            display: block;
            font-size: 10px;
            color: #71717a;
          }
          strong {
            font-size: 13px;
          }
        }
      }

      .req-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
        font-size: 12px;

        .client-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          color: #3f3f46;
        }
      }
    }

    .manual-trip-loader {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px dashed #e4e4e7;

      small {
        display: block;
        font-size: 11px;
        color: #71717a;
        margin-bottom: 8px;
      }

      .manual-row {
        display: grid;
        grid-template-columns: 110px 1fr auto;
        gap: 8px;

        input,
        select {
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid #d4d4d8;
          font-size: 12px;
        }

        button {
          background: #09090b;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 0 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
      }
    }

    .gps-card {
      .gps-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 12px;

        h3 {
          margin: 0 0 3px;
          font-size: 18px;
          font-weight: 800;
        }
        p {
          margin: 0;
          font-size: 12px;
          color: #71717a;
        }

        .sim-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f4f4f5;
          border: 1px solid #e4e4e7;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;

          &.sim-active {
            background: #2563eb;
            color: #ffffff;
            border-color: #2563eb;
          }
        }
      }

      .driver-map {
        width: 100%;
        height: 360px;
        border-radius: 16px;
        margin-bottom: 16px;
        z-index: 1;
      }

      .grid-4 {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .gps-actions {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 10px;
      }

      .last-ping {
        margin-top: 12px;
        padding: 8px 12px;
        border-radius: 10px;
        background: #eff6ff;
        color: #1d4ed8;
        font-size: 11px;
        text-align: center;
      }
    }

    @media (max-width: 960px) {
      .driver-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DriverHomePage implements OnInit, AfterViewInit, OnDestroy {
  private readonly driverService = inject(DriverService);

  readonly availability = signal<'available' | 'unavailable'>('unavailable');
  readonly approvalStatus = signal<'approved' | 'pending' | 'rejected' | null>(null);
  readonly loadingAvailability = signal(false);

  readonly pendingRequests = signal<RideRequest[]>([]);
  readonly loadingRequests = signal(false);
  readonly acceptingId = signal<number | null>(null);

  readonly activeTrip = signal<TripRecord | null>(null);
  readonly loadingAction = signal(false);

  readonly completedSessionTrips = signal<TripRecord[]>([]);
  readonly sessionEarnings = signal<number>(0);

  readonly feedback = signal<{ type: 'success' | 'error' | 'conflict'; text: string } | null>(null);

  readonly sendingLocation = signal(false);
  readonly simulatingGps = signal(false);
  readonly lastRecordedLocation = signal<string | null>(null);

  actualDistanceKm = 1.45;
  actualDurationMin = 6;

  manualTripId: number | null = null;
  manualTripStatus = 'assigned';

  gpsLat = 4.6715;
  gpsLng = -74.0509;
  gpsHeading = 120.5;
  gpsSpeed = 34.2;

  private map?: L.Map;
  private driverMarker?: L.Marker;
  private requestsPollTimer?: any;
  private gpsSimTimer?: any;

  ngOnInit(): void {
    this.loadPendingRequests();

    this.requestsPollTimer = setInterval(() => {
      if (this.availability() === 'available' && !this.activeTrip()) {
        this.loadPendingRequests();
      }
    }, 6000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
      this.useRealDeviceGps(false);
    }, 200);
  }

  ngOnDestroy(): void {
    if (this.requestsPollTimer) clearInterval(this.requestsPollTimer);
    if (this.gpsSimTimer) clearInterval(this.gpsSimTimer);
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    const el = document.getElementById('driver-leaflet-map');
    if (!el || this.map) return;

    this.map = L.map('driver-leaflet-map', {
      center: [this.gpsLat, this.gpsLng],
      zoom: 14
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    const iconDriver = L.divIcon({
      className: 'uber-map-pin pin-driver',
      html: '🚗',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    this.driverMarker = L.marker([this.gpsLat, this.gpsLng], { icon: iconDriver })
      .addTo(this.map)
      .bindPopup('Mi Vehículo (GPS Conductor)');

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.gpsLat = Number(e.latlng.lat.toFixed(5));
      this.gpsLng = Number(e.latlng.lng.toFixed(5));
      this.driverMarker?.setLatLng([this.gpsLat, this.gpsLng]);
      this.sendLocationUpdate();
    });
  }

  toggleAvailability(): void {
    const nextStatus = this.availability() === 'available' ? 'unavailable' : 'available';
    this.loadingAvailability.set(true);
    this.feedback.set(null);

    this.driverService.updateAvailability(nextStatus).subscribe({
      next: (res) => {
        this.loadingAvailability.set(false);
        this.availability.set(res.availability_status || nextStatus);
        this.approvalStatus.set('approved');
        this.feedback.set({
          type: 'success',
          text: res.message || `Disponibilidad cambiada a: ${nextStatus}`
        });
        if (nextStatus === 'available') {
          this.loadPendingRequests();
        }
      },
      error: (err) => {
        this.loadingAvailability.set(false);
        if (err?.status === 403) {
          this.approvalStatus.set(err?.error?.approval_status || 'pending');
        }
        this.feedback.set({
          type: 'error',
          text: err?.error?.message || 'Solo conductores aprobados pueden activar su disponibilidad.'
        });
      }
    });
  }

  loadPendingRequests(): void {
    this.loadingRequests.set(true);
    this.driverService.getPendingRequests().subscribe({
      next: (res) => {
        this.loadingRequests.set(false);
        if (Array.isArray(res?.requests)) {
          this.pendingRequests.set(res.requests);
        }
      },
      error: (err) => {
        this.loadingRequests.set(false);
        if (err?.status === 403 && err?.error?.approval_status === 'pending') {
          this.approvalStatus.set('pending');
        }
      }
    });
  }

  onAcceptRequest(req: RideRequest): void {
    this.acceptingId.set(req.id);
    this.feedback.set(null);

    this.driverService.acceptRideRequest(req.id).subscribe({
      next: (res) => {
        this.acceptingId.set(null);
        const trip: TripRecord = {
          ...res.trip,
          origin_name: req.origin_name,
          destination_name: req.destination_name,
          estimated_fare: res.trip?.estimated_fare || req.estimated_fare
        };
        this.activeTrip.set(trip);
        this.actualDistanceKm = req.estimated_distance_km || 1.45;
        this.pendingRequests.update((list) => list.filter((r) => r.id !== req.id));
        this.feedback.set({
          type: 'success',
          text: res.message || `Servicio #${req.id} aceptado exitosamente (Viaje #${trip.id}).`
        });
        this.sendLocationUpdate();
      },
      error: (err) => {
        this.acceptingId.set(null);
        if (err?.status === 409) {
          // 409 Conflict: Protección RNF-05 contra condiciones de carrera
          this.feedback.set({
            type: 'conflict',
            text:
              err?.error?.message ||
              'Conflicto 409 (RNF-05): Lo sentimos, este servicio ya fue tomado por otro conductor o fue cancelado.'
          });
          this.loadPendingRequests();
        } else {
          this.feedback.set({
            type: 'error',
            text: err?.error?.message || 'No fue posible aceptar la solicitud.'
          });
        }
      }
    });
  }

  onArrive(tripId: number): void {
    this.loadingAction.set(true);
    this.driverService.arriveAtPickup(tripId).subscribe({
      next: (res) => {
        this.loadingAction.set(false);
        this.activeTrip.update((curr) =>
          curr
            ? {
                ...curr,
                status: res.trip?.status || 'driver_arrived',
                driver_arrived_at: res.trip?.driver_arrived_at
              }
            : null
        );
        this.feedback.set({
          type: 'success',
          text: res.message || 'Llegada registrada. El cliente ha sido notificado.'
        });
        this.sendLocationUpdate();
      },
      error: (err) => {
        this.loadingAction.set(false);
        this.feedback.set({
          type: 'error',
          text: err?.error?.message || 'Error al registrar la llegada al punto.'
        });
      }
    });
  }

  onStartTrip(tripId: number): void {
    this.loadingAction.set(true);
    this.driverService.startTrip(tripId).subscribe({
      next: (res) => {
        this.loadingAction.set(false);
        this.activeTrip.update((curr) =>
          curr
            ? {
                ...curr,
                status: res.trip?.status || 'in_progress',
                started_at: res.trip?.started_at
              }
            : null
        );
        this.feedback.set({
          type: 'success',
          text: res.message || 'Viaje iniciado exitosamente.'
        });
        this.sendLocationUpdate();
      },
      error: (err) => {
        this.loadingAction.set(false);
        this.feedback.set({
          type: 'error',
          text: err?.error?.message || 'Error al iniciar el viaje.'
        });
      }
    });
  }

  onCompleteTrip(tripId: number): void {
    this.loadingAction.set(true);
    this.driverService
      .completeTrip(tripId, {
        actual_distance_km: Number(this.actualDistanceKm),
        actual_duration_min: Number(this.actualDurationMin)
      })
      .subscribe({
        next: (res) => {
          this.loadingAction.set(false);
          const completed = res.trip;
          this.activeTrip.set(completed);
          this.availability.set('available');

          if (completed) {
            this.completedSessionTrips.update((list) => [completed, ...list]);
            this.sessionEarnings.update((sum) => sum + Number(completed.final_fare || 0));
          }

          this.feedback.set({
            type: 'success',
            text: res.message || 'Viaje finalizado con éxito. Tarifa definitiva calculada.'
          });
        },
        error: (err) => {
          this.loadingAction.set(false);
          this.feedback.set({
            type: 'error',
            text: err?.error?.message || 'No fue posible finalizar el viaje.'
          });
        }
      });
  }

  clearCompletedTrip(): void {
    this.activeTrip.set(null);
    this.loadPendingRequests();
  }

  resumeManualTrip(): void {
    if (!this.manualTripId) return;
    this.activeTrip.set({
      id: Number(this.manualTripId),
      status: this.manualTripStatus
    });
  }

  sendLocationUpdate(): void {
    this.sendingLocation.set(true);
    const currentTripId = this.activeTrip()?.id;

    this.driverService
      .updateLocation({
        latitude: Number(this.gpsLat),
        longitude: Number(this.gpsLng),
        heading: Number(this.gpsHeading),
        speed: Number(this.gpsSpeed),
        ...(currentTripId ? { trip_id: currentTripId } : {})
      })
      .subscribe({
        next: (res) => {
          this.sendingLocation.set(false);
          this.driverMarker?.setLatLng([this.gpsLat, this.gpsLng]);
          this.map?.panTo([this.gpsLat, this.gpsLng]);
          if (res?.location) {
            this.lastRecordedLocation.set(
              `Lat: ${res.location.latitude}, Lng: ${res.location.longitude} · ${new Date(
                res.location.recorded_at || Date.now()
              ).toLocaleTimeString()}`
            );
          }
        },
        error: (err) => {
          this.sendingLocation.set(false);
          this.feedback.set({
            type: 'error',
            text: err?.error?.message || 'No se pudo enviar la telemetría GPS.'
          });
        }
      });
  }

  useRealDeviceGps(transmitToServer = true): void {
    const applyDriverCoords = (lat: number, lng: number, heading?: number | null, speed?: number | null) => {
      this.gpsLat = Number(lat.toFixed(5));
      this.gpsLng = Number(lng.toFixed(5));
      if (heading) this.gpsHeading = Number(heading.toFixed(1));
      if (speed) this.gpsSpeed = Number((speed * 3.6).toFixed(1));

      this.driverMarker?.setLatLng([this.gpsLat, this.gpsLng]);
      this.map?.setView([this.gpsLat, this.gpsLng], 15);

      if (transmitToServer) {
        this.sendLocationUpdate();
      }
    };

    const fallbackIp = () => {
      fetch('https://ipwho.is/')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.latitude && data.longitude) {
            applyDriverCoords(Number(data.latitude), Number(data.longitude));
          }
        })
        .catch(() => {});
    };

    if (!navigator.geolocation) {
      fallbackIp();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyDriverCoords(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.heading,
          pos.coords.speed
        );
      },
      () => {
        fallbackIp();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  toggleSimulation(): void {
    if (this.simulatingGps()) {
      clearInterval(this.gpsSimTimer);
      this.simulatingGps.set(false);
      return;
    }

    this.simulatingGps.set(true);
    this.gpsSimTimer = setInterval(() => {
      this.gpsLat = Number((this.gpsLat + (Math.random() - 0.45) * 0.0012).toFixed(5));
      this.gpsLng = Number((this.gpsLng + (Math.random() - 0.45) * 0.0012).toFixed(5));
      this.gpsHeading = Number(((this.gpsHeading + 15) % 360).toFixed(1));
      this.sendLocationUpdate();
    }, 4000);
  }

  tripStep(status: string): number {
    if (status === 'assigned') return 1;
    if (status === 'driver_arrived') return 2;
    if (status === 'in_progress') return 3;
    if (status === 'completed') return 4;
    return 1;
  }
}

