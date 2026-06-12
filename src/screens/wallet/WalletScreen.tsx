import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { requestPayout, addTransaction } from '../../store/slices/walletSlice';

interface Props {
  navigation?: any;
}

const PAYOUT_METHODS = [
  { key: 'vodafone_cash', label: 'فودافون كاش', icon: 'cellphone' as const, color: '#E60000' },
  { key: 'instapay', label: 'إنستا باي', icon: 'bank-outline' as const, color: '#4A90D9' },
  { key: 'fawry', label: 'فوري', icon: 'credit-card-outline' as const, color: '#F5A623' },
];

const WalletScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const wallet = useAppSelector((state) => state.wallet);
  const insets = useSafeAreaInsets();
  
  const [selectedMethod, setSelectedMethod] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);

  const handleWithdraw = () => {
    if (!selectedMethod || !withdrawAmount) {
      Alert.alert('تنبيه', 'اختار طريقة السحب وحدد المبلغ');
      return;
    }
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('تنبيه', 'المبلغ غير صحيح');
      return;
    }
    if (amount > wallet.balance.available) {
      Alert.alert('تنبيه', 'المبلغ أكبر من الرصيد المتاح');
      return;
    }
    
    const methodName = PAYOUT_METHODS.find(m => m.key === selectedMethod)?.label || '';
    
    dispatch(requestPayout({
      id: Math.random().toString(),
      amount: amount,
      method: selectedMethod as 'vodafone_cash' | 'instapay' | 'fawry',
      accountNumber: '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }));

    dispatch(addTransaction({
      id: Math.random().toString(),
      type: 'withdrawal',
      amount: -amount,
      description: `سحب رصيد عبر ${methodName}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }));

    Alert.alert('تم بنجاح', `تم إرسال طلب سحب ${amount} ج.م عبر ${methodName}`);
    setShowWithdraw(false);
    setWithdrawAmount('');
    setSelectedMethod('');
  };

  const getTransactionIcon = (type: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (type) {
      case 'earning': return 'cash-plus';
      case 'withdrawal': return 'cash-minus';
      case 'bonus': return 'gift-outline';
      case 'deduction': return 'trending-down';
      default: return 'cash';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earning': return colors.status.success;
      case 'withdrawal': return colors.status.error;
      case 'bonus': return colors.accent.primary;
      case 'deduction': return colors.status.error;
      default: return colors.text.primary;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      <LinearGradient colors={['#0A1520', '#0D2B2D', '#0A1520']} style={styles.gradient}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing['2xl'] }}>
            <MaterialCommunityIcons name="wallet-outline" size={28} color={colors.accent.primary} />
            <Text style={[styles.headerTitle, { marginBottom: 0 }]}>المحفظة</Text>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={['rgba(212,160,86,0.15)', 'rgba(13,43,45,0.6)']}
              style={styles.balanceGradient}
            >
              <Text style={styles.balanceLabel}>الرصيد المتاح</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceAmount}>
                  {wallet.balance.available.toLocaleString('ar-EG')}
                </Text>
                <Text style={styles.balanceCurrency}>ج.م</Text>
              </View>
              <View style={styles.balanceSubRow}>
                <View style={styles.balanceSubItem}>
                  <Text style={styles.balanceSubLabel}>قيد التحصيل</Text>
                  <Text style={[styles.balanceSubValue, { color: colors.status.warning }]}>
                    {wallet.balance.pending} ج.م
                  </Text>
                </View>
                <View style={styles.balanceSubDivider} />
                <View style={styles.balanceSubItem}>
                  <Text style={styles.balanceSubLabel}>إجمالي الأرباح</Text>
                  <Text style={[styles.balanceSubValue, { color: colors.status.success }]}>
                    {wallet.balance.totalEarnings.toLocaleString('ar-EG')} ج.م
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.withdrawButton}
                onPress={() => setShowWithdraw(!showWithdraw)}
              >
                <Text style={styles.withdrawButtonText}>
                  {showWithdraw ? 'إلغاء' : 'سحب الرصيد'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Withdraw Section */}
          {showWithdraw && (
            <View style={styles.withdrawSection}>
              <Text style={styles.withdrawTitle}>اختار طريقة السحب</Text>
              <View style={styles.methodsRow}>
                {PAYOUT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method.key}
                    style={[
                      styles.methodCard,
                      selectedMethod === method.key && styles.methodCardSelected,
                    ]}
                    onPress={() => setSelectedMethod(method.key)}
                  >
                    <MaterialCommunityIcons 
                      name={method.icon} 
                      size={24} 
                      color={selectedMethod === method.key ? colors.accent.primary : '#8A99A8'} 
                    />
                    <Text style={[
                      styles.methodLabel,
                      selectedMethod === method.key && { color: colors.accent.primary },
                    ]}>
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.amountContainer}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="المبلغ بالجنيه المصري"
                  placeholderTextColor={colors.input.placeholder}
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <Text style={styles.amountCurrency}>ج.م</Text>
              </View>

              <TouchableOpacity style={styles.confirmWithdrawButton} onPress={handleWithdraw}>
                <LinearGradient colors={['#D4A056', '#C4842D']} style={styles.confirmWithdrawGradient}>
                  <Text style={styles.confirmWithdrawText}>تأكيد السحب</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Transactions */}
          <View style={styles.transactionsSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.lg }}>
              <MaterialCommunityIcons name="file-document-edit-outline" size={20} color={colors.accent.primary} />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>سجل المعاملات</Text>
            </View>
            {wallet.transactions.map((tx) => (
              <View key={tx.id} style={styles.transactionRow}>
                <View style={styles.txIconContainer}>
                  <MaterialCommunityIcons name={getTransactionIcon(tx.type)} size={18} color={getTransactionColor(tx.type)} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDescription}>{tx.description}</Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.createdAt).toLocaleDateString('ar-EG')}
                  </Text>
                </View>
                <Text style={[styles.txAmount, { color: getTransactionColor(tx.type) }]}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} ج.م
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  gradient: { flex: 1 },
  scrollContent: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing['2xl'],
  },
  // Balance
  balanceCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(212,160,86,0.2)',
  },
  balanceGradient: {
    padding: spacing.xl,
  },
  balanceLabel: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text.primary,
  },
  balanceCurrency: {
    ...typography.h4,
    color: colors.accent.primary,
  },
  balanceSubRow: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  balanceSubItem: { flex: 1 },
  balanceSubDivider: {
    width: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.lg,
  },
  balanceSubLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: 2,
  },
  balanceSubValue: {
    ...typography.label,
    color: colors.text.primary,
  },
  withdrawButton: {
    backgroundColor: 'rgba(212,160,86,0.15)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212,160,86,0.3)',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  withdrawButtonText: {
    ...typography.label,
    color: colors.accent.primary,
  },
  // Withdraw
  withdrawSection: {
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.background.glassBorder,
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  withdrawTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  methodCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: spacing.sm,
  },
  methodCardSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: 'rgba(212,160,86,0.08)',
  },
  methodIcon: { fontSize: 24 },
  methodLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  amountInput: {
    flex: 1,
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.input.border,
    height: 52,
    ...typography.h4,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
  },
  amountCurrency: {
    ...typography.h4,
    color: colors.accent.primary,
  },
  confirmWithdrawButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  confirmWithdrawGradient: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmWithdrawText: {
    ...typography.button,
    color: colors.background.primary,
  },
  // Transactions
  transactionsSection: { marginBottom: spacing['2xl'] },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIcon: { fontSize: 18 },
  txInfo: { flex: 1 },
  txDescription: { ...typography.bodySmall, color: colors.text.primary },
  txDate: { ...typography.caption, color: colors.text.muted },
  txAmount: { ...typography.label },
});

export default WalletScreen;
