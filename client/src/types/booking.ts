export type ServiceType = 'venue' | 'catering' | 'photography' | 'videography' | 'bridal-makeup' | 'decoration';

export interface Booking {
  id: string;
  serviceType: ServiceType;
  serviceName: string;
  serviceImage: string;
  // Legacy fields for backward compatibility
  venueName: string;
  venueImage: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'rejected';
  totalPrice: number;
  guestCount: number;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  providerId?: string;
  serviceId?: string;
  // For provider view
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
  // For customer view
  provider?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface CreateBookingRequest {
  serviceType: ServiceType;
  serviceId: string;
  venueId?: string; // For backward compatibility
  date: string;
  time: string;
  guestCount: number;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
}

export type BookingResponse = Booking;

export type BookingsResponse = Booking[];