import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { saveTokens, clearTokens, ApiError } from '../../api/apiClient';
import { formatEgyptPhone } from '../../utils/phone';
import { ServiceProvider, UserRole, VerificationStatus } from '../../types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  provider: ServiceProvider | null;
  selectedRole: UserRole | null;
  phone: string;
  verificationStatus: VerificationStatus | null;
  isOnboarded: boolean;
  workshopId: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  provider: null,
  selectedRole: null,
  phone: '',
  verificationStatus: null,
  isOnboarded: false,
  workshopId: null,
};

function mapWorkshopProvider(apiUser: Record<string, unknown>, role: UserRole): ServiceProvider {
  const workshop = apiUser.workshop as Record<string, unknown> | null | undefined;

  return {
    id: String(apiUser.id),
    name: String(apiUser.name || workshop?.name || 'مركز الصيانة'),
    phone: String(apiUser.phone || ''),
    email: apiUser.email ? String(apiUser.email) : undefined,
    role,
    rating: Number(workshop?.rating ?? 4.8),
    totalJobs: 0,
    isOnline: Boolean(workshop?.isOpen ?? true),
    isVerified: true,
    verificationStatus: 'approved',
    createdAt: new Date().toISOString(),
  };
}

export const sendProviderOTP = createAsyncThunk(
  'auth/sendProviderOTP',
  async (phone: string) => {
    const formattedPhone = formatEgyptPhone(phone);
    try {
      await api.post('/auth/send-otp', { phone: formattedPhone });
    } catch {
      // Dev mode: OTP UI still works if backend is offline
    }
    return formattedPhone;
  }
);

export const verifyWorkshopOTP = createAsyncThunk(
  'auth/verifyWorkshopOTP',
  async (
    { phone, otp, role }: { phone: string; otp: string; role: UserRole },
    { rejectWithValue }
  ) => {
    try {
      if (otp.length !== 4) {
        return rejectWithValue('الرمز يجب أن يكون 4 أرقام');
      }

      const formattedPhone = formatEgyptPhone(phone);
      const res = await api.post('/auth/verify-otp', {
        phone: formattedPhone,
        otp,
        app: 'provider',
        role,
      });

      const { accessToken, refreshToken, user } = res.data;

      if (!accessToken || !refreshToken) {
        return rejectWithValue('استجابة غير صالحة من الخادم');
      }

      await saveTokens(accessToken, refreshToken);

      return {
        provider: mapWorkshopProvider(user, role),
        workshopId: user.workshopId ? String(user.workshopId) : null,
        phone: formattedPhone,
        role,
      };
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'تعذر الاتصال بالخادم. تأكد أن autogo-backend يعمل على المنفذ 5001';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRole(state, action: PayloadAction<UserRole>) {
      state.selectedRole = action.payload;
    },
    setPhone(state, action: PayloadAction<string>) {
      state.phone = action.payload;
    },
    loginSuccess(state, action: PayloadAction<ServiceProvider>) {
      state.isAuthenticated = true;
      state.provider = action.payload;
      state.verificationStatus = action.payload.verificationStatus;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.provider = null;
      state.selectedRole = null;
      state.phone = '';
      state.verificationStatus = null;
      state.workshopId = null;
      state.error = null;
      clearTokens();
    },
    setVerificationStatus(state, action: PayloadAction<VerificationStatus>) {
      state.verificationStatus = action.payload;
      if (state.provider) {
        state.provider.verificationStatus = action.payload;
        state.provider.isVerified = action.payload === 'approved';
      }
    },
    toggleOnline(state) {
      if (state.provider) {
        state.provider.isOnline = !state.provider.isOnline;
      }
    },
    setOnboarded(state) {
      state.isOnboarded = true;
    },
    updateProfile(state, action: PayloadAction<Partial<ServiceProvider>>) {
      if (state.provider) {
        state.provider = { ...state.provider, ...action.payload };
      }
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendProviderOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendProviderOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.phone = action.payload;
      })
      .addCase(sendProviderOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = String(action.payload || action.error.message);
      })
      .addCase(verifyWorkshopOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyWorkshopOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.provider = action.payload.provider;
        state.workshopId = action.payload.workshopId;
        state.phone = action.payload.phone;
        state.selectedRole = action.payload.role;
        state.verificationStatus = 'approved';
      })
      .addCase(verifyWorkshopOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = String(action.payload || action.error.message);
      });
  },
});

export const {
  setRole,
  setPhone,
  loginSuccess,
  logout,
  setVerificationStatus,
  toggleOnline,
  setOnboarded,
  updateProfile,
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;
