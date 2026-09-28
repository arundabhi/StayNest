export type BookingStatus =
  | "idle"
  | "collecting"
  | "awaiting_payment"
  | "awaiting_confirmation"
  | "confirmed"
  | "canceled"
  | "failed";

export type PaymentMethodType = "stripe" | "razorpay" | "cod";

export interface SelectedHotelState {
  hotelId: string;
  hotelName: string;
  city?: string;
  basePrice?: number;
}

export interface SelectedRoomState {
  roomId: string;
  roomType: string;
  title?: string;
  price: number;
  maxGuests?: number;
}

export interface BookingDetailsState {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number;
  nights?: number;
  totalPrice?: number;
}

export interface PendingBookingState {
  hotelId: string;
  hotelName?: string;
  roomId: string;
  roomType?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalPrice: number;
  paymentMethod?: PaymentMethodType;
  status: BookingStatus;
  bookingId?: string;
  paymentUrl?: string;
}

export interface RecommendedHotelItem {
  hotelId: string;
  hotelName: string;
  city?: string;
  basePrice?: number;
  rating?: number;
  rank?: number;
}

export interface ConversationState {
  sessionId: string;
  userId?: string;
  currentStep?:
    | "IDLE"
    | "SEARCH_RESULTS"
    | "HOTEL_SELECTED"
    | "ROOM_SELECTED"
    | "DATES_GUESTS_COLLECTED"
    | "PAYMENT_SELECTED"
    | "AWAITING_CONFIRMATION"
    | "BOOKING_CONFIRMED";
  city?: string;
  selectedHotel?: SelectedHotelState;
  selectedRoom?: SelectedRoomState;
  bookingDetails?: BookingDetailsState;
  paymentMethod?: PaymentMethodType;
  pendingBooking?: PendingBookingState;
  recentlyRecommendedHotels?: RecommendedHotelItem[];
  metadata?: Record<string, any>;
  version?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
