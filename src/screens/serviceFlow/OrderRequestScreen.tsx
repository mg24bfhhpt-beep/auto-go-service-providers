import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { providerApi } from '../../services/providerApi';

const { width } = Dimensions.get('window');

interface Props {
  navigation?: any;
  route?: any;
}

// ─── Mock Service Request Data ────────────────────────────────────────────────
const MOCK_ORDER = {
  id: 'ORD-2026-00842',
  customer: {
    name: 'محمود عبد الرحمن',
    phone: '0101 234 5678',
    avatarInitial: 'م',
    rating: 4.7,
    totalOrders: 12,
  },
  vehicle: {
    type: 'Toyota Corolla 2022',
    color: 'أبيض',
    plate: 'أ ب ج ١٢٣٤',
  },
  problem: {
    type: 'عطل في المحرك',
    category: 'engine',
    description: 'السيارة لا تشتغل بشكل طبيعي وتصدر أصوات غريبة من المحرك',
    severity: 'high',
  },
  location: {
    address: 'المعادي، شارع ٩، بجوار محطة المترو',
    distance: 3.2,
    eta: 12,
  },
  estimatedPrice: 450,
};

const SEVERITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: colors.status.success },
  medium: { label: 'متوسطة', color: colors.status.warning },
  high: { label: 'مرتفعة', color: colors.status.error },
};

const CATEGORY_ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  engine: 'engine',
  battery: 'battery-alert',
  tire: 'tire',
  oil: 'oil',
  electrical: 'lightning-bolt',
  brakes: 'car-brake-alert',
};

// ─── Info Row Component ───────────────────────────────────────────────────────
const InfoRow = ({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrapper}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.accent.primary} />
    </View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
const OrderRequestScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const order = route?.params?.order || MOCK_ORDER;

  const [isAccepting, setIsAccepting] = useState(false);

  // Pulse animation for the new-request badge
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Pulse loop for urgency badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleConfirm = async () => {
    setIsAccepting(true);
    try {
      // Use real order ID if available, fallback for demo
      const orderId = order.orderId || order.id || 'demo_id';
      
      // In a real flow with real data, we would use the actual orderId
      // For demo purposes with mock data, we might skip the API call or wrap in try/catch
      if (order.orderId) {
        await providerApi.acceptOrder(order.orderId);
      } else {
        // Just simulate if no real orderId
        await new Promise((r) => setTimeout(r, 600));
      }
      
      navigation?.navigate('TrackingMap', { order });
    } catch (err) {
      console.error('Failed to accept order:', err);
      Alert.alert('خطأ', 'لم نتمكن من قبول الطلب، قد يكون قد تم قبوله من مزود آخر.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = () => {
    Alert.alert(
      'رفض الطلب',
      'هل أنت متأكد من رفض هذا الطلب؟ سيتم إرساله لمزود خدمة آخر.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، رفض',
          style: 'destructive',
          onPress: async () => {
            try {
              if (order.orderId) {
                await providerApi.rejectOrder(order.orderId);
              }
              navigation?.goBack();
            } catch (err) {
              console.error('Failed to reject order:', err);
              navigation?.goBack();
            }
          },
        },
      ]
    );
  };

  const severity = SEVERITY_MAP[order.problem.severity] || SEVERITY_MAP.medium;
  const categoryIcon = CATEGORY_ICON_MAP[order.problem.category] || 'wrench';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0A1520', '#0D2B2D', '#0A1520']} style={styles.gradient}>
        {/* ── Header ── */}
        <Animated.View
          style={[
            styles.header,
            { paddingTop: insets.top + spacing.lg },
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>طلب خدمة جديد</Text>
            <Text style={styles.headerSub}>{order.id}</Text>
          </View>
          <Animated.View style={[styles.urgencyBadge, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.urgencyDot} />
            <Text style={styles.urgencyText}>جديد</Text>
          </Animated.View>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* ── Customer Card ── */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.card}>
              <LinearGradient
                colors={['rgba(212,160,86,0.10)', 'rgba(10,21,32,0.5)']}
                style={styles.cardGradient}
              >
                {/* Avatar + Name */}
                <View style={styles.customerRow}>
                  <LinearGradient colors={['#D4A056', '#C4842D']} style={styles.avatar}>
                    <Text style={styles.avatarText}>{order.customer.avatarInitial}</Text>
                  </LinearGradient>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{order.customer.name}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={13} color={colors.accent.primary} />
                      <Text style={styles.ratingText}>{order.customer.rating}</Text>
                      <Text style={styles.ordersText}>({order.customer.totalOrders} طلب سابق)</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.callButton}>
                    <MaterialCommunityIcons name="phone" size={20} color={colors.background.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Contact & Vehicle Info */}
                <InfoRow icon="phone-outline" label="الهاتف" value={order.customer.phone} />
                <InfoRow icon="car-outline" label="السيارة" value={order.vehicle.type} />
                <InfoRow icon="card-text-outline" label="اللوحة" value={order.vehicle.plate} />
                <InfoRow icon="palette-outline" label="اللون" value={order.vehicle.color} />
              </LinearGradient>
            </View>

            {/* ── Problem Card ── */}
            <View style={styles.card}>
              <LinearGradient
                colors={['rgba(59,130,246,0.10)', 'rgba(10,21,32,0.5)']}
                style={styles.cardGradient}
              >
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name={categoryIcon} size={22} color={colors.status.info} />
                  <Text style={styles.sectionTitle}>تفاصيل المشكلة</Text>
                  <View style={[styles.severityBadge, { backgroundColor: `${severity.color}20` }]}>
                    <View style={[styles.severityDot, { backgroundColor: severity.color }]} />
                    <Text style={[styles.severityText, { color: severity.color }]}>
                      {severity.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <InfoRow icon="alert-circle-outline" label="نوع المشكلة" value={order.problem.type} />
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionLabel}>وصف العميل:</Text>
                  <Text style={styles.descriptionText}>{order.problem.description}</Text>
                </View>
              </LinearGradient>
            </View>

            {/* ── Location & Estimate Card ── */}
            <View style={styles.card}>
              <LinearGradient
                colors={['rgba(16,185,129,0.10)', 'rgba(10,21,32,0.5)']}
                style={styles.cardGradient}
              >
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="map-marker-outline" size={22} color={colors.accent.emerald} />
                  <Text style={styles.sectionTitle}>الموقع والتقدير</Text>
                </View>

                <View style={styles.divider} />

                <InfoRow icon="map-marker" label="الموقع" value={order.location.address} />

                {/* Distance & ETA chips */}
                <View style={styles.chipsRow}>
                  <View style={styles.chip}>
                    <MaterialCommunityIcons name="map-marker-distance" size={16} color={colors.accent.emerald} />
                    <Text style={styles.chipText}>{order.location.distance} كم</Text>
                  </View>
                  <View style={styles.chip}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={colors.accent.primary} />
                    <Text style={styles.chipText}>{order.location.eta} دقيقة وصول</Text>
                  </View>
                  <View style={styles.chip}>
                    <MaterialCommunityIcons name="cash-multiple" size={16} color={colors.status.warning} />
                    <Text style={styles.chipText}>{order.estimatedPrice} ج.م</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        </ScrollView>

        {/* ── Action Buttons ── */}
        <View style={[styles.actionsContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
          <TouchableOpacity
            style={[styles.rejectButton]}
            onPress={handleReject}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.status.error} />
            <Text style={styles.rejectButtonText}>رفض الطلب</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, isAccepting && styles.confirmButtonLoading]}
            onPress={handleConfirm}
            activeOpacity={0.85}
            disabled={isAccepting}
          >
            <LinearGradient colors={['#D4A056', '#C4842D']} style={styles.confirmGradient}>
              {isAccepting ? (
                <MaterialCommunityIcons name="loading" size={22} color={colors.background.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.background.primary} />
                  <Text style={styles.confirmButtonText}>قبول الطلب</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  gradient: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { ...typography.h4, color: colors.text.primary },
  headerSub: { ...typography.caption, color: colors.text.muted, marginTop: 2 },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  urgencyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.status.error },
  urgencyText: { ...typography.caption, color: colors.status.error, fontWeight: '700' },

  // Scroll
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },

  // Cards
  card: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.background.glassBorder,
  },
  cardGradient: { padding: spacing.xl },

  // Customer row
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { ...typography.h3, color: colors.background.primary },
  customerInfo: { flex: 1 },
  customerName: { ...typography.h4, color: colors.text.primary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  ratingText: { ...typography.labelSmall, color: colors.accent.primary },
  ordersText: { ...typography.caption, color: colors.text.muted },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Divider
  divider: { height: 1, backgroundColor: colors.divider, marginBottom: spacing.lg },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  infoIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212,160,86,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: { ...typography.bodySmall, color: colors.text.muted, flex: 1 },
  infoValue: { ...typography.label, color: colors.text.primary, textAlign: 'right', flex: 2 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: { ...typography.h4, color: colors.text.primary, flex: 1 },

  // Severity
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 5,
  },
  severityDot: { width: 6, height: 6, borderRadius: 3 },
  severityText: { ...typography.caption, fontWeight: '700' },

  // Description box
  descriptionBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    marginTop: spacing.sm,
  },
  descriptionLabel: { ...typography.caption, color: colors.text.muted, marginBottom: spacing.xs },
  descriptionText: { ...typography.body, color: colors.text.secondary, lineHeight: 22 },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  chipText: { ...typography.labelSmall, color: colors.text.secondary },

  // Action Buttons
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(10,21,32,0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.status.error,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  rejectButtonText: { ...typography.button, color: colors.status.error },
  confirmButton: {
    flex: 2,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  confirmButtonLoading: { opacity: 0.7 },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  confirmButtonText: { ...typography.button, color: colors.background.primary },
});

export default OrderRequestScreen;
