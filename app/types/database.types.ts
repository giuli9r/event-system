export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserTypeEnum =
  | 'MASTER'
  | 'CHIEF_TRIPU'
  | 'JEFE'
  | 'COORDINADOR'
  | 'MARINERO'
  | 'PASAJERO'

export type VenueTypeEnum =
  | 'estadio'
  | 'campo'
  | 'arena'
  | 'club'
  | 'sala'
  | 'estudio'
  | 'boliche'
  | 'bar'
  | 'sitio_publico'
  | 'edificio'
  | 'predio'
  | 'complejo'

export type EventStatusEnum =
  | 'draft'
  | 'published'
  | 'sold_out'
  | 'completed'
  | 'canceled'
  | 'rescheduled'

export type PaymentMethodEnum =
  | 'transferencia'
  | 'efectivo'
  | 'tarjeta_credito'
  | 'tarjeta_debito'
  | 'mercado_pago'
  | 'mixto'

export type PaymentStatusEnum =
  | 'paid'
  | 'partial'
  | 'pending'
  | 'refunded'
  | 'canceled'
  | 'gifted'

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          lastname: string
          username: string
          email: string
          daybirth: string | null
          password: string | null
          is_active: boolean
          user_type: UserTypeEnum
          level: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          lastname: string
          username: string
          email: string
          daybirth?: string | null
          password?: string | null
          is_active?: boolean
          user_type?: UserTypeEnum
          level?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          lastname?: string
          username?: string
          email?: string
          daybirth?: string | null
          password?: string | null
          is_active?: boolean
          user_type?: UserTypeEnum
          level?: number
        }
        Relationships: []
      }
      drivers: {
        Row: {
          id: string
          created_at: string
          name: string
          lastname: string
          phone: string | null
          cellphone: string | null
          licence: string | null
          company: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          lastname: string
          phone?: string | null
          cellphone?: string | null
          licence?: string | null
          company?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          lastname?: string
          phone?: string | null
          cellphone?: string | null
          licence?: string | null
          company?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      venues: {
        Row: {
          id: string
          created_at: string
          name: string
          city: string
          address: string | null
          google_maps_url: string | null
          capacity: number
          tipo: VenueTypeEnum
          image: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          city: string
          address?: string | null
          google_maps_url?: string | null
          capacity?: number
          tipo?: VenueTypeEnum
          image?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          city?: string
          address?: string | null
          google_maps_url?: string | null
          capacity?: number
          tipo?: VenueTypeEnum
          image?: string | null
        }
        Relationships: []
      }
      transports: {
        Row: {
          id: string
          created_at: string
          driver_id: string | null
          name: string
          vehicle_type: string
          capacity: number
          origin: string
          phone: string | null
          cellphone: string | null
          license_plate: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          driver_id?: string | null
          name: string
          vehicle_type: string
          capacity?: number
          origin: string
          phone?: string | null
          cellphone?: string | null
          license_plate?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          driver_id?: string | null
          name?: string
          vehicle_type?: string
          capacity?: number
          origin?: string
          phone?: string | null
          cellphone?: string | null
          license_plate?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          venue_id: string | null
          transport_id: string | null
          coordinator_id: string | null
          title: string
          slug: string
          artist_headliner: string
          event_date: string
          departure_time: string
          departure_location: string
          return_policy: string | null
          includes_summary: string | null
          full_itinerary: string | null
          image_url: string | null
          status: EventStatusEnum
          is_featured: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          venue_id?: string | null
          transport_id?: string | null
          coordinator_id?: string | null
          title: string
          slug: string
          artist_headliner: string
          event_date: string
          departure_time: string
          departure_location: string
          return_policy?: string | null
          includes_summary?: string | null
          full_itinerary?: string | null
          image_url?: string | null
          status?: EventStatusEnum
          is_featured?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          venue_id?: string | null
          transport_id?: string | null
          coordinator_id?: string | null
          title?: string
          slug?: string
          artist_headliner?: string
          event_date?: string
          departure_time?: string
          departure_location?: string
          return_policy?: string | null
          includes_summary?: string | null
          full_itinerary?: string | null
          image_url?: string | null
          status?: EventStatusEnum
          is_featured?: boolean
        }
        Relationships: []
      }
      package_tiers: {
        Row: {
          id: string
          created_at: string
          event_id: string
          name: string
          includes_ticket: boolean
          early_bird: boolean
          price: number
          currency: string
          payment_methods: string
          is_available: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          event_id: string
          name: string
          includes_ticket?: boolean
          early_bird?: boolean
          price?: number
          currency?: string
          payment_methods?: string
          is_available?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          event_id?: string
          name?: string
          includes_ticket?: boolean
          early_bird?: boolean
          price?: number
          currency?: string
          payment_methods?: string
          is_available?: boolean
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          phone: string | null
          selected_event: string | null
          message: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          phone?: string | null
          selected_event?: string | null
          message: string
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          phone?: string | null
          selected_event?: string | null
          message?: string
          status?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          lastname: string
          dni: string
          email: string | null
          phone: string | null
          city: string | null
          daybirth: string | null
          emergency_contact: string | null
          instagram: string | null
          notes: string | null
          interests: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          lastname: string
          dni: string
          email?: string | null
          phone?: string | null
          city?: string | null
          daybirth?: string | null
          emergency_contact?: string | null
          instagram?: string | null
          notes?: string | null
          interests?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          lastname?: string
          dni?: string
          email?: string | null
          phone?: string | null
          city?: string | null
          daybirth?: string | null
          emergency_contact?: string | null
          instagram?: string | null
          notes?: string | null
          interests?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      sales: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          sale_date: string
          event_id: string
          customer_id: string
          package_tier_id: string | null
          created_by: string | null
          quantity: number
          unit_price: number
          total_amount: number
          amount_paid: number
          balance_due: number
          installments: number
          currency: string
          payment_method: PaymentMethodEnum
          payment_status: PaymentStatusEnum
          seat_number: string | null
          boarding_location: string | null
          receipt_number: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          sale_date?: string
          event_id: string
          customer_id: string
          package_tier_id?: string | null
          created_by?: string | null
          quantity?: number
          unit_price: number
          total_amount: number
          amount_paid?: number
          balance_due?: number
          installments?: number
          currency?: string
          payment_method?: PaymentMethodEnum
          payment_status?: PaymentStatusEnum
          seat_number?: string | null
          boarding_location?: string | null
          receipt_number?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          sale_date?: string
          event_id?: string
          customer_id?: string
          package_tier_id?: string | null
          created_by?: string | null
          quantity?: number
          unit_price?: number
          total_amount?: number
          amount_paid?: number
          balance_due?: number
          installments?: number
          currency?: string
          payment_method?: PaymentMethodEnum
          payment_status?: PaymentStatusEnum
          seat_number?: string | null
          boarding_location?: string | null
          receipt_number?: string | null
          notes?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type_enum: UserTypeEnum
      venue_type_enum: VenueTypeEnum
      event_status_enum: EventStatusEnum
      payment_method_enum: PaymentMethodEnum
      payment_status_enum: PaymentStatusEnum
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type CustomerRow = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type SaleRow = Database['public']['Tables']['sales']['Row']
export type SaleInsert = Database['public']['Tables']['sales']['Insert']
export type SaleUpdate = Database['public']['Tables']['sales']['Update']
