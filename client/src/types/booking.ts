export interface Booking {
  id: string;
  venueName: string;
  venueImage: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  totalPrice: number;
  guestCount: number;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
}

export interface CreateBookingRequest {
  venueId: string;
  date: string;
  time: string;
  guestCount: number;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
}

export type BookingResponse = Booking;

export type BookingsResponse = Booking[];