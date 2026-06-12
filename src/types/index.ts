// AutoGo Partners - Type Definitions

// ============ User & Auth Types ============
export type UserRole = 'winch_driver' | 'workshop_receptionist';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface ServiceProvider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  rating: number;
  totalJobs: number;
  isOnline: boolean;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface WinchDriver extends ServiceProvider {
  role: 'winch_driver';
  licenseNumber: string;
  licensePhoto?: string;
  nationalIdPhoto?: string;
  winchPhoto?: string;
  winchPlateNumber: string;
  currentLocation?: Location;
  serviceRadius: number; // in KM
}

export interface WorkshopReceptionist extends ServiceProvider {
  role: 'workshop_receptionist';
  workshopName: string;
  workshopPhotos: string[];
  commercialRegister?: string;
  location: Location;
  address: string;
  workingHours: WorkingHours;
  services: WorkshopService[];
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface WorkingHours {
  saturday: DayHours;
  sunday: DayHours;
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

// ============ Winch / SOS Types ============
export type WinchJobStatus = 
  | 'pending'
  | 'assigned'
  | 'on_the_way'
  | 'arrived'
  | 'car_picked_up'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface WinchJob {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  driverId: string;
  carType: string;
  carModel: string;
  carColor: string;
  issueType: string;
  pickupLocation: Location;
  dropoffLocation?: Location;
  status: WinchJobStatus;
  estimatedDistance: number; // KM
  estimatedPrice: number; // EGP
  finalPrice?: number;
  beforePhoto?: string;
  afterPhoto?: string;
  createdAt: string;
  completedAt?: string;
}

// ============ Workshop / Maintenance Types ============
export type BookingStatus = 
  | 'pending'
  | 'confirmed'
  | 'car_received'
  | 'inspecting'
  | 'waiting_parts'
  | 'in_repair'
  | 'quality_check'
  | 'ready'
  | 'delivered'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface WorkshopBooking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  workshopId: string;
  carType: string;
  carModel: string;
  carYear: string;
  carPlate: string;
  carColor: string;
  status: BookingStatus;
  scheduledDate: string;
  scheduledTime: string;
  services: ServiceItem[];
  spareParts: SparePartItem[];
  totalServicesPrice: number;
  totalPartsPrice: number;
  totalPrice: number;
  isQuotationApproved: boolean;
  receptionChecklist?: ReceptionChecklist;
  createdAt: string;
  completedAt?: string;
  statusLabel?: string;
  serviceName?: string;
  orderNumber?: string;
}

export interface WorkshopService {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  category: ServiceCategory;
}

export type ServiceCategory = 
  | 'oil_change'
  | 'brakes'
  | 'engine'
  | 'tires'
  | 'electrical'
  | 'ac'
  | 'body_work'
  | 'inspection'
  | 'alignment'
  | 'other';

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  notes?: string;
}

export interface SparePartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  brand?: string;
}

export interface ReceptionChecklist {
  frontPhoto: string;
  backPhoto: string;
  leftPhoto: string;
  rightPhoto: string;
  fuelLevel: 'empty' | 'quarter' | 'half' | 'three_quarter' | 'full';
  scratches: string[];
  notes: string;
  customerSignature?: string;
}

// ============ Wallet / Finance Types ============
export type TransactionType = 'earning' | 'withdrawal' | 'bonus' | 'deduction';
export type PayoutMethod = 'vodafone_cash' | 'instapay' | 'fawry';

export interface WalletBalance {
  available: number;
  pending: number;
  totalEarnings: number;
  currency: 'EGP';
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  reference?: string;
}

export interface PayoutRequest {
  id: string;
  amount: number;
  method: PayoutMethod;
  accountNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

// ============ Chat Types ============
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isQuickReply: boolean;
  timestamp: string;
  isRead: boolean;
}

export const QUICK_REPLIES_AR = [
  'أنا في الطريق يا فندم',
  'دقايق وأكون عندك',
  'وصلت للموقع',
  'السيارة جاهزة للاستلام',
  'محتاج تفاصيل أكتر',
  'هتواصل معاك حالاً',
] as const;

// ============ Navigation Types ============
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  RoleSelection: undefined;
  Login: { role: UserRole };
  OTPVerification: { phone: string; role: UserRole };
  DocumentUpload: { role: UserRole };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Jobs: undefined;
  Wallet: undefined;
  Profile: undefined;
};

export type WinchStackParamList = {
  WinchDashboard: undefined;
  RequestAccept: { job: WinchJob };
  ActiveJob: { jobId: string };
  JobCompletion: { jobId: string };
};

export type WorkshopStackParamList = {
  WorkshopDashboard: undefined;
  BookingCalendar: undefined;
  CarReception: { bookingId: string };
  ProgressUpdate: { bookingId: string };
  Quotation: { bookingId: string };
};

export type CommonStackParamList = {
  Chat: { customerId: string; customerName: string };
  Support: undefined;
  Settings: undefined;
  EditProfile: undefined;
};
