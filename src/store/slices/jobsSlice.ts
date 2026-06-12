import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { ApiError } from '../../api/apiClient';
import { providerApi } from '../../services/providerApi';
import { WinchJob, WorkshopBooking, WinchJobStatus, BookingStatus } from '../../types';

// Lightweight shape the winch UI cards consume (maps a backend tow order)
export interface WinchRequest {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  carType: string;
  location: string;
  issueType: string;
  estimatedPrice: number;
  distance: number;
  timeAgo: string;
  status: string;
}

interface JobsState {
  activeWinchJob: WinchJob | null;
  winchHistory: WinchJob[];
  incomingRequest: WinchJob | null;
  winchRequests: WinchRequest[];
  activeWinchRequest: WinchRequest | null;
  winchLoading: boolean;
  winchError: string | null;
  activeBookings: WorkshopBooking[];
  bookingHistory: WorkshopBooking[];
  todayBookings: WorkshopBooking[];
  todayEarnings: number;
  todayJobCount: number;
  weeklyEarnings: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: JobsState = {
  activeWinchJob: null,
  winchHistory: [],
  incomingRequest: null,
  winchRequests: [],
  activeWinchRequest: null,
  winchLoading: false,
  winchError: null,
  activeBookings: [],
  bookingHistory: [],
  todayBookings: [],
  todayEarnings: 0,
  todayJobCount: 0,
  weeklyEarnings: 0,
  isLoading: false,
  error: null,
};

function timeAgo(value: unknown): string {
  if (!value) return 'الآن';
  const created = new Date(String(value)).getTime();
  if (Number.isNaN(created)) return 'الآن';
  const mins = Math.max(0, Math.round((Date.now() - created) / 60000));
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.round(mins / 60);
  return `منذ ${hrs} ساعة`;
}

function mapOrderToWinchRequest(raw: Record<string, unknown>): WinchRequest {
  const user = raw.user as Record<string, unknown> | undefined;
  const car = raw.car as Record<string, unknown> | undefined;
  return {
    id: String(raw.id),
    orderNumber: String(raw.orderNumber || ''),
    customerName: String(user?.name || 'عميل'),
    customerPhone: String(user?.phone || ''),
    carType: car ? `${car.brand || ''} ${car.model || ''}`.trim() || 'سيارة العميل' : 'سيارة العميل',
    location: String(raw.pickupAddress || 'الموقع المحدد'),
    issueType: String(raw.notes || 'طلب ونش إنقاذ'),
    estimatedPrice: Number(raw.price || raw.total || 0),
    distance: Number(raw.distanceKm || 3.2),
    timeAgo: timeAgo(raw.createdAt),
    status: String(raw.status || 'pending'),
  };
}

export const fetchWinchRequests = createAsyncThunk(
  'jobs/fetchWinchRequests',
  async (_: void, { rejectWithValue }) => {
    try {
      const res = await providerApi.getPendingRequests();
      return (res.data || []).map((item: Record<string, unknown>) => mapOrderToWinchRequest(item));
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'فشل تحميل الطلبات';
      return rejectWithValue(message);
    }
  }
);

export const acceptWinchOrder = createAsyncThunk(
  'jobs/acceptWinchOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      await providerApi.acceptOrder(orderId);
      return orderId;
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'تعذر قبول الطلب';
      return rejectWithValue(message);
    }
  }
);

export const rejectWinchOrder = createAsyncThunk(
  'jobs/rejectWinchOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      await providerApi.rejectOrder(orderId);
      return orderId;
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'تعذر رفض الطلب';
      return rejectWithValue(message);
    }
  }
);

export const updateWinchOrderStatus = createAsyncThunk(
  'jobs/updateWinchOrderStatus',
  async ({ orderId, status, notes }: { orderId: string; status: string; notes?: string }, { rejectWithValue }) => {
    try {
      await providerApi.updateStatus(orderId, status, notes);
      return { orderId, status };
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'تعذر تحديث حالة الطلب';
      return rejectWithValue(message);
    }
  }
);

const STATUS_LABELS: Record<string, string> = {
  pending: 'في الانتظار',
  confirmed: 'مؤكد',
  in_progress: 'جاري العمل',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

function formatTime(value: unknown): string {
  if (!value) return '--:--';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function mapOrderToBooking(raw: Record<string, unknown>): WorkshopBooking {
  const user = raw.user as Record<string, unknown> | undefined;
  const car = raw.car as Record<string, unknown> | undefined;
  const service = raw.service as Record<string, unknown> | undefined;
  const status = String(raw.status || 'pending') as BookingStatus;

  return {
    id: String(raw.id),
    customerId: String(user?.id || ''),
    customerName: String(user?.name || 'عميل'),
    customerPhone: String(user?.phone || ''),
    workshopId: String(raw.workshopId || ''),
    carType: car ? `${car.brand} ${car.model}` : 'سيارة',
    carModel: car ? String(car.model) : '',
    carYear: car ? String(car.year) : '',
    carPlate: car ? String(car.plate) : '',
    carColor: car ? String(car.color || '') : '',
    status,
    scheduledDate: raw.scheduledDate ? String(raw.scheduledDate).slice(0, 10) : '',
    scheduledTime: formatTime(raw.scheduledTime),
    services: service
      ? [{ id: String(service.id), name: String(service.name), price: Number(raw.price || service.basePrice || 0), quantity: 1 }]
      : [],
    spareParts: [],
    totalServicesPrice: Number(raw.price || 0),
    totalPartsPrice: 0,
    totalPrice: Number(raw.total || raw.price || 0),
    isQuotationApproved: false,
    createdAt: raw.createdAt ? String(raw.createdAt) : new Date().toISOString(),
    statusLabel: STATUS_LABELS[status] || status,
    serviceName: service ? String(service.name) : 'صيانة',
    orderNumber: String(raw.orderNumber || ''),
  };
}

export const fetchWorkshopOrders = createAsyncThunk(
  'jobs/fetchWorkshopOrders',
  async (status: 'active' | 'pending' | 'completed' | 'all' = 'active', { rejectWithValue }) => {
    try {
      const res = await api.get(`/workshop/orders?status=${status}`);
      return (res.data || []).map((item: Record<string, unknown>) => mapOrderToBooking(item));
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'فشل تحميل الحجوزات';
      return rejectWithValue(message);
    }
  }
);

export const updateWorkshopOrderStatus = createAsyncThunk(
  'jobs/updateWorkshopOrderStatus',
  async ({ orderId, status }: { orderId: string; status: BookingStatus }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/workshop/orders/${orderId}/status`, { status });
      return mapOrderToBooking(res.data);
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'فشل تحديث حالة الحجز';
      return rejectWithValue(message);
    }
  }
);

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setIncomingRequest(state, action: PayloadAction<WinchJob | null>) {
      state.incomingRequest = action.payload;
    },
    acceptWinchJob(state, action: PayloadAction<WinchJob>) {
      state.activeWinchJob = action.payload;
      state.incomingRequest = null;
    },
    updateWinchJobStatus(state, action: PayloadAction<WinchJobStatus>) {
      if (state.activeWinchJob) {
        state.activeWinchJob.status = action.payload;
      }
    },
    completeWinchJob(state) {
      if (state.activeWinchJob) {
        state.activeWinchJob.status = 'completed';
        state.winchHistory.unshift(state.activeWinchJob);
        state.todayEarnings += state.activeWinchJob.finalPrice || state.activeWinchJob.estimatedPrice;
        state.todayJobCount += 1;
        state.activeWinchJob = null;
      }
    },
    rejectWinchJob(state) {
      state.incomingRequest = null;
    },
    setActiveWinchRequest(state, action: PayloadAction<WinchRequest | null>) {
      state.activeWinchRequest = action.payload;
    },
    setActiveBookings(state, action: PayloadAction<WorkshopBooking[]>) {
      state.activeBookings = action.payload;
    },
    setTodayBookings(state, action: PayloadAction<WorkshopBooking[]>) {
      state.todayBookings = action.payload;
    },
    updateBookingStatus(state, action: PayloadAction<{ bookingId: string; status: BookingStatus }>) {
      const idx = state.activeBookings.findIndex((b) => b.id === action.payload.bookingId);
      if (idx !== -1) {
        state.activeBookings[idx].status = action.payload.status;
      }
      const todayIdx = state.todayBookings.findIndex((b) => b.id === action.payload.bookingId);
      if (todayIdx !== -1) {
        state.todayBookings[todayIdx].status = action.payload.status;
      }
    },
    completeBooking(state, action: PayloadAction<string>) {
      const idx = state.activeBookings.findIndex((b) => b.id === action.payload);
      if (idx !== -1) {
        const booking = state.activeBookings[idx];
        booking.status = 'completed';
        state.bookingHistory.unshift(booking);
        state.activeBookings.splice(idx, 1);
        state.todayEarnings += booking.totalPrice;
        state.todayJobCount += 1;
      }
    },
    setDailyStats(state, action: PayloadAction<{ earnings: number; jobCount: number }>) {
      state.todayEarnings = action.payload.earnings;
      state.todayJobCount = action.payload.jobCount;
    },
    setWeeklyEarnings(state, action: PayloadAction<number>) {
      state.weeklyEarnings = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWinchRequests.pending, (state) => {
        state.winchLoading = true;
        state.winchError = null;
      })
      .addCase(fetchWinchRequests.fulfilled, (state, action) => {
        state.winchLoading = false;
        state.winchRequests = action.payload;
      })
      .addCase(fetchWinchRequests.rejected, (state, action) => {
        state.winchLoading = false;
        state.winchError = String(action.payload || action.error.message);
      })
      .addCase(acceptWinchOrder.fulfilled, (state, action) => {
        const orderId = action.payload;
        state.activeWinchRequest =
          state.winchRequests.find((r) => r.id === orderId) || state.activeWinchRequest;
        state.winchRequests = state.winchRequests.filter((r) => r.id !== orderId);
      })
      .addCase(rejectWinchOrder.fulfilled, (state, action) => {
        state.winchRequests = state.winchRequests.filter((r) => r.id !== action.payload);
      })
      .addCase(updateWinchOrderStatus.fulfilled, (state, action) => {
        if (state.activeWinchRequest && state.activeWinchRequest.id === action.payload.orderId) {
          state.activeWinchRequest.status = action.payload.status;
        }
        if (action.payload.status === 'completed') {
          state.todayJobCount += 1;
          if (state.activeWinchRequest) {
            state.todayEarnings += state.activeWinchRequest.estimatedPrice || 0;
          }
        }
      })
      .addCase(fetchWorkshopOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkshopOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todayBookings = action.payload;
        state.activeBookings = action.payload.filter((b) => b.status !== 'completed' && b.status !== 'cancelled');
        state.todayJobCount = action.payload.length;
        state.todayEarnings = action.payload.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      })
      .addCase(fetchWorkshopOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = String(action.payload || action.error.message);
      })
      .addCase(updateWorkshopOrderStatus.fulfilled, (state, action) => {
        const booking = action.payload;
        const replaceInList = (list: WorkshopBooking[]) => {
          const idx = list.findIndex((b) => b.id === booking.id);
          if (idx === -1) return;
          if (booking.status === 'completed' || booking.status === 'cancelled') {
            list.splice(idx, 1);
          } else {
            list[idx] = booking;
          }
        };

        replaceInList(state.todayBookings);
        replaceInList(state.activeBookings);

        if (booking.status === 'completed') {
          state.bookingHistory.unshift(booking);
        }
      });
  },
});

export const {
  setIncomingRequest,
  acceptWinchJob,
  updateWinchJobStatus,
  completeWinchJob,
  rejectWinchJob,
  setActiveWinchRequest,
  setActiveBookings,
  setTodayBookings,
  updateBookingStatus,
  completeBooking,
  setDailyStats,
  setWeeklyEarnings,
} = jobsSlice.actions;

export default jobsSlice.reducer;
