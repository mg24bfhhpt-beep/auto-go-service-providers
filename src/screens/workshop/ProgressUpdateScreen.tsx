import React, { useState, useRef } from 'react';
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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useAppDispatch } from '../../hooks';
import { updateWorkshopOrderStatus } from '../../store/slices/jobsSlice';

interface Props {
  navigation?: any;
  route?: { params: { bookingId: string } };
}

interface ServiceItemLocal {
  id: string;
  name: string;
  price: string;
}

interface PartItemLocal {
  id: string;
  name: string;
  quantity: string;
  unitPrice: string;
}

const STATUSES = [
  { key: 'inspecting', label: 'جاري الفحص', icon: 'magnify' as const },
  { key: 'waiting_parts', label: 'في انتظار قطع الغيار', icon: 'package-variant' as const },
  { key: 'in_repair', label: 'جاري الإصلاح', icon: 'wrench' as const },
  { key: 'quality_check', label: 'فحص الجودة', icon: 'clipboard-check-outline' as const },
  { key: 'ready', label: 'جاهزة للاستلام', icon: 'car' as const },
];

const ProgressUpdateScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const bookingId = route?.params?.bookingId || '';
  const [currentStatus, setCurrentStatus] = useState(0);
  const [services, setServices] = useState<ServiceItemLocal[]>([
    { id: '1', name: 'تغيير زيت موتور', price: '250' },
    { id: '2', name: 'تغيير فلتر زيت', price: '80' },
  ]);
  const [parts, setParts] = useState<PartItemLocal[]>([
    { id: '1', name: 'زيت موتور كاسترول 5W-30', quantity: '4', unitPrice: '150' },
    { id: '2', name: 'فلتر زيت أصلي', quantity: '1', unitPrice: '120' },
  ]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState('');
  const [newPartPrice, setNewPartPrice] = useState('');
  const [quotationSent, setQuotationSent] = useState(false);
  const [quotationApproved, setQuotationApproved] = useState(false);

  const totalServicesPrice = services.reduce((sum, s) => sum + (parseInt(s.price) || 0), 0);
  const totalPartsPrice = parts.reduce((sum, p) => sum + (parseInt(p.unitPrice) || 0) * (parseInt(p.quantity) || 0), 0);
  const totalPrice = totalServicesPrice + totalPartsPrice;

  const addService = () => {
    if (newServiceName && newServicePrice) {
      setServices([...services, {
        id: Date.now().toString(),
        name: newServiceName,
        price: newServicePrice,
      }]);
      setNewServiceName('');
      setNewServicePrice('');
    }
  };

  const addPart = () => {
    if (newPartName && newPartPrice && newPartQty) {
      setParts([...parts, {
        id: Date.now().toString(),
        name: newPartName,
        quantity: newPartQty,
        unitPrice: newPartPrice,
      }]);
      setNewPartName('');
      setNewPartQty('');
      setNewPartPrice('');
    }
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const removePart = (id: string) => {
    setParts(parts.filter(p => p.id !== id));
  };

  const handleSendQuotation = () => {
    setQuotationSent(true);
    Alert.alert('تم الإرسال', 'تم إرسال عرض السعر للعميل وفي انتظار الموافقة');
    // Mock: auto-approve after a delay
    setTimeout(() => setQuotationApproved(true), 2000);
  };

  const completeLock = useRef(false);
  const handleStatusUpdate = async () => {
    if (currentStatus < STATUSES.length - 1) {
      setCurrentStatus(currentStatus + 1);
      return;
    }

    if (completeLock.current) return;
    completeLock.current = true;
    try {
      if (bookingId) {
        const result = await dispatch(updateWorkshopOrderStatus({ orderId: bookingId, status: 'completed' }));
        if (updateWorkshopOrderStatus.rejected.match(result)) {
          Alert.alert('خطأ', String(result.payload || 'فشل إكمال الحجز'));
          completeLock.current = false;
          return;
        }
      }

      Alert.alert('تم بنجاح', 'السيارة جاهزة! تم إبلاغ العميل.');
      navigation.popToTop();
    } catch {
      completeLock.current = false;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      <LinearGradient colors={['#0A1520', '#0D2B2D', '#0A1520']} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-forward" size={20} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>إدارة الصيانة</Text>
          </View>

          {/* Status Progress */}
          <View style={styles.statusSection}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="chart-bar" size={20} color={colors.accent.primary} />
              <Text style={styles.sectionTitle}>حالة العمل</Text>
            </View>
            <View style={styles.statusBar}>
              {STATUSES.map((status, index) => (
                <View key={status.key} style={styles.statusItem}>
                  <View style={[
                    styles.statusDot,
                    index <= currentStatus && styles.statusDotActive,
                    index === currentStatus && styles.statusDotCurrent,
                  ]}>
                    {index < currentStatus ? (
                      <MaterialCommunityIcons
                        name="check"
                        size={16}
                        color={colors.status.success}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={status.icon}
                        size={16}
                        color={
                          index === currentStatus
                            ? colors.accent.primary
                            : colors.text.muted
                        }
                      />
                    )}
                  </View>
                  <Text style={[
                    styles.statusLabel,
                    index <= currentStatus && styles.statusLabelActive,
                  ]}>
                    {status.label}
                  </Text>
                  {index < STATUSES.length - 1 && (
                    <View style={[
                      styles.statusLine,
                      index < currentStatus && styles.statusLineActive,
                    ]} />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Services Section */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="wrench" size={20} color={colors.accent.primary} />
              <Text style={styles.sectionTitle}>الخدمات (المصنعية)</Text>
            </View>
            {services.map((service) => (
              <View key={service.id} style={styles.itemRow}>
                <TouchableOpacity onPress={() => removeService(service.id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.itemName}>{service.name}</Text>
                <Text style={styles.itemPrice}>{service.price} ج.م</Text>
              </View>
            ))}
            {/* Add Service */}
            <View style={styles.addRow}>
              <TextInput
                style={[styles.addInput, { flex: 2 }]}
                placeholder="اسم الخدمة..."
                placeholderTextColor={colors.input.placeholder}
                value={newServiceName}
                onChangeText={setNewServiceName}
                textAlign="right"
              />
              <TextInput
                style={[styles.addInput, { flex: 1 }]}
                placeholder="السعر"
                placeholderTextColor={colors.input.placeholder}
                value={newServicePrice}
                onChangeText={setNewServicePrice}
                keyboardType="numeric"
                textAlign="center"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addService}>
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Parts Section */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="package-variant" size={20} color={colors.accent.primary} />
              <Text style={styles.sectionTitle}>قطع الغيار</Text>
            </View>
            {parts.map((part) => (
              <View key={part.id} style={styles.itemRow}>
                <TouchableOpacity onPress={() => removePart(part.id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.itemName}>{part.name}</Text>
                <Text style={styles.itemQty}>×{part.quantity}</Text>
                <Text style={styles.itemPrice}>{parseInt(part.unitPrice) * parseInt(part.quantity)} ج.م</Text>
              </View>
            ))}
            {/* Add Part */}
            <View style={styles.addRow}>
              <TextInput
                style={[styles.addInput, { flex: 2 }]}
                placeholder="اسم القطعة..."
                placeholderTextColor={colors.input.placeholder}
                value={newPartName}
                onChangeText={setNewPartName}
                textAlign="right"
              />
              <TextInput
                style={[styles.addInput, { flex: 0.5 }]}
                placeholder="عدد"
                placeholderTextColor={colors.input.placeholder}
                value={newPartQty}
                onChangeText={setNewPartQty}
                keyboardType="numeric"
                textAlign="center"
              />
              <TextInput
                style={[styles.addInput, { flex: 1 }]}
                placeholder="السعر"
                placeholderTextColor={colors.input.placeholder}
                value={newPartPrice}
                onChangeText={setNewPartPrice}
                keyboardType="numeric"
                textAlign="center"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addPart}>
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Total */}
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>المصنعية</Text>
              <Text style={styles.totalValue}>{totalServicesPrice} ج.م</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>قطع الغيار</Text>
              <Text style={styles.totalValue}>{totalPartsPrice} ج.م</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalGrandLabel}>الإجمالي</Text>
              <Text style={styles.totalGrandValue}>{totalPrice} ج.م</Text>
            </View>
          </View>

          {/* Quotation Button */}
          {!quotationApproved && (
            <TouchableOpacity
              style={styles.quotationButton}
              onPress={handleSendQuotation}
              disabled={quotationSent}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={quotationSent ? ['rgba(212,160,86,0.2)', 'rgba(212,160,86,0.1)'] : ['#D4A056', '#C4842D']}
                style={styles.quotationGradient}
              >
                <Text style={[styles.quotationText, quotationSent && { color: colors.text.tertiary }]}>
                  {quotationSent 
                    ? quotationApproved 
                      ? 'العميل وافق!' 
                      : 'في انتظار موافقة العميل...' 
                    : 'إرسال عرض السعر للعميل ←'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Status Update Button */}
          {quotationApproved && (
            <TouchableOpacity
              style={styles.statusUpdateBtn}
              onPress={handleStatusUpdate}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={currentStatus === STATUSES.length - 1 ? ['#10B981', '#059669'] : ['#3B82F6', '#2563EB']}
                style={styles.statusUpdateGradient}
              >
                <Text style={styles.statusUpdateText}>
                  {currentStatus === STATUSES.length - 1
                    ? 'إبلاغ العميل - السيارة جاهزة'
                    : `تحديث الحالة: ${STATUSES[currentStatus + 1]?.label} ←`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  gradient: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background.glassBorder,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'right',
  },
  // Status
  statusSection: { marginBottom: spacing['2xl'] },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusBar: {
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.background.glassBorder,
    padding: spacing.lg,
  },
  statusItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  statusDotActive: { backgroundColor: 'rgba(16,185,129,0.15)' },
  statusDotCurrent: {
    backgroundColor: 'rgba(212,160,86,0.15)',
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  statusLabel: {
    ...typography.bodySmall,
    color: colors.text.muted,
    flex: 1,
    textAlign: 'right',
  },
  statusLabelActive: { color: colors.text.primary, fontWeight: '600' },
  statusLine: {
    position: 'absolute',
    right: 15,
    bottom: -10,
    width: 2,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statusLineActive: { backgroundColor: colors.status.success },
  // Sections
  section: { marginBottom: spacing['2xl'] },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: { color: colors.status.error, fontSize: 12, fontWeight: '700' },
  itemName: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  itemQty: { ...typography.labelSmall, color: colors.text.tertiary },
  itemPrice: { ...typography.label, color: colors.accent.primary },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  addInput: {
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.input.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.bodySmall,
    color: colors.text.primary,
    height: 42,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { fontSize: 20, color: colors.background.primary, fontWeight: '700' },
  // Total
  totalCard: {
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,160,86,0.2)',
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  totalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  totalLabel: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  totalValue: {
    ...typography.label,
    color: colors.text.primary,
  },
  totalDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  totalGrandLabel: {
    ...typography.h4,
    color: colors.accent.primary,
    textAlign: 'right',
  },
  totalGrandValue: { ...typography.h3, color: colors.accent.primary },
  // Quotation
  quotationButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: '#D4A056',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  quotationGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quotationText: { ...typography.button, color: colors.background.primary },
  // Status Update
  statusUpdateBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  statusUpdateGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusUpdateText: { ...typography.button, color: '#FFFFFF' },
});

export default ProgressUpdateScreen;
