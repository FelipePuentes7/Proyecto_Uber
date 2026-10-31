export type UserRole = 'admin' | 'client' | 'driver';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RegisterClientPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'client';
}

export interface RegisterDriverPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'driver';
  license_number: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  color: string;
}

export type RegisterPayload = RegisterClientPayload | RegisterDriverPayload;

export interface Fare {
  id?: number;
  name: string;
  base_fare: number;
  price_per_km: number;
  price_per_minute: number;
  minimum_fare: number;
  surge_multiplier: number;
  active: boolean;
}

export interface FareEstimateRequest {
  origin_latitude: number;
  origin_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
}

export interface FareEstimate {
  distance_km: number;
  duration_min: number;
  estimated_fare: number;
  currency: string;
  fare_breakdown: {
    base_fare: number;
    price_per_km: number;
    price_per_minute: number;
    minimum_fare: number;
    surge_multiplier: number;
  };
}

export interface CreateRideRequestPayload {
  origin_name: string;
  origin_latitude: number;
  origin_longitude: number;
  destination_name: string;
  destination_latitude: number;
  destination_longitude: number;
}

export interface RideRequest {
  id: number;
  client_id?: number;
  origin_name: string;
  origin_latitude?: number;
  origin_longitude?: number;
  destination_name: string;
  destination_latitude?: number;
  destination_longitude?: number;
  estimated_distance_km: number;
  estimated_duration_min?: number;
  estimated_fare: number;
  status?: string;
  created_at?: string;
  client?: {
    name: string;
    phone: string;
  };
}

export interface Vehicle {
  id?: number;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  capacity?: number;
  color?: string;
}

export interface DriverInfo {
  id: number;
  license_number?: string;
  approval_status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  rating_average?: number;
  user?: {
    id?: number;
    name: string;
    email?: string;
    phone?: string;
  };
  latest_location?: {
    latitude: number;
    longitude: number;
  };
  vehicles?: Vehicle[];
}

export interface ActiveRideData {
  id: number;
  request_id?: number;
  status: 'requested' | 'assigned' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled' | string;
  origin_name?: string;
  origin_latitude?: number;
  origin_longitude?: number;
  destination_name?: string;
  destination_latitude?: number;
  destination_longitude?: number;
  estimated_distance_km?: number;
  estimated_duration_min?: number;
  estimated_fare?: number;
  final_fare?: number;
  driver?: DriverInfo;
  vehicle?: Vehicle;
  created_at?: string;
}

export interface ClientActiveResponse {
  success: boolean;
  has_active: boolean;
  type?: 'trip' | 'request' | 'ride_request' | string;
  data?: ActiveRideData;
}

export interface TripRecord {
  id: number;
  request_id?: number;
  client_id?: number;
  driver_id?: number;
  origin_name?: string;
  destination_name?: string;
  estimated_fare?: number;
  final_fare?: number;
  distance_travelled_km?: number;
  duration_travelled_min?: number;
  status: string;
  started_at?: string;
  driver_arrived_at?: string;
  completed_at?: string;
  created_at?: string;
  driver?: {
    id?: number;
    rating_average?: number;
    user?: {
      name: string;
      phone?: string;
    };
  };
  client?: {
    id?: number;
    name?: string;
    phone?: string;
    user?: {
      name: string;
      phone?: string;
    };
  };
  vehicle?: Vehicle;
  rating?: {
    id: number;
    score: number;
    comment?: string;
  };
}

export interface AdminDashboardStats {
  total_clients: number;
  total_drivers: number;
  pending_drivers: number;
  approved_drivers: number;
  active_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  pending_requests: number;
  total_revenue: number;
}

export interface AdminDashboardResponse {
  success: boolean;
  stats: AdminDashboardStats;
  recent_trips: any[];
  recent_incidents: any[];
}

