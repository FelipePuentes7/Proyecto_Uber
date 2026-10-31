import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import { RideRequest, TripRecord } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  /** PUT /api/driver/availability */
  updateAvailability(status: 'available' | 'unavailable'): Observable<{
    success: boolean;
    message: string;
    availability_status: 'available' | 'unavailable';
  }> {
    return this.http.put<{
      success: boolean;
      message: string;
      availability_status: 'available' | 'unavailable';
    }>(this.apiConfig.endpoint('/driver/availability'), { status });
  }

  /** GET /api/driver/ride-requests */
  getPendingRequests(): Observable<{ success: boolean; requests: RideRequest[] }> {
    return this.http.get<{ success: boolean; requests: RideRequest[] }>(
      this.apiConfig.endpoint('/driver/ride-requests')
    );
  }

  /** POST /api/driver/ride-requests/{id}/accept */
  acceptRideRequest(requestId: number): Observable<{
    success: boolean;
    message: string;
    trip: TripRecord;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      trip: TripRecord;
    }>(this.apiConfig.endpoint(`/driver/ride-requests/${requestId}/accept`), {});
  }

  /** POST /api/driver/trips/{id}/arrive */
  arriveAtPickup(tripId: number): Observable<{
    success: boolean;
    message: string;
    trip: TripRecord;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      trip: TripRecord;
    }>(this.apiConfig.endpoint(`/driver/trips/${tripId}/arrive`), {});
  }

  /** POST /api/driver/trips/{id}/start */
  startTrip(tripId: number): Observable<{
    success: boolean;
    message: string;
    trip: TripRecord;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      trip: TripRecord;
    }>(this.apiConfig.endpoint(`/driver/trips/${tripId}/start`), {});
  }

  /** POST /api/driver/trips/{id}/complete */
  completeTrip(
    tripId: number,
    payload: { actual_distance_km: number; actual_duration_min: number }
  ): Observable<{
    success: boolean;
    message: string;
    trip: TripRecord;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      trip: TripRecord;
    }>(this.apiConfig.endpoint(`/driver/trips/${tripId}/complete`), payload);
  }

  /** POST /api/driver/location */
  updateLocation(payload: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    trip_id?: number | null;
  }): Observable<{
    success: boolean;
    location: {
      driver_id: number;
      latitude: number;
      longitude: number;
      recorded_at: string;
    };
  }> {
    return this.http.post<{
      success: boolean;
      location: {
        driver_id: number;
        latitude: number;
        longitude: number;
        recorded_at: string;
      };
    }>(this.apiConfig.endpoint('/driver/location'), payload);
  }
}

