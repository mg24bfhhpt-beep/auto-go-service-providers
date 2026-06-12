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

const { width } = Dimensions.get('window');

interface Props {
  navigation?: any;
  route?: any;
}

// ─── Star Rating Component ────────────────────────────────────────────────────
const StarRating = ({
  rating,
  onRate,
  size = 36,
}: {
  rating: number;
  onRate: (r: number) => void;
  size?: number;
}) => (
  <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} onPress={() => onRate(star)} activeOpacity={0.75}>
        <Animated.View>
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? colors.accent.primary : colors.text.muted}
          />
        </Animated.View>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Summary Row ──────────────────────────────────────────────────────────────
const SummaryRow = ({
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
  <View style={styles.summaryRow}>
    <View style={styles.summaryIconBox}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.accent.primary} />
    </View>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ServiceCompletedScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const order = route?.params?.order;
  const invoice = route?.params?.invoice;

  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;
  const ringScaleAnim = useRef(new Animated.Value(0)).current;
  const ringOpacityAnim = useRef(new Animated.Value(1)).current;

  const completionTime = new Date().toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const total = invoice?.total || order?.estimatedPrice || 450;
  const invoiceNumber = invoice?.number || 'INV-2026-0001';

  useEffect(() => {
    // Success icon animation sequence
    Animated.sequence([
      // Pulsing ring
      Animated.parallel([
        Animated.spring(ringScaleAnim, { toValue: 1.4, friction: 4, tension: 50, useNativeDriver: true }),
        Animated.timing(ringOpacityAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      // Check icon pop in
      Animated.spring(checkScaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
    ]).start();

    // Content slide in
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, delay: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRatingSubmit = () => {
    if (rating === 0) {
      Alert.alert('تنبيه', 'يرجى اختيار تقييم أولاً.');
      return;
    }
    setSubmitted(true);
    Alert.alert(
      'شكراً',
      `تم إرسال تقييمك (${rating}/5 نجوم) بنجاح. شكراً لاستخدامك AutoGO!`,
      [{ text: 'حسناً' }]
    );
  };

  const handleBackToDashboard = () => {
    // Navigate to root — reset to main stack
    navigation?.navigate('DashboardHome');
  };

  const handleViewInvoice = () => {
    navigation?.navigate('Invoice', { order, invoice });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background gradient */}
      <LinearGradient colors={['#0A1520', '#0B2018', '#0A1520']} style={styles.gradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        >
          {/* ── Success Icon Section ── */}
          <View style={[styles.heroSection, { paddingTop: insets.top + spacing['3xl'] }]}>
            {/* Pulsing ring */}
            <Animated.View
              style={[
                styles.successRing,
                { transform: [{ scale: ringScaleAnim }], opacity: ringOpacityAnim },
              ]}
            />
            {/* Check circle */}
            <Animated.View style={{ transform: [{ scale: checkScaleAnim }] }}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.successCircle}>
                <MaterialCommunityIcons name="check-bold" size={54} color={colors.white} />
              </LinearGradient>
            </Animated.View>

            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <Text style={styles.heroTitle}>تمت الخدمة بنجاح!</Text>
              <Text style={styles.heroSub}>
                شكراً على احترافيتك. تم إتمام الخدمة وتحديث سجلك تلقائياً.
              </Text>
            </Animated.View>
          </View>

          {/* ── Service Summary Card ── */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Amount highlight */}
            <LinearGradient colors={['rgba(16,185,129,0.15)', 'rgba(10,21,32,0.5)']} style={styles.amountCard}>
              <Text style={styles.amountLabel}>إجمالي الخدمة</Text>
              <Text style={styles.amountValue}>{total} ج.م</Text>
              <View style={styles.amountBadge}>
                <MaterialCommunityIcons name="check-circle" size={14} color={colors.status.success} />
                <Text style={styles.amountBadgeText}>تم الاستلام</Text>
              </View>
            </LinearGradient>

            {/* Details card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={colors.accent.primary} />
                <Text style={styles.cardTitle}>ملخص الخدمة</Text>
              </View>

              <SummaryRow
                icon="account-outline"
                label="العميل"
                value={order?.customer?.name || 'محمود عبد الرحمن'}
              />
              <SummaryRow
                icon="car-outline"
                label="السيارة"
                value={order?.vehicle?.type || 'Toyota Corolla 2022'}
              />
              <SummaryRow
                icon="tools"
                label="نوع الخدمة"
                value={order?.problem?.type || 'إصلاح المحرك'}
              />
              <SummaryRow
                icon="clock-check-outline"
                label="وقت الإنجاز"
                value={completionTime}
              />
              <SummaryRow
                icon="receipt"
                label="رقم الفاتورة"
                value={invoiceNumber}
              />
              <SummaryRow
                icon="map-marker-check-outline"
                label="الموقع"
                value={order?.location?.address || 'المعادي، شارع ٩'}
              />
            </View>

            {/* ── Customer Rating Section ── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="star-circle-outline" size={20} color={colors.accent.primary} />
                <Text style={styles.cardTitle}>تقييم العميل</Text>
              </View>

              {submitted ? (
                <View style={styles.ratingSubmitted}>
                  <MaterialCommunityIcons name="check-circle" size={40} color={colors.status.success} />
                  <Text style={styles.ratingSubmittedText}>تم إرسال تقييمك بنجاح</Text>
                  <StarRating rating={rating} onRate={() => {}} size={24} />
                </View>
              ) : (
                <>
                  <Text style={styles.ratingPrompt}>
                    كيف كانت تجربة العميل معك؟ أضف تقييمك لمساعدة فريق الجودة.
                  </Text>
                  <View style={styles.starsContainer}>
                    <StarRating rating={rating} onRate={setRating} size={40} />
                  </View>
                  {rating > 0 && (
                    <Text style={styles.ratingHint}>
                      {rating === 5 ? 'ممتاز! أداء رائع' : rating === 4 ? 'جيد جداً' : rating === 3 ? 'مقبول' : rating === 2 ? 'يحتاج تحسين' : 'سيئ'}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[styles.ratingSubmitBtn, rating === 0 && styles.ratingSubmitBtnDisabled]}
                    onPress={handleRatingSubmit}
                    disabled={rating === 0}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.ratingSubmitBtnText}>إرسال التقييم</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* ── Performance Stats ── */}
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <MaterialCommunityIcons name="star" size={18} color={colors.accent.primary} />
                <Text style={styles.statChipValue}>4.9</Text>
                <Text style={styles.statChipLabel}>تقييمك العام</Text>
              </View>
              <View style={styles.statChip}>
                <MaterialCommunityIcons name="check-all" size={18} color={colors.accent.emerald} />
                <Text style={styles.statChipValue}>157</Text>
                <Text style={styles.statChipLabel}>إجمالي الخدمات</Text>
              </View>
              <View style={styles.statChip}>
                <MaterialCommunityIcons name="cash" size={18} color={colors.status.warning} />
                <Text style={styles.statChipValue}>{total}</Text>
                <Text style={styles.statChipLabel}>أجر هذه الخدمة</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* ── Action Buttons ── */}
        <View style={[styles.actionsContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
          <TouchableOpacity
            style={styles.viewInvoiceBtn}
            onPress={handleViewInvoice}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="receipt-text-outline" size={20} color={colors.accent.primary} />
            <Text style={styles.viewInvoiceBtnText}>عرض الفاتورة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dashboardBtn}
            onPress={handleBackToDashboard}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#D4A056', '#C4842D']} style={styles.dashboardGradient}>
              <MaterialCommunityIcons name="home-outline" size={20} color={colors.background.primary} />
              <Text style={styles.dashboardBtnText}>العودة للرئيسية</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  gradient: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },

  // Hero section
  heroSection: { alignItems: 'center', paddingBottom: spacing['3xl'], gap: spacing.xl },
  successRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  successCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  heroSub: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.75,
    marginTop: spacing.sm,
  },

  // Amount card
  amountCard: {
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
    gap: spacing.sm,
  },
  amountLabel: { ...typography.label, color: colors.text.muted },
  amountValue: { ...typography.currency, color: colors.accent.primary },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  amountBadgeText: { ...typography.caption, color: colors.status.success, fontWeight: '700' },

  // Card
  card: {
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.background.glassBorder,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cardTitle: { ...typography.h4, color: colors.text.primary },

  // Summary rows
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212,160,86,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: { ...typography.body, color: colors.text.muted, flex: 1 },
  summaryValue: { ...typography.label, color: colors.text.primary },

  // Rating
  ratingPrompt: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  starsContainer: { marginBottom: spacing.md },
  ratingHint: {
    ...typography.label,
    color: colors.accent.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  ratingSubmitBtn: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ratingSubmitBtnDisabled: { opacity: 0.4 },
  ratingSubmitBtnText: { ...typography.button, color: colors.background.primary },
  ratingSubmitted: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  ratingSubmittedText: { ...typography.label, color: colors.status.success },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statChip: {
    flex: 1,
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statChipValue: { ...typography.h4, color: colors.text.primary },
  statChipLabel: { ...typography.caption, color: colors.text.muted, textAlign: 'center' },

  // Action buttons
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(10,21,32,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  viewInvoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.accent.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    backgroundColor: 'rgba(212,160,86,0.08)',
  },
  viewInvoiceBtnText: { ...typography.label, color: colors.accent.primary },
  dashboardBtn: { flex: 2, borderRadius: borderRadius.xl, overflow: 'hidden' },
  dashboardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  dashboardBtnText: { ...typography.button, color: colors.background.primary },
});

export default ServiceCompletedScreen;
