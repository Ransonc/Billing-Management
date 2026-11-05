// Supabase Database Types — auto-generated
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendances: {
        Row: {
          check_in_addr: string | null
          check_in_lat: number | null
          check_in_lng: number | null
          check_in_time: string
          check_out_addr: string | null
          check_out_lat: number | null
          check_out_lng: number | null
          check_out_time: string | null
          created_at: string
          date: string
          enterprise_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          check_in_addr?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_time: string
          check_out_addr?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          check_out_time?: string | null
          created_at?: string
          date: string
          enterprise_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          check_in_addr?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_time?: string
          check_out_addr?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          enterprise_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendances_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          enterprise_id: string | null
          id: string
          ip_address: string | null
          module: string
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          enterprise_id?: string | null
          id?: string
          ip_address?: string | null
          module: string
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          enterprise_id?: string | null
          id?: string
          ip_address?: string | null
          module?: string
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      commission_records: {
        Row: {
          commission_amount: number
          commission_rate: number | null
          confirmed_at: string | null
          created_at: string
          enterprise_id: string
          id: string
          paid_at: string | null
          period_month: string
          sales_amount: number
          status: string
          user_id: string
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number | null
          confirmed_at?: string | null
          created_at?: string
          enterprise_id: string
          id?: string
          paid_at?: string | null
          period_month: string
          sales_amount?: number
          status?: string
          user_id: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number | null
          confirmed_at?: string | null
          created_at?: string
          enterprise_id?: string
          id?: string
          paid_at?: string | null
          period_month?: string
          sales_amount?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_records_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          created_at: string
          drug_id: string | null
          enterprise_id: string | null
          id: string
          is_default: boolean
          max_amount: number | null
          min_amount: number | null
          name: string
          rate: number
        }
        Insert: {
          created_at?: string
          drug_id?: string | null
          enterprise_id?: string | null
          id?: string
          is_default?: boolean
          max_amount?: number | null
          min_amount?: number | null
          name: string
          rate: number
        }
        Update: {
          created_at?: string
          drug_id?: string | null
          enterprise_id?: string | null
          id?: string
          is_default?: boolean
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_visits: {
        Row: {
          created_at: string
          customer_id: string
          end_time: string | null
          enterprise_id: string
          follow_up: string | null
          id: string
          latitude: number | null
          longitude: number | null
          next_follow_up: string | null
          purpose: string
          result: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          end_time?: string | null
          enterprise_id: string
          follow_up?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          next_follow_up?: string | null
          purpose: string
          result?: string | null
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          end_time?: string | null
          enterprise_id?: string
          follow_up?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          next_follow_up?: string | null
          purpose?: string
          result?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_visits_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          contact_person: string | null
          contact_name: string | null
          created_at: string
          created_by_id: string | null
          enterprise_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          contact_name?: string | null
          created_at?: string
          created_by_id?: string | null
          enterprise_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          contact_name?: string | null
          created_at?: string
          created_by_id?: string | null
          enterprise_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_deaths: {
        Row: {
          attachment_url: string | null
          created_at: string
          death_date: string
          enterprise_id: string
          fish_pond_id: string
          id: string
          notes: string | null
          quantity: number
          reason: string | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          death_date: string
          enterprise_id: string
          fish_pond_id: string
          id?: string
          notes?: string | null
          quantity: number
          reason?: string | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          death_date?: string
          enterprise_id?: string
          fish_pond_id?: string
          id?: string
          notes?: string | null
          quantity?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_deaths_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_deaths_fish_pond_id_fkey"
            columns: ["fish_pond_id"]
            isOneToOne: false
            referencedRelation: "fish_ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          amount: number
          created_at: string
          debt_id: string
          enterprise_id: string
          id: string
          notes: string | null
          operator_id: string | null
          payment_date: string
          payment_method: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          debt_id: string
          enterprise_id: string
          id?: string
          notes?: string | null
          operator_id?: string | null
          payment_date: string
          payment_method?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          debt_id?: string
          enterprise_id?: string
          id?: string
          notes?: string | null
          operator_id?: string | null
          payment_date?: string
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string
          customer_id: string
          enterprise_id: string
          id: string
          paid_amount: number
          remaining_amount: number
          sign_date: string | null
          sign_image_url: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          enterprise_id: string
          id?: string
          paid_amount?: number
          remaining_amount: number
          sign_date?: string | null
          sign_image_url?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          enterprise_id?: string
          id?: string
          paid_amount?: number
          remaining_amount?: number
          sign_date?: string | null
          sign_image_url?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_inventories: {
        Row: {
          created_at: string
          enterprise_id: string
          id: string
          name: string
          purchase_price: number | null
          safety_stock: number
          sale_price: number | null
          specification: string | null
          status: string
          stock_quantity: number
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enterprise_id: string
          id?: string
          name: string
          purchase_price?: number | null
          safety_stock?: number
          sale_price?: number | null
          specification?: string | null
          status?: string
          stock_quantity?: number
          supplier?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enterprise_id?: string
          id?: string
          name?: string
          purchase_price?: number | null
          safety_stock?: number
          sale_price?: number | null
          specification?: string | null
          status?: string
          stock_quantity?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drug_inventories_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_purchases: {
        Row: {
          created_at: string
          drug_id: string
          enterprise_id: string
          id: string
          notes: string | null
          operator_id: string | null
          purchase_date: string
          quantity: number
          supplier: string
          total_cost: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          drug_id: string
          enterprise_id: string
          id?: string
          notes?: string | null
          operator_id?: string | null
          purchase_date: string
          quantity: number
          supplier: string
          total_cost: number
          unit_price: number
        }
        Update: {
          created_at?: string
          drug_id?: string
          enterprise_id?: string
          id?: string
          notes?: string | null
          operator_id?: string | null
          purchase_date?: string
          quantity?: number
          supplier?: string
          total_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "drug_purchases_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drug_inventories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_purchases_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_records: {
        Row: {
          cost: number | null
          created_at: string
          drug_id: string | null
          drug_name: string
          end_date: string | null
          enterprise_id: string
          fish_pond_id: string
          id: string
          notes: string | null
          operator_id: string | null
          period_days: number | null
          quantity: number
          reason: string | null
          start_date: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          drug_id?: string | null
          drug_name: string
          end_date?: string | null
          enterprise_id: string
          fish_pond_id: string
          id?: string
          notes?: string | null
          operator_id?: string | null
          period_days?: number | null
          quantity: number
          reason?: string | null
          start_date: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          drug_id?: string | null
          drug_name?: string
          end_date?: string | null
          enterprise_id?: string
          fish_pond_id?: string
          id?: string
          notes?: string | null
          operator_id?: string | null
          period_days?: number | null
          quantity?: number
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "drug_records_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_records_fish_pond_id_fkey"
            columns: ["fish_pond_id"]
            isOneToOne: false
            referencedRelation: "fish_ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_sales: {
        Row: {
          created_at: string
          customer_id: string | null
          debt_amount: number
          drug_id: string
          enterprise_id: string
          fish_pond_id: string | null
          id: string
          notes: string | null
          operator_id: string | null
          paid_amount: number
          payment_status: string
          quantity: number
          sale_date: string
          total_amount: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          debt_amount?: number
          drug_id: string
          enterprise_id: string
          fish_pond_id?: string | null
          id?: string
          notes?: string | null
          operator_id?: string | null
          paid_amount?: number
          payment_status?: string
          quantity: number
          sale_date: string
          total_amount: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          debt_amount?: number
          drug_id?: string
          enterprise_id?: string
          fish_pond_id?: string | null
          id?: string
          notes?: string | null
          operator_id?: string | null
          paid_amount?: number
          payment_status?: string
          quantity?: number
          sale_date?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drug_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_sales_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "drug_inventories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_sales_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprises: {
        Row: {
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          status: string
          subscription: string
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string
          subscription?: string
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          subscription?: string
          updated_at?: string
        }
        Relationships: []
      }
      feed_records: {
        Row: {
          bags: number
          brand: string
          created_at: string
          enterprise_id: string
          feed_date: string
          fish_pond_id: string
          id: string
          model: string | null
          notes: string | null
          total_cost: number | null
          unit_price: number | null
        }
        Insert: {
          bags: number
          brand: string
          created_at?: string
          enterprise_id: string
          feed_date: string
          fish_pond_id: string
          id?: string
          model?: string | null
          notes?: string | null
          total_cost?: number | null
          unit_price?: number | null
        }
        Update: {
          bags?: number
          brand?: string
          created_at?: string
          enterprise_id?: string
          feed_date?: string
          fish_pond_id?: string
          id?: string
          model?: string | null
          notes?: string | null
          total_cost?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_records_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_records_fish_pond_id_fkey"
            columns: ["fish_pond_id"]
            isOneToOne: false
            referencedRelation: "fish_ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      field_track_points: {
        Row: {
          accuracy: number | null
          field_track_id: string
          id: string
          latitude: number
          longitude: number
          timestamp: string
        }
        Insert: {
          accuracy?: number | null
          field_track_id: string
          id?: string
          latitude: number
          longitude: number
          timestamp: string
        }
        Update: {
          accuracy?: number | null
          field_track_id?: string
          id?: string
          latitude?: number
          longitude?: number
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_track_points_field_track_id_fkey"
            columns: ["field_track_id"]
            isOneToOne: false
            referencedRelation: "field_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      field_tracks: {
        Row: {
          created_at: string
          duration: number | null
          end_time: string | null
          enterprise_id: string
          id: string
          start_time: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          end_time?: string | null
          enterprise_id: string
          id?: string
          start_time: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          end_time?: string | null
          enterprise_id?: string
          id?: string
          start_time?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_tracks_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_records: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          enterprise_id: string
          id: string
          operator_id: string | null
          record_date: string
          related_id: string | null
          related_type: string | null
          type: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          enterprise_id: string
          id?: string
          operator_id?: string | null
          record_date: string
          related_id?: string | null
          related_type?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          enterprise_id?: string
          id?: string
          operator_id?: string | null
          record_date?: string
          related_id?: string | null
          related_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_records_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      fish_ponds: {
        Row: {
          area: number | null
          created_at: string
          customer_id: string | null
          enterprise_id: string
          fish_species: string | null
          id: string
          name: string
          notes: string | null
          status: string
          stock_date: string | null
          stock_quantity: number | null
          stock_weight: number | null
          updated_at: string
          water_depth: number | null
        }
        Insert: {
          area?: number | null
          created_at?: string
          customer_id?: string | null
          enterprise_id: string
          fish_species?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string
          stock_date?: string | null
          stock_quantity?: number | null
          stock_weight?: number | null
          updated_at?: string
          water_depth?: number | null
        }
        Update: {
          area?: number | null
          created_at?: string
          customer_id?: string | null
          enterprise_id?: string
          fish_species?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string
          stock_date?: string | null
          stock_quantity?: number | null
          stock_weight?: number | null
          updated_at?: string
          water_depth?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fish_ponds_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fish_ponds_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      fish_stockings: {
        Row: {
          created_at: string
          enterprise_id: string
          fish_pond_id: string
          fish_species: string
          id: string
          notes: string | null
          quantity: number
          stock_date: string
          total_cost: number | null
          unit_price: number | null
          weight: number | null
        }
        Insert: {
          created_at?: string
          enterprise_id: string
          fish_pond_id: string
          fish_species: string
          id?: string
          notes?: string | null
          quantity: number
          stock_date: string
          total_cost?: number | null
          unit_price?: number | null
          weight?: number | null
        }
        Update: {
          created_at?: string
          enterprise_id?: string
          fish_pond_id?: string
          fish_species?: string
          id?: string
          notes?: string | null
          quantity?: number
          stock_date?: string
          total_cost?: number | null
          unit_price?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fish_stockings_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fish_stockings_fish_pond_id_fkey"
            columns: ["fish_pond_id"]
            isOneToOne: false
            referencedRelation: "fish_ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices: {
        Row: {
          avg_price: number | null
          created_at: string
          id: string
          max_price: number | null
          min_price: number | null
          price_date: string
          source: string | null
          species: string
          specification: string | null
        }
        Insert: {
          avg_price?: number | null
          created_at?: string
          id?: string
          max_price?: number | null
          min_price?: number | null
          price_date: string
          source?: string | null
          species: string
          specification?: string | null
        }
        Update: {
          avg_price?: number | null
          created_at?: string
          id?: string
          max_price?: number | null
          min_price?: number | null
          price_date?: string
          source?: string | null
          species?: string
          specification?: string | null
        }
        Relationships: []
      }
      market_subscriptions: {
        Row: {
          created_at: string
          end_date: string
          enterprise_id: string | null
          id: string
          plan: string
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          enterprise_id?: string | null
          id?: string
          plan: string
          start_date: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          enterprise_id?: string | null
          id?: string
          plan?: string
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_subscriptions_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_read: boolean
          can_update: boolean
          created_at: string
          id: string
          module: string
          role: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_read?: boolean
          can_update?: boolean
          created_at?: string
          id?: string
          module: string
          role: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_read?: boolean
          can_update?: boolean
          created_at?: string
          id?: string
          module?: string
          role?: string
        }
        Relationships: []
      }
      sale_records: {
        Row: {
          buyer_name: string | null
          created_at: string
          enterprise_id: string
          fish_pond_id: string
          fish_species: string
          id: string
          notes: string | null
          quantity: number
          sale_date: string
          total_amount: number
          unit_price: number
          weight: number
        }
        Insert: {
          buyer_name?: string | null
          created_at?: string
          enterprise_id: string
          fish_pond_id: string
          fish_species: string
          id?: string
          notes?: string | null
          quantity: number
          sale_date: string
          total_amount: number
          unit_price: number
          weight: number
        }
        Update: {
          buyer_name?: string | null
          created_at?: string
          enterprise_id?: string
          fish_pond_id?: string
          fish_species?: string
          id?: string
          notes?: string | null
          quantity?: number
          sale_date?: string
          total_amount?: number
          unit_price?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_records_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_records_fish_pond_id_fkey"
            columns: ["fish_pond_id"]
            isOneToOne: false
            referencedRelation: "fish_ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          employee_id: string | null
          enterprise_id: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          employee_id?: string | null
          enterprise_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          employee_id?: string | null
          enterprise_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
        ]
      }
      water_quality_records: {
        Row: {
          abnormal: boolean
          abnormal_details: string | null
          ammonia: number | null
          created_at: string
          dissolved_oxygen: number | null
          enterprise_id: string
          fish_pond_id: string | null
          id: string
          nitrite: number | null
          operator_id: string | null
          ph: number | null
          record_date: string
          source: string | null
          temperature: number | null
        }
        Insert: {
          abnormal?: boolean
          abnormal_details?: string | null
          ammonia?: number | null
          created_at?: string
          dissolved_oxygen?: number | null
          enterprise_id: string
          fish_pond_id?: string | null
          id?: string
          nitrite?: number | null
          operator_id?: string | null
          ph?: number | null
          record_date: string
          source?: string | null
          temperature?: number | null
        }
        Update: {
          abnormal?: boolean
          abnormal_details?: string | null
          ammonia?: number | null
          created_at?: string
          dissolved_oxygen?: number | null
          enterprise_id?: string
          fish_pond_id?: string | null
          id?: string
          nitrite?: number | null
          operator_id?: string | null
          ph?: number | null
          record_date?: string
          source?: string | null
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "water_quality_records_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_quality_records_fish_pond_id_fkey"
            columns: ["fish_pond_id"]
            isOneToOne: false
            referencedRelation: "fish_ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      water_quality_thresholds: {
        Row: {
          description: string | null
          id: string
          indicator: string
          max_value: number
          min_value: number
          updated_at: string
          warning_max: number | null
          warning_min: number | null
        }
        Insert: {
          description?: string | null
          id?: string
          indicator: string
          max_value: number
          min_value: number
          updated_at?: string
          warning_max?: number | null
          warning_min?: number | null
        }
        Update: {
          description?: string | null
          id?: string
          indicator?: string
          max_value?: number
          min_value?: number
          updated_at?: string
          warning_max?: number | null
          warning_min?: number | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      current_enterprise_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {}
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database } =
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database } =
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database } =
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database } =
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof Database["public"]["CompositeTypes"]
    | { schema: keyof Database } =
    | keyof Database["public"]["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
  ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never
