// Ambient declarations matching docs/03-data-api-contract.md (v2)
// This enables UI components to typecheck and develop cleanly on agent/frontend
// before Integrator merges agent/workflow into main.

declare module '*/types' {
  export type Role = 'SUPPLIER' | 'CUSTOMER' | 'ADMIN';
  export type OrderStatus =
    | 'PLACED'
    | 'AGGREGATED'
    | 'SUPPLIER_CONFIRMED'
    | 'AT_HUB'
    | 'DISPATCHED'
    | 'DELIVERED';
  export type PaymentStatus = 'UNPAID' | 'PAID';
  export type ShipmentStatus =
    | 'PENDING'
    | 'ASSIGNED'
    | 'IN_TRANSIT'
    | 'DELIVERED';

  export interface DemoSession {
    role: Role;
    activeSupplierId?: string;
    activeCustomerId?: string;
  }

  export type DemoEventType =
    | 'DATA_CHANGED'
    | 'SESSION_CHANGED'
    | 'RESET';

  export interface DemoDataEvent {
    type: DemoEventType;
  }

  export type ServiceErrorCode =
    | 'INSUFFICIENT_STOCK'
    | 'INVALID_STATUS_TRANSITION'
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND';

  export interface ServiceError extends Error {
    code: ServiceErrorCode;
    message: string;
    details?: Record<string, unknown>;
  }

  export interface Supplier {
    id: string;
    name: string;
    phone: string;
    gardenAddress: string;
  }

  export interface Customer {
    id: string;
    businessName: string;
    phone: string;
    taxCode?: string;
    deliveryAddressIds: string[];
  }

  export interface DeliveryAddress {
    id: string;
    customerId: string;
    label: string;
    address: string;
    deliveryZone: string;
  }

  export interface ProductListing {
    id: string;
    supplierId: string;
    name: string;
    variety?: string;
    unit: 'kg';
    availableKg: number;
    basePricePerKg: number;
    imageUrl?: string;
    active: boolean;
  }

  export interface CustomerProduct {
    id: string;
    name: string;
    variety?: string;
    unit: 'kg';
    availableKg: number;
    sellingPricePerKg: number;
    imageUrl?: string;
  }

  export interface OrderItem {
    productId: string;
    productName: string;
    quantityKg: number;
    unitPriceVnd: number;
    lineTotalVnd: number;
  }

  export interface Order {
    id: string;
    customerId: string;
    deliveryAddressId: string;
    items: OrderItem[];
    subtotalVnd: number;
    shippingFeeVnd: number;
    totalVnd: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    placedAt: string;
  }

  export interface CheckoutQuote {
    items: OrderItem[];
    subtotalVnd: number;
    shippingFeeVnd: number;
    totalVnd: number;
  }

  export interface DemandLine {
    productId: string;
    productName: string;
    supplierId: string;
    quantityKg: number;
    orderIds: string[];
  }

  export interface SupplierConfirmation {
    supplierId: string;
    orderIds: string[];
    confirmedAt: string;
    vehiclePlate?: string;
    estimatedArrivalAt?: string;
  }

  export interface Shipment {
    id: string;
    orderIds: string[];
    routeLabel: string;
    driverName?: string;
    driverPhone?: string;
    vehiclePlate?: string;
    status: ShipmentStatus;
    trackingLabel?: string;
  }

  export interface PricingRule {
    mode: 'PERCENT' | 'FIXED_VND_PER_KG';
    value: number;
  }

  export interface NewOrderInput {
    customerId: string;
    deliveryAddressId: string;
    items: {
      productId: string;
      quantityKg: number;
    }[];
  }

  export interface NewProductInput {
    supplierId: string;
    name: string;
    variety?: string;
    availableKg: number;
    basePricePerKg: number;
    imageUrl?: string;
  }
}

declare module '*/services/demoService' {
  import type {
    Role,
    OrderStatus,
    ShipmentStatus,
    DemoSession,
    DemoDataEvent,
    ServiceError,
    Supplier,
    Customer,
    DeliveryAddress,
    ProductListing,
    CustomerProduct,
    Order,
    CheckoutQuote,
    DemandLine,
    SupplierConfirmation,
    Shipment,
    PricingRule,
    NewOrderInput,
    NewProductInput,
  } from '*/types';

  export function getDemoSession(): Promise<DemoSession>;
  export function setDemoSession(session: Partial<DemoSession>): Promise<void>;
  export function getSuppliers(): Promise<Supplier[]>;
  export function getCustomers(): Promise<Customer[]>;
  export function getDemoRole(): Promise<Role>;
  export function setDemoRole(role: Role): Promise<void>;

  export function subscribeDemoData(listener: (event: DemoDataEvent) => void): () => void;
  export function isServiceError(error: unknown): error is ServiceError;
  export function resetDemoData(): Promise<void>;

  export function getSupplierListings(supplierId: string): Promise<ProductListing[]>;
  export function createProduct(input: NewProductInput): Promise<ProductListing>;
  export function getSupplierDemand(supplierId: string): Promise<DemandLine[]>;
  export function confirmSupplierDemand(input: {
    supplierId: string;
    orderIds: string[];
    vehiclePlate?: string;
    estimatedArrivalAt?: string;
  }): Promise<SupplierConfirmation>;

  export function getCustomerCatalog(): Promise<CustomerProduct[]>;
  export function getDeliveryAddresses(customerId: string): Promise<DeliveryAddress[]>;
  export function quoteCheckout(input: NewOrderInput): Promise<CheckoutQuote>;
  export function placeOrder(input: NewOrderInput): Promise<Order>;
  export function getCustomerOrders(customerId: string): Promise<Order[]>;
  export function getShipmentByOrderId(orderId: string): Promise<Shipment | null>;

  export function getPricingRule(): Promise<PricingRule>;
  export function updatePricingRule(rule: PricingRule): Promise<PricingRule>;
  export function getAllOrders(): Promise<Order[]>;
  export function aggregateDemand(): Promise<DemandLine[]>;
  export function advanceOrderStatus(orderId: string, next: OrderStatus): Promise<Order>;
  export function getSupplierConfirmations(): Promise<SupplierConfirmation[]>;
  export function getShipments(): Promise<Shipment[]>;
  export function assignDemoShipment(input: {
    orderIds: string[];
    routeLabel: string;
  }): Promise<Shipment>;
  export function advanceShipmentStatus(id: string, next: ShipmentStatus): Promise<Shipment>;
}
