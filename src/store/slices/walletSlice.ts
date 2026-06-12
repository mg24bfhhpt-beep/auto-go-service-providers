import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WalletBalance, Transaction, PayoutRequest } from '../../types';

interface WalletState {
  balance: WalletBalance;
  transactions: Transaction[];
  payoutHistory: PayoutRequest[];
  isLoading: boolean;
}

const initialState: WalletState = {
  balance: {
    available: 3250,
    pending: 450,
    totalEarnings: 28750,
    currency: 'EGP',
  },
  transactions: [
    {
      id: '1',
      type: 'earning',
      amount: 350,
      description: 'خدمة ونش - سحب سيارة من المعادي',
      status: 'completed',
      createdAt: '2026-04-19T10:30:00',
    },
    {
      id: '2',
      type: 'earning',
      amount: 200,
      description: 'خدمة ونش - نقل من مدينة نصر',
      status: 'completed',
      createdAt: '2026-04-19T08:15:00',
    },
    {
      id: '3',
      type: 'withdrawal',
      amount: -1500,
      description: 'سحب - فودافون كاش',
      status: 'completed',
      createdAt: '2026-04-18T14:00:00',
    },
    {
      id: '4',
      type: 'earning',
      amount: 1200,
      description: 'صيانة - تغيير زيت وفلتر',
      status: 'completed',
      createdAt: '2026-04-18T11:00:00',
    },
    {
      id: '5',
      type: 'bonus',
      amount: 100,
      description: 'مكافأة - إتمام 50 رحلة',
      status: 'completed',
      createdAt: '2026-04-17T09:00:00',
    },
  ],
  payoutHistory: [],
  isLoading: false,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    addTransaction(state, action: PayloadAction<Transaction>) {
      state.transactions.unshift(action.payload);
      if (action.payload.type === 'earning') {
        state.balance.available += action.payload.amount;
        state.balance.totalEarnings += action.payload.amount;
      }
    },
    requestPayout(state, action: PayloadAction<PayoutRequest>) {
      state.payoutHistory.unshift(action.payload);
      state.balance.available -= action.payload.amount;
      state.balance.pending += action.payload.amount;
    },
    completePayout(state, action: PayloadAction<string>) {
      const payout = state.payoutHistory.find(p => p.id === action.payload);
      if (payout) {
        payout.status = 'completed';
        state.balance.pending -= payout.amount;
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { addTransaction, requestPayout, completePayout, setLoading } = walletSlice.actions;
export default walletSlice.reducer;
