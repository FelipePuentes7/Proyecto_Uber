import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import {
  ClientActiveResponse,
  CreateRideRequestPayload,
  Fare,
  FareEstimate,
  FareEstimateRequest,
  RideRequest
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  /** GET /api/fares/active */
  getActiveFare(): Observable<{ success: boolean; fare: Fare }> {
    return this.http.get<{ success: boolean; fare: Fare }>(this.apiConfig.endpoint('/fares/active'));
  }

  /** POST /api/client/estimate-fare */
  estimateFare(payload: FareEstimateRequest): Observable<{ success: boolean; estimate: FareEstimate }> {
    return this.http.post<{ success: boolean; estimate: FareEstimate }>(
      this.apiConfig.endpoint('/client/estimate-fare'),
      payload
    );
  }

  /** POST /api/client/ride-requests */
  createRideRequest(payload: CreateRideRequestPayload): Observable<{
    success: boolean;
    message: string;
    ride_request: RideRequest;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      ride_request: RideRequest;
    }>(this.apiConfig.endpoint('/client/ride-requests'), payload);
  }

  /** GET /api/client/active */
  getActiveRide(): Observable<ClientActiveResponse> {
    return this.http.get<ClientActiveResponse>(this.apiConfig.endpoint('/client/active'));
  }

  /** POST /api/client/cancel/{id} */
  cancelRide(id: number, reason: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      this.apiConfig.endpoint(`/client/cancel/${id}`),
      { reason }
    );
  }

  /** GET /api/client/trips */
  getTrips(page = 1): Observable<{ success: boolean; trips: any }> {
    return this.http.get<{ success: boolean; trips: any }>(
      this.apiConfig.endpoint(`/client/trips?page=${page}`)
    );
  }

  /** POST /api/client/trips/{id}/rating */
  rateTrip(
    tripId: number,
    payload: { score: number; comment: string; has_incident: boolean }
  ): Observable<{ success: boolean; message: string; rating: any }> {
    return this.http.post<{ success: boolean; message: string; rating: any }>(
      this.apiConfig.endpoint(`/client/trips/${tripId}/rating`),
      payload
    );
  }
}

