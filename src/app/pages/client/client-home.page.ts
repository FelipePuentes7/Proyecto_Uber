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
import { ClientService } from '../../core/services/client.service';
import {
  ActiveRideData,
  Fare,
  FareEstimate,
  TripRecord
} from '../../core/models/api.models';

interface LocationPreset {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, TopNavbarComponent],
  template: `
    <ion-content [fullscreen]="true">
      <app-top-navbar></app-top-navbar>

      <div class="uber-shell">
        <!-- View Switcher Tabs -->
        <div class="client-tabs">
          <button
            type="button"
            class="tab-pill"
            [class.active]="activeTab() === 'ride'"
            (click)="switchTab('ride')"
          >
            <ion-icon name="navigate-outline"></ion-icon>
            <span>Solicitar y Seguir Viaje</span>
            @if (hasActiveRide()) {
              <span class="pulse-dot"></span>
            }
          </button>

          <button
            type="button"
            class="tab-pill"
            [class.active]="activeTab() === 'history'"
            (click)="switchTab('history')"
          >
            <ion-icon name="time-outline"></ion-icon>
            <span>Mis Viajes y Calificaciones</span>
          </button>
        </div>

        <!--Feedback Banners-->
        @if (statusBanner()) {
          <div class="feedback-banner" [attr.data-type]="statusBanner()!.type">
            <ion-icon
              [name]="statusBanner()!.type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'"
            ></ion-icon>
            <span>{{ statusBanner()!.text }}</span>
            <button type="button" class="close-banner" (click)="statusBanner.set(null)">✕</button>
          </div>
        }

        <!-- TAB 1: RIDE REQUEST & REAL-TIME TRACKING -->
        <div class="ride-grid" [class.hidden-tab]="activeTab() !== 'ride'">
          <!-- Left Column: Controls -->
          <div class="left-panel">
            <!-- Active Fare Bar (GET /api/fares/active) -->
            @if (activeFare(); as fare) {
              <div class="fare-strip uber-card">
                <div class="strip-head">
                  <span class="uber-badge badge-success">
                    <span class="pulse-dot"></span> {{ fare.name }}
                  </span>
                  @if (fare.surge_multiplier > 1) {
                    <span class="uber-badge badge-warning">
                      Dinámica {{ fare.surge_multiplier }}x
                    </span>
                  }
                </div>
                <div class="strip-prices">
                  <div>
                    <small>Base</small>
                    <strong>\${{ fare.base_fare | number }}</strong>
                  </div>
                  <div>
                    <small>Km</small>
                    <strong>\${{ fare.price_per_km | number }}</strong>
                  </div>
                  <div>
                    <small>Minuto</small>
                    <strong>\${{ fare.price_per_minute | number }}</strong>
                  </div>
                  <div>
                    <small>Mínima</small>
                    <strong>\${{ fare.minimum_fare | number }}</strong>
                  </div>
                </div>
              </div>
            }

            <!-- ACTIVE RIDE TRACKING CARD (GET /api/client/active) -->
            @if (hasActiveRide() && activeRideData(); as active) {
              <div class="active-trip-card uber-card-dark">
                <div class="active-top">
                  <div>
                    <span class="live-tag">
                      <span class="pulse-dot"></span> EN CURSO · {{ activeType() | uppercase }} #{{ active.id }}
                    </span>
                    <h3>{{ statusHeadline(active.status) }}</h3>
                  </div>
                  <button
                    type="button"
                    class="icon-refresh"
                    (click)="checkActiveRide(true)"
                    title="Actualizar estado (GET /api/client/active)"
                  >
                    <ion-icon name="refresh-outline"></ion-icon>
                  </button>
                </div>

                <!-- Progress Steps -->
                <div class="step-track">
                  <div class="step-node" [class.done]="isStepDone(active.status, 1)">
                    <span class="dot">1</span>
                    <small>Solicitado</small>
                  </div>
                  <div class="step-node" [class.done]="isStepDone(active.status, 2)">
                    <span class="dot">2</span>
                    <small>Asignado</small>
                  </div>
                  <div class="step-node" [class.done]="isStepDone(active.status, 3)">
                    <span class="dot">3</span>
                    <small>En punto</small>
                  </div>
                  <div class="step-node" [class.done]="isStepDone(active.status, 4)">
                    <span class="dot">4</span>
                    <small>En viaje</small>
                  </div>
                </div>

                <div class="fare-pill-row">
                  <span>Tarifa estimada</span>
                  <strong>\${{ (active.estimated_fare || active.final_fare || 6500) | number }} COP</strong>
                </div>

                <!-- Driver & Vehicle Details when Assigned -->
                @if (active.driver) {
                  <div class="driver-assigned-box">
                    <div class="driver-row">
                      <div class="driver-avatar">
                        <ion-icon name="person-outline"></ion-icon>
                      </div>
                      <div class="driver-info">
                        <strong>{{ active.driver.user?.name || 'Conductor Asignado' }}</strong>
                        <div class="driver-sub">
                          <span class="rating-pill">
                            <ion-icon name="star"></ion-icon>
                            {{ active.driver.rating_average || '5.0' }}
                          </span>
                          @if (active.driver.user?.phone) {
                            <span>· <ion-icon name="call-outline"></ion-icon> {{ active.driver.user?.phone }}</span>
                          }
                        </div>
                      </div>
                    </div>

                    @if (active.vehicle) {
                      <div class="vehicle-card">
                        <div>
                          <small>{{ active.vehicle.brand }} {{ active.vehicle.model }}</small>
                          <span class="color-tag">{{ active.vehicle.color }}</span>
                        </div>
                        <div class="plate-badge mono">{{ active.vehicle.plate }}</div>
                      </div>
                    }

                    @if (active.driver.latest_location) {
                      <div class="gps-live-coord mono">
                        <ion-icon name="locate-outline"></ion-icon>
                        GPS Conductor: {{ active.driver.latest_location.latitude | number:'1.4-5' }},
                        {{ active.driver.latest_location.longitude | number:'1.4-5' }}
                      </div>
                    }
                  </div>
                } @else {
                  <div class="searching-box">
                    <div class="radar-spinner"></div>
                    <p>Esperando a que un conductor cercano acepte tu solicitud...</p>
                  </div>
                }

                <!-- Cancel Section (POST /api/client/cancel/{id}) -->
                @if (active.status === 'requested' || active.status === 'assigned' || active.status === 'driver_arrived') {
                  <div class="cancel-area">
                    @if (!showCancelForm()) {
                      <button
                        type="button"
                        class="uber-btn btn-danger"
                        (click)="showCancelForm.set(true)"
                      >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        <span>Cancelar Solicitud / Viaje</span>
                      </button>
                    } @else {
                      <div class="cancel-confirm">
                        <label>Motivo de cancelación:</label>
                        <input
                          type="text"
                          class="cancel-input"
                          [(ngModel)]="cancelReason"
                          placeholder="Cambio de planes del usuario"
                        />
                        <div class="cancel-btns">
                          <button type="button" class="btn-back" (click)="showCancelForm.set(false)">
                            Volver
                          </button>
                          <button
                            type="button"
                            class="btn-confirm-cancel"
                            [disabled]="loadingCancel()"
                            (click)="onCancelActiveRide(active.id)"
                          >
                            {{ loadingCancel() ? 'Cancelando...' : 'Confirmar Cancelación' }}
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- NEW RIDE REQUEST & FARE ESTIMATION FORM -->
            <div class="uber-card request-card">
              <div class="card-title-row">
                <div>
                  <h2>¿A dónde vamos hoy?</h2>
                  <p>Tu ubicación real se detecta automáticamente por GPS</p>
                </div>
                <button
                  type="button"
                  class="gps-btn"
                  [disabled]="locatingGps()"
                  (click)="useDeviceGps(true)"
                  title="Actualizar mi ubicación GPS actual en tiempo real"
                >
                  <ion-icon name="locate-outline"></ion-icon>
                  <span>{{ locatingGps() ? 'Ubicando...' : 'Mi Ubicación Real' }}</span>
                </button>
              </div>

              <!-- Map Click Mode Selector -->
              <div class="map-mode-switch">
                <span>Al tocar el mapa fijar:</span>
                <button
                  type="button"
                  [class.active]="mapClickMode() === 'origin'"
                  (click)="mapClickMode.set('origin')"
                >
                  Punto A (Origen)
                </button>
                <button
                  type="button"
                  [class.active]="mapClickMode() === 'destination'"
                  (click)="mapClickMode.set('destination')"
                >
                  Punto B (Destino)
                </button>
              </div>

              <!-- Origin Input -->
              <div class="route-box">
                <div class="point-block">
                  <div class="point-header">
                    <span class="pin-badge origin">A</span>
                    <label>Punto de Recogida (Origen)</label>
                  </div>
                  <input
                    type="text"
                    class="uber-input"
                    [(ngModel)]="originName"
                    placeholder="Parque de la 93, Calle 93A # 12-50"
                  />
                  <div class="coord-pair">
                    <div>
                      <small>Latitud</small>
                      <input
                        type="number"
                        step="0.0001"
                        class="mono"
                        [(ngModel)]="originLat"
                        (change)="syncMapMarkers()"
                      />
                    </div>
                    <div>
                      <small>Longitud</small>
                      <input
                        type="number"
                        step="0.0001"
                        class="mono"
                        [(ngModel)]="originLng"
                        (change)="syncMapMarkers()"
                      />
                    </div>
                  </div>
                  <div class="preset-row">
                    @for (p of presets; track p.label) {
                      <button type="button" class="mini-preset" (click)="applyPreset('origin', p)">
                        {{ p.label }}
                      </button>
                    }
                  </div>
                </div>

                <div class="route-divider"></div>

                <!-- Destination Input -->
                <div class="point-block">
                  <div class="point-header">
                    <span class="pin-badge dest">B</span>
                    <label>Punto de Destino</label>
                  </div>
                  <input
                    type="text"
                    class="uber-input"
                    [(ngModel)]="destinationName"
                    placeholder="Centro Comercial Andino, Carrera 11 # 82-71"
                  />
                  <div class="coord-pair">
                    <div>
                      <small>Latitud</small>
                      <input
                        type="number"
                        step="0.0001"
                        class="mono"
                        [(ngModel)]="destinationLat"
                        (change)="syncMapMarkers()"
                      />
                    </div>
                    <div>
                      <small>Longitud</small>
                      <input
                        type="number"
                        step="0.0001"
                        class="mono"
                        [(ngModel)]="destinationLng"
                        (change)="syncMapMarkers()"
                      />
                    </div>
                  </div>
                  <div class="preset-row">
                    @for (p of presets; track p.label) {
                      <button type="button" class="mini-preset" (click)="applyPreset('destination', p)">
                        {{ p.label }}
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- Estimate Button (POST /api/client/estimate-fare) -->
              <div class="action-buttons">
                <button
                  type="button"
                  class="uber-btn btn-outline"
                  [disabled]="loadingEstimate()"
                  (click)="onEstimateFare()"
                >
                  <ion-icon name="cash-outline"></ion-icon>
                  <span>{{ loadingEstimate() ? 'Calculando Haversine...' : 'Estimar Tarifa' }}</span>
                </button>

                <button
                  type="button"
                  class="uber-btn btn-primary"
                  [disabled]="loadingRequest()"
                  (click)="onRequestRide()"
                >
                  <ion-icon name="car-sport-outline"></ion-icon>
                  <span>{{ loadingRequest() ? 'Solicitando...' : 'Confirmar Viaje' }}</span>
                </button>
              </div>

              <!-- Fare Estimate Result Breakdown -->
              @if (fareEstimate(); as est) {
                <div class="estimate-result">
                  <div class="est-main">
                    <div>
                      <span class="est-label">Tarifa Proyectada ({{ est.currency || 'COP' }})</span>
                      <div class="est-price">\${{ est.estimated_fare | number }}</div>
                    </div>
                    <div class="est-pills">
                      <span class="uber-badge badge-dark">
                        {{ est.distance_km }} km
                      </span>
                      <span class="uber-badge badge-info">
                        ~{{ est.duration_min }} min
                      </span>
                    </div>
                  </div>

                  @if (est.fare_breakdown) {
                    <div class="breakdown-grid">
                      <div>
                        <span>Tarifa base</span>
                        <strong>\${{ est.fare_breakdown.base_fare | number }}</strong>
                      </div>
                      <div>
                        <span>Valor por km</span>
                        <strong>\${{ est.fare_breakdown.price_per_km | number }}</strong>
                      </div>
                      <div>
                        <span>Valor por min</span>
                        <strong>\${{ est.fare_breakdown.price_per_minute | number }}</strong>
                      </div>
                      <div>
                        <span>Tarifa mínima</span>
                        <strong>\${{ est.fare_breakdown.minimum_fare | number }}</strong>
                      </div>
                      <div>
                        <span>Multiplicador</span>
                        <strong>{{ est.fare_breakdown.surge_multiplier }}x</strong>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Right Column: Interactive Map -->
          <div class="right-panel">
            <div class="map-card uber-card">
              <div class="map-Overlay-bar">
                <div class="legend-items">
                  <span><i class="dot-a"></i> Origen (A)</span>
                  <span><i class="dot-b"></i> Destino (B)</span>
                  <span><i class="dot-driver"></i> Conductor GPS</span>
                </div>
                <button type="button" class="recenter-btn" (click)="syncMapMarkers()">
                  <ion-icon name="compass-outline"></ion-icon> Centrar ruta
                </button>
              </div>
              <div id="client-leaflet-map" class="map-canvas"></div>
            </div>
          </div>
        </div>

        <!-- TAB 2: TRIP HISTORY & RATINGS (GET /api/client/trips & POST /api/client/trips/{id}/rating) -->
        @if (activeTab() === 'history') {
          <div class="history-section">
            <div class="history-head">
              <div>
                <h2>Historial de Viajes Realizados</h2>
                <p>Consulta tus recorridos y califica el servicio de 1 a 5 estrellas</p>
              </div>
              <button type="button" class="uber-btn btn-outline w-auto" (click)="loadTripHistory()">
                <ion-icon name="refresh-outline"></ion-icon>
                <span>Actualizar</span>
              </button>
            </div>

            @if (loadingHistory()) {
              <div class="empty-state uber-card">
                <p>Cargando historial de viajes desde <code>GET /api/client/trips</code>...</p>
              </div>
            } @else if (tripHistory().length === 0) {
              <div class="empty-state uber-card">
                <ion-icon name="car-outline"></ion-icon>
                <h3>Aún no tienes viajes registrados</h3>
                <p>Cuando completes tu primer recorrido aparecerá aquí para que puedas calificarlo.</p>
              </div>
            } @else {
              <div class="trips-list">
                @for (trip of tripHistory(); track trip.id) {
                  <div class="trip-item uber-card">
                    <div class="trip-top">
                      <div>
                        <span class="mono trip-id">Viaje #{{ trip.id }}</span>
                        <span
                          class="uber-badge"
                          [ngClass]="{
                            'badge-success': trip.status === 'completed',
                            'badge-danger': trip.status === 'cancelled',
                            'badge-info': trip.status !== 'completed' && trip.status !== 'cancelled'
                          }"
                        >
                          {{ trip.status }}
                        </span>
                      </div>
                      <div class="trip-fare">
                        \${{ (trip.final_fare || trip.estimated_fare || 0) | number }} COP
                      </div>
                    </div>

                    <div class="trip-details-grid">
                      <div>
                        <small>Conductor</small>
                        <strong>{{ trip.driver?.user?.name || 'Conductor Plataforma' }}</strong>
                      </div>
                      <div>
                        <small>Vehículo / Placa</small>
                        <strong class="mono">{{ trip.vehicle?.plate || 'N/A' }}</strong>
                      </div>
                      <div>
                        <small>Fecha finalización</small>
                        <strong>{{ (trip.completed_at || trip.created_at) ? ((trip.completed_at || trip.created_at) | date:'short') : 'Reciente' }}</strong>
                      </div>
                    </div>

                    @if (trip.status === 'completed') {
                      <div class="trip-footer">
                        <button
                          type="button"
                          class="uber-btn btn-primary w-auto"
                          (click)="openRatingModal(trip)"
                        >
                          <ion-icon name="star-outline"></ion-icon>
                          <span>Calificar Viaje #{{ trip.id }}</span>
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- RATING MODAL (POST /api/client/trips/{id}/rating) -->
        @if (ratingTripTarget(); as target) {
          <div class="modal-backdrop" (click)="ratingTripTarget.set(null)">
            <div class="rating-modal uber-card" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <h3>Calificar Viaje #{{ target.id }}</h3>
                <button type="button" class="close-btn" (click)="ratingTripTarget.set(null)">✕</button>
              </div>
              <p class="modal-subtitle">
                Conductor: <strong>{{ target.driver?.user?.name || 'Socio Conductor' }}</strong> ·
                Placa: <span class="mono">{{ target.vehicle?.plate || 'UBR' }}</span>
              </p>

              <!-- 1 to 5 Stars -->
              <div class="stars-picker">
                @for (s of [1, 2, 3, 4, 5]; track s) {
                  <button
                    type="button"
                    class="star-btn"
                    [class.active]="ratingScore() >= s"
                    (click)="ratingScore.set(s)"
                  >
                    <ion-icon [name]="ratingScore() >= s ? 'star' : 'star-outline'"></ion-icon>
                  </button>
                }
              </div>
              <div class="score-caption">{{ ratingScore() }} de 5 estrellas</div>

              <div class="uber-input-group">
                <label>Comentario sobre el servicio</label>
                <textarea
                  rows="3"
                  [(ngModel)]="ratingComment"
                  placeholder="Conducción impecable y vehículo muy limpio."
                ></textarea>
              </div>

              <label class="incident-checkbox">
                <input type="checkbox" [(ngModel)]="ratingIncident" />
                <span>Reportar incidencia de seguridad o servicio en este viaje (<code>has_incident</code>)</span>
              </label>

              <div class="modal-actions">
                <button type="button" class="uber-btn btn-outline" (click)="ratingTripTarget.set(null)">
                  Cancelar
                </button>
                <button
                  type="button"
                  class="uber-btn btn-emerald"
                  [disabled]="loadingRating()"
                  (click)="submitRating()"
                >
                  {{ loadingRating() ? 'Enviando...' : 'Enviar Calificación' }}
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .client-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .tab-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 11px 18px;
      border-radius: 999px;
      background: #ffffff;
      border: 1.5px solid #e4e4e7;
      font-size: 13px;
      font-weight: 700;
      color: #52525b;
      cursor: pointer;
      transition: all 0.18s;

      &.active {
        background: #09090b;
        color: #ffffff;
        border-color: #09090b;
      }
    }

    .hidden-tab {
      display: none !important;
    }

    .feedback-banner {
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

      .close-banner {
        margin-left: auto;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 700;
        color: inherit;
      }
    }

    .ride-grid {
      display: grid;
      grid-template-columns: 460px 1fr;
      gap: 22px;
      align-items: start;
    }

    .left-panel {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .fare-strip {
      padding: 16px 18px;

      .strip-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .strip-prices {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;

        small {
          display: block;
          font-size: 11px;
          color: #71717a;
        }

        strong {
          font-size: 14px;
          font-weight: 800;
        }
      }
    }

    .active-trip-card {
      .active-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 16px;

        .live-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #10b981;
        }

        h3 {
          margin: 6px 0 0;
          font-size: 20px;
          font-weight: 800;
        }

        .icon-refresh {
          background: rgba(255, 255, 255, 0.12);
          border: none;
          color: #ffffff;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }

    .step-track {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;

      .step-node {
        background: rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 8px;
        text-align: center;
        opacity: 0.45;

        .dot {
          display: inline-flex;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.18);
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        small {
          display: block;
          font-size: 11px;
        }

        &.done {
          opacity: 1;
          background: rgba(16, 185, 129, 0.18);
          border: 1px solid rgba(16, 185, 129, 0.45);

          .dot {
            background: #10b981;
            color: #09090b;
          }
        }
      }
    }

    .fare-pill-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.07);
      padding: 10px 14px;
      border-radius: 12px;
      margin-bottom: 14px;
      font-size: 13px;

      strong {
        font-size: 16px;
        color: #10b981;
      }
    }

    .driver-assigned-box {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 14px;
      margin-bottom: 14px;

      .driver-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .driver-avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: #2563eb;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .driver-sub {
        font-size: 12px;
        color: #d4d4d8;
        margin-top: 2px;
      }

      .rating-pill {
        color: #fbbf24;
        font-weight: 700;
      }

      .vehicle-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(0, 0, 0, 0.35);
        padding: 10px 12px;
        border-radius: 12px;

        small {
          display: block;
          font-weight: 700;
          color: #ffffff;
        }

        .color-tag {
          font-size: 11px;
          color: #a1a1aa;
        }

        .plate-badge {
          background: #fbbf24;
          color: #09090b;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 13px;
        }
      }

      .gps-live-coord {
        margin-top: 10px;
        font-size: 11px;
        color: #93c5fd;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .searching-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      margin-bottom: 14px;
      font-size: 13px;
      color: #d4d4d8;

      .radar-spinner {
        width: 20px;
        height: 20px;
        border: 3px solid rgba(16, 185, 129, 0.3);
        border-top-color: #10b981;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        flex-shrink: 0;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .cancel-confirm {
      background: rgba(255, 255, 255, 0.08);
      padding: 12px;
      border-radius: 12px;

      label {
        display: block;
        font-size: 11px;
        margin-bottom: 6px;
        color: #fca5a5;
      }

      .cancel-input {
        width: 100%;
        padding: 9px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: #18181b;
        color: #ffffff;
        font-size: 13px;
        margin-bottom: 10px;
      }

      .cancel-btns {
        display: grid;
        grid-template-columns: 1fr 1.5fr;
        gap: 8px;

        button {
          padding: 9px;
          border-radius: 10px;
          border: none;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }

        .btn-back {
          background: #27272a;
          color: #ffffff;
        }

        .btn-confirm-cancel {
          background: #ef4444;
          color: #ffffff;
        }
      }
    }

    .card-title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;

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

      .gps-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
        padding: 7px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        flex-shrink: 0;
      }
    }

    .map-mode-switch {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f4f4f5;
      padding: 6px 10px;
      border-radius: 12px;
      margin-bottom: 14px;
      font-size: 11px;
      font-weight: 600;
      color: #52525b;

      button {
        border: none;
        background: transparent;
        padding: 5px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;

        &.active {
          background: #09090b;
          color: #ffffff;
        }
      }
    }

    .route-box {
      background: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 16px;
      padding: 14px;
      margin-bottom: 16px;
    }

    .point-block {
      .point-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        label {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          color: #27272a;
        }
      }

      .pin-badge {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 800;
        color: #ffffff;

        &.origin {
          background: #09090b;
        }
        &.dest {
          background: #10b981;
        }
      }

      .uber-input {
        width: 100%;
        background: #ffffff;
        border: 1px solid #d4d4d8;
        border-radius: 12px;
        padding: 10px 12px;
        font-size: 13px;
        margin-bottom: 8px;
      }

      .coord-pair {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 8px;

        small {
          display: block;
          font-size: 10px;
          color: #71717a;
          margin-bottom: 2px;
        }

        input {
          width: 100%;
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid #e4e4e7;
          background: #ffffff;
          font-size: 12px;
        }
      }

      .preset-row {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }

      .mini-preset {
        background: #ffffff;
        border: 1px solid #e4e4e7;
        border-radius: 999px;
        padding: 4px 9px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;

        &:hover {
          background: #09090b;
          color: #ffffff;
        }
      }
    }

    .route-divider {
      height: 1px;
      background: #e4e4e7;
      margin: 14px 0;
    }

    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1.15fr;
      gap: 10px;
    }

    .estimate-result {
      margin-top: 16px;
      padding: 16px;
      border-radius: 16px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;

      .est-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .est-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: #166534;
      }

      .est-price {
        font-size: 26px;
        font-weight: 800;
        color: #09090b;
      }

      .est-pills {
        display: flex;
        gap: 6px;
      }

      .breakdown-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 6px;
        padding-top: 10px;
        border-top: 1px solid #dcfce7;
        font-size: 11px;

        span {
          display: block;
          color: #52525b;
        }

        strong {
          color: #09090b;
        }
      }
    }

    .map-card {
      padding: 12px;
      position: sticky;
      top: 80px;
    }

    .map-Overlay-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 8px 12px;
      font-size: 12px;
      font-weight: 600;

      .legend-items {
        display: flex;
        gap: 14px;
        align-items: center;

        span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        i {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }
        .dot-a { background: #09090b; }
        .dot-b { background: #10b981; }
        .dot-driver { background: #2563eb; }
      }

      .recenter-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: #f4f4f5;
        border: none;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
    }

    .map-canvas {
      width: 100%;
      height: 580px;
      border-radius: 16px;
      overflow: hidden;
      z-index: 1;
    }

    /* History Tab */
    .history-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;

      h2 {
        margin: 0 0 4px;
        font-size: 22px;
        font-weight: 800;
      }
      p {
        margin: 0;
        font-size: 13px;
        color: #71717a;
      }
    }

    .w-auto {
      width: auto !important;
    }

    .trips-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }

    .trip-item {
      display: flex;
      flex-direction: column;
      gap: 14px;

      .trip-top {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .trip-id {
          font-weight: 800;
          margin-right: 8px;
        }

        .trip-fare {
          font-size: 18px;
          font-weight: 800;
          color: #09090b;
        }
      }

      .trip-details-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        background: #f8fafc;
        padding: 12px;
        border-radius: 12px;

        small {
          display: block;
          font-size: 11px;
          color: #71717a;
        }
        strong {
          font-size: 13px;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 48px 20px;

      ion-icon {
        font-size: 42px;
        color: #a1a1aa;
      }
    }

    /* Rating Modal */
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

    .rating-modal {
      width: 100%;
      max-width: 440px;

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
        }
      }

      .modal-subtitle {
        font-size: 13px;
        color: #52525b;
        margin: 6px 0 18px;
      }

      .stars-picker {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 6px;

        .star-btn {
          background: #f4f4f5;
          border: none;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          font-size: 24px;
          color: #a1a1aa;
          cursor: pointer;
          transition: all 0.15s;

          &.active {
            background: #fef3c7;
            color: #f59e0b;
            transform: scale(1.06);
          }
        }
      }

      .score-caption {
        text-align: center;
        font-size: 12px;
        font-weight: 700;
        color: #71717a;
        margin-bottom: 16px;
      }

      .incident-checkbox {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
        font-weight: 600;
        color: #b91c1c;
        background: #fef2f2;
        padding: 10px 12px;
        border-radius: 12px;
        margin-bottom: 18px;
        cursor: pointer;
      }

      .modal-actions {
        display: grid;
        grid-template-columns: 1fr 1.3fr;
        gap: 10px;
      }
    }

    @media (max-width: 960px) {
      .ride-grid {
        grid-template-columns: 1fr;
      }
      .map-canvas {
        height: 400px;
      }
    }
  `]
})
export class ClientHomePage implements OnInit, AfterViewInit, OnDestroy {
  private readonly clientService = inject(ClientService);

  readonly activeTab = signal<'ride' | 'history'>('ride');
  readonly mapClickMode = signal<'origin' | 'destination'>('destination');

  readonly activeFare = signal<Fare | null>(null);
  readonly fareEstimate = signal<FareEstimate | null>(null);

  readonly hasActiveRide = signal(false);
  readonly activeType = signal<string>('trip');
  readonly activeRideData = signal<ActiveRideData | null>(null);

  readonly loadingEstimate = signal(false);
  readonly loadingRequest = signal(false);
  readonly loadingCancel = signal(false);
  readonly loadingHistory = signal(false);
  readonly loadingRating = signal(false);

  readonly showCancelForm = signal(false);
  readonly locatingGps = signal(false);
  readonly statusBanner = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  readonly tripHistory = signal<TripRecord[]>([]);
  readonly ratingTripTarget = signal<TripRecord | null>(null);
  readonly ratingScore = signal(5);
  ratingComment = 'Conducción impecable y vehículo muy limpio.';
  ratingIncident = false;

  originName = 'Parque de la 93, Calle 93A # 12-50';
  originLat = 4.6766;
  originLng = -74.0483;

  destinationName = 'Centro Comercial Andino, Carrera 11 # 82-71';
  destinationLat = 4.6664;
  destinationLng = -74.0536;

  cancelReason = 'Cambio de planes del usuario';

  readonly presets: LocationPreset[] = [
    {
      label: 'Parque la 93',
      address: 'Parque de la 93, Calle 93A # 12-50',
      lat: 4.6766,
      lng: -74.0483
    },
    {
      label: 'C.C. Andino',
      address: 'Centro Comercial Andino, Carrera 11 # 82-71',
      lat: 4.6664,
      lng: -74.0536
    },
    {
      label: 'Unicentro',
      address: 'Centro Comercial Unicentro, Cra. 15 # 124-30',
      lat: 4.7019,
      lng: -74.0419
    },
    {
      label: 'El Dorado',
      address: 'Aeropuerto Internacional El Dorado',
      lat: 4.7016,
      lng: -74.1469
    },
    {
      label: 'U. Nacional',
      address: 'Universidad Nacional de Colombia, Cra 45 # 26-85',
      lat: 4.6382,
      lng: -74.084
    }
  ];

  private map?: L.Map;
  private originMarker?: L.Marker;
  private destMarker?: L.Marker;
  private driverMarker?: L.Marker;
  private routeLine?: L.Polyline;
  private pollTimer?: any;

  ngOnInit(): void {
    this.loadActiveFare();
    this.checkActiveRide(false);
    this.onEstimateFare();

    this.pollTimer = setInterval(() => {
      this.checkActiveRide(false);
    }, 5000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
      // Detectar automáticamente la ubicación real del usuario al abrir la app
      this.useDeviceGps(false);
    }, 200);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
    if (this.map) {
      this.map.remove();
    }
  }

  switchTab(tab: 'ride' | 'history'): void {
    this.activeTab.set(tab);
    if (tab === 'history') {
      this.loadTripHistory();
    } else {
      setTimeout(() => this.map?.invalidateSize(), 150);
    }
  }

  private initMap(): void {
    const container = document.getElementById('client-leaflet-map');
    if (!container || this.map) return;

    this.map = L.map('client-leaflet-map', {
      center: [this.originLat, this.originLng],
      zoom: 14
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(5));
      const lng = Number(e.latlng.lng.toFixed(5));

      if (this.mapClickMode() === 'origin') {
        this.originLat = lat;
        this.originLng = lng;
        this.originName = `Ubicación seleccionada (${lat}, ${lng})`;
        this.reverseGeocode(lat, lng, 'origin');
      } else {
        this.destinationLat = lat;
        this.destinationLng = lng;
        this.destinationName = `Destino en mapa (${lat}, ${lng})`;
        this.reverseGeocode(lat, lng, 'destination');
      }
      this.syncMapMarkers();
      this.onEstimateFare();
    });

    this.syncMapMarkers();
  }

  syncMapMarkers(): void {
    if (!this.map) return;

    const iconA = L.divIcon({
      className: 'uber-map-pin pin-origin',
      html: 'A',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const iconB = L.divIcon({
      className: 'uber-map-pin pin-dest',
      html: 'B',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    if (this.originMarker) {
      this.originMarker.setLatLng([this.originLat, this.originLng]);
    } else {
      this.originMarker = L.marker([this.originLat, this.originLng], { icon: iconA })
        .addTo(this.map)
        .bindPopup('Punto de Recogida (Origen)');
    }

    if (this.destMarker) {
      this.destMarker.setLatLng([this.destinationLat, this.destinationLng]);
    } else {
      this.destMarker = L.marker([this.destinationLat, this.destinationLng], { icon: iconB })
        .addTo(this.map)
        .bindPopup('Destino');
    }

    const points: L.LatLngExpression[] = [
      [this.originLat, this.originLng],
      [this.destinationLat, this.destinationLng]
    ];

    if (this.routeLine) {
      this.routeLine.setLatLngs(points);
    } else {
      this.routeLine = L.polyline(points, {
        color: '#09090b',
        weight: 4,
        dashArray: '8, 8'
      }).addTo(this.map);
    }

    const driverLoc = this.activeRideData()?.driver?.latest_location;
    if (driverLoc && driverLoc.latitude && driverLoc.longitude) {
      const iconDriver = L.divIcon({
        className: 'uber-map-pin pin-driver',
        html: '🚗',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      if (this.driverMarker) {
        this.driverMarker.setLatLng([driverLoc.latitude, driverLoc.longitude]);
      } else {
        this.driverMarker = L.marker([driverLoc.latitude, driverLoc.longitude], { icon: iconDriver })
          .addTo(this.map)
          .bindPopup('Conductor en Tiempo Real');
      }
      points.push([driverLoc.latitude, driverLoc.longitude]);
    } else if (this.driverMarker) {
      this.map.removeLayer(this.driverMarker);
      this.driverMarker = undefined;
    }

    this.map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 15 });
  }

  applyPreset(target: 'origin' | 'destination', preset: LocationPreset): void {
    if (target === 'origin') {
      this.originName = preset.address;
      this.originLat = preset.lat;
      this.originLng = preset.lng;
    } else {
      this.destinationName = preset.address;
      this.destinationLat = preset.lat;
      this.destinationLng = preset.lng;
    }
    this.syncMapMarkers();
    this.onEstimateFare();
  }

  useDeviceGps(onlyUpdateOrigin = false): void {
    this.locatingGps.set(true);

    const applyRealCoordinates = (lat: number, lng: number, sourceLabel: string) => {
      this.originLat = Number(lat.toFixed(5));
      this.originLng = Number(lng.toFixed(5));
      this.originName = `Mi ubicación actual (${this.originLat}, ${this.originLng})`;
      this.reverseGeocode(this.originLat, this.originLng, 'origin');

      // Si es la carga inicial, situar también el punto B cerca de la ubicación real del usuario (~1.2 km)
      if (!onlyUpdateOrigin) {
        this.destinationLat = Number((this.originLat + 0.0085).toFixed(5));
        this.destinationLng = Number((this.originLng + 0.0065).toFixed(5));
        this.destinationName = `Destino cercano (${this.destinationLat}, ${this.destinationLng})`;
        this.reverseGeocode(this.destinationLat, this.destinationLng, 'destination');
      }

      this.locatingGps.set(false);
      this.syncMapMarkers();
      this.onEstimateFare();
      this.statusBanner.set({
        type: 'success',
        text: `Ubicación actual detectada (${sourceLabel}): ${this.originLat}, ${this.originLng}`
      });
    };

    const fallbackByIp = () => {
      fetch('https://ipwho.is/')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.latitude && data.longitude) {
            applyRealCoordinates(Number(data.latitude), Number(data.longitude), `Red ${data.city || ''}`);
          } else {
            this.locatingGps.set(false);
          }
        })
        .catch(() => {
          this.locatingGps.set(false);
        });
    };

    if (!navigator.geolocation) {
      fallbackByIp();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyRealCoordinates(pos.coords.latitude, pos.coords.longitude, 'GPS de alta precisión');
      },
      () => {
        // Si el navegador bloquea el GPS o tarda, usar geolocalización por IP como respaldo
        fallbackByIp();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  private reverseGeocode(lat: number, lng: number, target: 'origin' | 'destination'): void {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
      headers: { 'Accept-Language': 'es' }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.display_name) {
          const shortAddress = data.display_name.split(',').slice(0, 3).join(',').trim();
          if (target === 'origin') {
            this.originName = shortAddress;
          } else {
            this.destinationName = shortAddress;
          }
        }
      })
      .catch(() => {});
  }

  loadActiveFare(): void {
    this.clientService.getActiveFare().subscribe({
      next: (res) => {
        if (res?.fare) {
          this.activeFare.set(res.fare);
        }
      },
      error: () => {}
    });
  }

  onEstimateFare(): void {
    this.loadingEstimate.set(true);
    this.clientService
      .estimateFare({
        origin_latitude: Number(this.originLat),
        origin_longitude: Number(this.originLng),
        destination_latitude: Number(this.destinationLat),
        destination_longitude: Number(this.destinationLng)
      })
      .subscribe({
        next: (res) => {
          this.loadingEstimate.set(false);
          if (res?.estimate) {
            this.fareEstimate.set(res.estimate);
          }
        },
        error: (err) => {
          this.loadingEstimate.set(false);
          if (err?.error?.message) {
            this.statusBanner.set({ type: 'error', text: err.error.message });
          }
        }
      });
  }

  onRequestRide(): void {
    if (!this.originName.trim() || !this.destinationName.trim()) {
      this.statusBanner.set({
        type: 'error',
        text: 'Ingresa la dirección de origen y destino antes de confirmar el viaje.'
      });
      return;
    }

    this.loadingRequest.set(true);
    this.statusBanner.set(null);

    this.clientService
      .createRideRequest({
        origin_name: this.originName.trim(),
        origin_latitude: Number(this.originLat),
        origin_longitude: Number(this.originLng),
        destination_name: this.destinationName.trim(),
        destination_latitude: Number(this.destinationLat),
        destination_longitude: Number(this.destinationLng)
      })
      .subscribe({
        next: (res) => {
          this.loadingRequest.set(false);
          this.statusBanner.set({
            type: 'success',
            text: res.message || 'Solicitud de viaje creada exitosamente. Buscando conductores disponibles...'
          });
          if (res.ride_request) {
            this.hasActiveRide.set(true);
            this.activeType.set('request');
            this.activeRideData.set({
              id: res.ride_request.id,
              status: res.ride_request.status || 'requested',
              estimated_fare: res.ride_request.estimated_fare,
              origin_name: res.ride_request.origin_name,
              destination_name: res.ride_request.destination_name
            });
          }
          this.checkActiveRide(false);
        },
        error: (err) => {
          this.loadingRequest.set(false);
          // 400 Bad Request: Ya cuenta con una solicitud o viaje activo en curso
          const msg = err?.error?.message || 'No fue posible crear la solicitud de viaje.';
          this.statusBanner.set({ type: 'error', text: msg });
          this.checkActiveRide(false);
        }
      });
  }

  checkActiveRide(showToast = false): void {
    this.clientService.getActiveRide().subscribe({
      next: (res) => {
        this.hasActiveRide.set(!!res.has_active);
        if (res.has_active && res.data) {
          this.activeType.set(res.type || 'trip');
          this.activeRideData.set(res.data);
          this.syncMapMarkers();
          if (showToast) {
            this.statusBanner.set({
              type: 'success',
              text: `Estado sincronizado: ${res.data.status.toUpperCase()}`
            });
          }
        } else {
          this.activeRideData.set(null);
          this.syncMapMarkers();
        }
      },
      error: () => {}
    });
  }

  onCancelActiveRide(id: number): void {
    if (!this.cancelReason.trim()) {
      this.cancelReason = 'Cambio de planes del usuario';
    }

    this.loadingCancel.set(true);
    this.clientService.cancelRide(id, this.cancelReason.trim()).subscribe({
      next: (res) => {
        this.loadingCancel.set(false);
        this.showCancelForm.set(false);
        this.hasActiveRide.set(false);
        this.activeRideData.set(null);
        this.syncMapMarkers();
        this.statusBanner.set({
          type: 'success',
          text: res.message || 'Solicitud cancelada exitosamente'
        });
      },
      error: (err) => {
        this.loadingCancel.set(false);
        this.statusBanner.set({
          type: 'error',
          text: err?.error?.message || 'No fue posible cancelar el viaje en su estado actual.'
        });
      }
    });
  }

  loadTripHistory(): void {
    this.loadingHistory.set(true);
    this.clientService.getTrips(1).subscribe({
      next: (res) => {
        this.loadingHistory.set(false);
        const list = Array.isArray(res?.trips?.data)
          ? res.trips.data
          : Array.isArray(res?.trips)
          ? res.trips
          : [];
        this.tripHistory.set(list);
      },
      error: () => {
        this.loadingHistory.set(false);
      }
    });
  }

  openRatingModal(trip: TripRecord): void {
    this.ratingTripTarget.set(trip);
    this.ratingScore.set(5);
    this.ratingComment = 'Conducción impecable y vehículo muy limpio.';
    this.ratingIncident = false;
  }

  submitRating(): void {
    const target = this.ratingTripTarget();
    if (!target) return;

    this.loadingRating.set(true);
    this.clientService
      .rateTrip(target.id, {
        score: this.ratingScore(),
        comment: this.ratingComment.trim(),
        has_incident: this.ratingIncident
      })
      .subscribe({
        next: (res) => {
          this.loadingRating.set(false);
          this.ratingTripTarget.set(null);
          this.statusBanner.set({
            type: 'success',
            text: res.message || 'Calificación enviada exitosamente. ¡Gracias por sus comentarios!'
          });
          this.loadTripHistory();
        },
        error: (err) => {
          this.loadingRating.set(false);
          this.statusBanner.set({
            type: 'error',
            text: err?.error?.message || 'No fue posible registrar la calificación para este viaje.'
          });
        }
      });
  }

  statusHeadline(status: string): string {
    switch (status) {
      case 'requested':
        return 'Buscando conductor disponible...';
      case 'assigned':
        return 'Conductor asignado en camino';
      case 'driver_arrived':
        return '¡Tu conductor ha llegado al punto!';
      case 'in_progress':
        return 'Viaje en curso hacia tu destino';
      case 'completed':
        return 'Viaje finalizado con éxito';
      default:
        return `Estado actual: ${status}`;
    }
  }

  isStepDone(status: string, step: number): boolean {
    const order: Record<string, number> = {
      requested: 1,
      assigned: 2,
      driver_arrived: 3,
      in_progress: 4,
      completed: 5
    };
    return (order[status] || 1) >= step;
  }
}

