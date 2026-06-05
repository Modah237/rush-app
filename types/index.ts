export type UserRole = 'client' | 'vendor' | 'courier' | 'admin';
export type CourierVerificationStatus = 'pending' | 'verified' | 'rejected';
export type ShopSubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled';
export type VehicleType = 'moto' | 'car' | 'other';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'payment_pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'mtn' | 'orange' | 'cash';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  default_address: string | null;
  
  // Spécifique Livreur
  courier_verification: CourierVerificationStatus;
  id_card_url: string | null;
  address_proof_url: string | null;
  criminal_record_url: string | null;
  vehicle_type: VehicleType | null;
  vehicle_plate: string | null;
  is_available: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  delivery_fee: number;
  is_active: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  min_order_amount: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  expiration_date: string | null;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  eta_minutes: number;
  delivery_fee: number;
  rating: number;
  reviews_count: number;
  distance: string | null;
  glyph: string;
  tint: string;
  promo: string | null;
  badge: string | null;
  is_active: boolean;
  subscription_status: ShopSubscriptionStatus;
  subscription_expires_at: string | null;
  created_at: string;
  cover_image_url?: string | null;
  logo_url?: string | null;
}

export interface Category {
  id: string;
  slug: string;
  label: string;
  glyph: string;
  tint: string;
  ink: string;
  display_order: number;
}

export interface Product {
  id: string;
  shop_id: string;
  category_id: string | null;
  name: string;
  sub: string | null;
  price: number;
  old_price: number | null;
  rating: number;
  sold_count: string;
  glyph: string;
  tag: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  image_url?: string | null;
  thumbnail_url?: string | null;
  gallery?: string[];
  alt_text?: string;
  fallback_icon?: string;
  
  // Jointures optionnelles
  shop_name?: string;
  category_slug?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_delta: number;
  stock: number;
  is_active: boolean;
}

export interface CartItem {
  key: string; // ex: product_id:variant_id ou product_id
  id: string; // product_id
  variant_id: string | null;
  name: string;
  sub: string | null;
  glyph: string;
  cat: string;
  unit: number; // prix de base + price_delta
  qty: number;
  optName: string | null; // nom de la variante
}

export interface Order {
  id: string;
  user_id: string | null;
  shop_id: string | null;
  courier_id: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  delivery_address: string;
  delivery_phone: string;
  courier_name: string | null;
  courier_phone: string | null;
  eta_minutes: number | null;
  note: string | null;
  delivery_zone_id: string | null;
  promo_code_id: string | null;
  created_at: string;
  updated_at: string;
  
  // Jointures
  shop_name?: string;
  courier_full_name?: string;
  client_full_name?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Payment {
  id: string;
  order_id: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  amount: number;
  transaction_reference: string | null;
  created_at: string;
}

export interface OrderStatusEvent {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
}
