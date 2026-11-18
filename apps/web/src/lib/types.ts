export interface Localized { fa: string; en?: string }
export interface Variant { _id: string; sku: string; size: number; color: { name: Localized; hex: string }; stock: number }
export interface Named { _id: string; name: Localized; slug: string; image?: string; parent?: string | null; isActive?: boolean }
export interface Product {
  _id: string; title: Localized; slug: string; description?: Localized; brand: Named; category: Named;
  gender: 'men' | 'women' | 'unisex' | 'kids'; material?: string; sole?: string; closureType?: string; season?: string;
  tags: string[]; images: string[]; basePrice: number; discountPercent: number; finalPrice: number; weightGram: number;
  variants: Variant[]; ratingAvg: number; ratingCount: number; soldCount: number; isActive: boolean; createdAt?: string;
}
export interface Paged<T> { items: T[]; total: number; page: number; limit: number; pages?: number }
export interface Address { id: string; title: string; receiver: string; phone: string; province: string; city: string; address: string; postalCode: string; isDefault: boolean }
export interface User {
  id: string; phone?: string; email?: string; firstName?: string; lastName?: string;
  role: 'customer' | 'admin' | 'content' | 'support'; isPhoneVerified: boolean; isEmailVerified: boolean; isActive: boolean; addresses: Address[];
}
export interface CartLine {
  productId: string; sku: string; slug: string; title: Localized; image?: string; size: number;
  color: { name: Localized; hex: string }; unitPrice: number; quantity: number; stock: number;
  available: boolean; lineTotal: number; weightGram: number;
}
export interface CartView { lines: CartLine[]; itemCount: number; subtotal: number; discount: number; couponCode?: string; couponError?: string; totalWeightGram: number }
export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export interface OrderItem { product: string; sku: string; title: Localized; slug?: string; image?: string; size: number; colorName: Localized; colorHex: string; price: number; quantity: number }
export interface Order {
  _id: string; orderNumber: string; items: OrderItem[]; shippingAddress: Omit<Address, 'id' | 'title' | 'isDefault'>;
  shippingMethod: 'pishtaz' | 'tipax'; shippingCost: number; subtotal: number; discountAmount: number; couponCode?: string; total: number;
  status: OrderStatus; paymentStatus: 'unpaid' | 'paid' | 'refunded'; trackingCode?: string; createdAt: string; paidAt?: string;
  expiresAt: string; statusHistory?: { status: OrderStatus; at: string; note?: string }[];
  user?: { phone?: string; email?: string; firstName?: string; lastName?: string } | string;
}
export interface ShippingQuote { method: 'pishtaz' | 'tipax'; cost: number; free: boolean; minDays: number; maxDays: number }
export interface Review { _id: string; rating: number; comment: string; userName: string; createdAt: string }
