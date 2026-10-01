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

export interface Database {
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
      }
    }
  }
}
