import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import { AdminDashboardResponse, DriverInfo, Fare } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  /** GET /api/admin/dashboard */
  getDashboard(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>(this.apiConfig.endpoint('/admin/dashboard'));
  }

  /** GET /api/admin/drivers */
  getDrivers(approvalStatus?: string): Observable<{ success: boolean; drivers: DriverInfo[] }> {
    let params = new HttpParams();
    if (approvalStatus && approvalStatus !== 'all') {
      params = params.set('approval_status', approvalStatus);
    }
    return this.http.get<{ success: boolean; drivers: DriverInfo[] }>(
      this.apiConfig.endpoint('/admin/drivers'),
      { params }
    );
  }

  /** PATCH /api/admin/drivers/{id}/approval */
  updateDriverApproval(
    driverId: number,
    payload: { approval_status: 'approved' | 'rejected' | 'suspended' | 'pending'; admin_notes: string }
  ): Observable<{ success: boolean; message: string; driver: any }> {
    return this.http.patch<{ success: boolean; message: string; driver: any }>(
      this.apiConfig.endpoint(`/admin/drivers/${driverId}/approval`),
      payload
    );
  }

  /** GET /api/admin/fares */
  getFares(): Observable<{ success: boolean; fares?: Fare[]; data?: Fare[] }> {
    return this.http.get<{ success: boolean; fares?: Fare[]; data?: Fare[] }>(
      this.apiConfig.endpoint('/admin/fares')
    );
  }

  /** POST /api/admin/fares */
  createFare(payload: Fare): Observable<{ success: boolean; message: string; fare: Fare }> {
    return this.http.post<{ success: boolean; message: string; fare: Fare }>(
      this.apiConfig.endpoint('/admin/fares'),
      payload
    );
  }

  /** GET /api/admin/trips */
  getTrips(filters: {
    status?: string;
    driver_id?: string;
    client_id?: string;
    date?: string;
  }): Observable<any> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.driver_id) params = params.set('driver_id', filters.driver_id);
    if (filters.client_id) params = params.set('client_id', filters.client_id);
    if (filters.date) params = params.set('date', filters.date);

    return this.http.get<any>(this.apiConfig.endpoint('/admin/trips'), { params });
  }

  /** GET /api/admin/reports */
  getReports(): Observable<any> {
    return this.http.get<any>(this.apiConfig.endpoint('/admin/reports'));
  }

  /** GET /api/admin/audit-logs */
  getAuditLogs(): Observable<any> {
    return this.http.get<any>(this.apiConfig.endpoint('/admin/audit-logs'));
  }
}

