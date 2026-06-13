import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Switch,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { toggleOnline } from '../../store/slices/authSlice';
import { fetchWorkshopOrders, updateWorkshopOrderStatus, fetchWinchRequests, setActiveWinchRequest } from '../../store/slices/jobsSlice';
import { WorkshopBooking } from '../../types';

const { width } = Dimensions.get('window');

interface Props {
  navigation?: any;
}

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const provider = useAppSelector((state) => state.auth.provider);
  const { todayBookings, isLoading: ordersLoading, winchRequests, winchLoading } = useAppSelector((state) => state.jobs);
  const role = provider?.role || 'winch_driver';
  const isOnline = provider?.isOnline || false;
  const isWinch = role === 'winch_driver';
  const insets = useSafeAreaInsets();
  // Synchronous lock to prevent double-tap accepting the same booking twice.
  const acceptLockRef = useRef(false);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const storedUri = await AsyncStorage.getItem(`@avatar_${provider?.phone || 'default'}`);
        if (storedUri) {
          setAvatarUri(storedUri);
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
      }
    };
    
    const unsubscribe = navigation?.addListener('focus', () => {
      loadAvatar();
    });

    loadAvatar();
    return unsubscribe;
  }, [provider?.phone, navigation]);

  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!isWinch) {
      dispatch(fetchWorkshopOrders('active'));
    } else {
      dispatch(fetchWinchRequests());
    }
  }, [dispatch, isWinch]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener('focus', () => {
      if (!isWinch) {
        dispatch(fetchWorkshopOrders('active'));
      } else {
        dispatch(fetchWinchRequests());
      }
    });
    return unsubscribe;
  }, [navigation, dispatch, isWinch]);

  // Poll for new winch requests while online (map/location stay mock)
  useEffect(() => {
    if (!isWinch || !isOnline) return;
    const interval = setInterval(() => dispatch(fetchWinchRequests()), 15000);
    return () => clearInterval(interval);
  }, [dispatch, isWinch, isOnline]);

  const handleAcceptBooking = async (booking: WorkshopBooking) => {
    if (booking.status !== 'pending') {
      navigation?.navigate('CarReception', { bookingId: booking.id });
      return;
    }

    if (acceptLockRef.current) return;
    acceptLockRef.current = true;
    try {
      const result = await dispatch(updateWorkshopOrderStatus({ orderId: booking.id, status: 'confirmed' }));
      if (updateWorkshopOrderStatus.fulfilled.match(result)) {
        navigation?.navigate('CarReception', { bookingId: booking.id });
      }
    } finally {
      acceptLockRef.current = false;
    }
  };

  const handleToggleOnline = () => {
    dispatch(toggleOnline());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return colors.status.info;
      case 'in_progress': return colors.status.warning;
      case 'pending': return colors.status.pending;
      default: return colors.text.tertiary;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      <LinearGradient colors={['#0A1520', '#0D2B2D', '#0A1520']} style={styles.gradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        >
          {/* Header */}
          <Animated.View style={[styles.header, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>أهلاً يا</Text>
                <Text style={styles.name}>{provider?.name || 'شريك أوتو جو'}</Text>
              </View>
              <TouchableOpacity style={styles.avatarContainer} onPress={() => navigation?.navigate('Profile')} activeOpacity={0.8}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={[styles.avatar, { resizeMode: 'cover' }]} />
                ) : (
                  <LinearGradient colors={['#D4A056', '#C4842D']} style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(provider?.name || 'أ').charAt(0)}
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>

            {/* Online Toggle */}
            <TouchableOpacity
              style={[styles.onlineToggle, isOnline && styles.onlineToggleActive]}
              onPress={handleToggleOnline}
              activeOpacity={0.8}
            >
              <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
              <Text style={[styles.onlineText, isOnline && styles.onlineTextActive]}>
                {isOnline ? 'متاح لاستقبال الطلبات' : 'غير متاح حالياً'}
              </Text>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(16,185,129,0.3)' }}
                thumbColor={isOnline ? colors.status.online : '#6B7280'}
                style={styles.switch}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statCard} 
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('Profile', { openModal: 'Stats' })}
            >
              <LinearGradient
                colors={['rgba(212,160,86,0.12)', 'rgba(212,160,86,0.04)']}
                style={styles.statGradient}
              >
                <MaterialCommunityIcons name="cash-multiple" size={24} color={colors.accent.primary} style={{ marginBottom: 8 }} />
                <Text style={styles.statValue}>١,٢٠٠</Text>
                <Text style={styles.statUnit}>ج.م</Text>
                <Text style={styles.statLabel}>أرباح اليوم</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statCard} 
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('Profile', { openModal: 'Stats' })}
            >
              <LinearGradient
                colors={['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.04)']}
                style={styles.statGradient}
              >
                <MaterialCommunityIcons name={isWinch ? 'truck-flatbed' : 'car-cog'} size={24} color={isWinch ? colors.role.winch : colors.role.workshop} style={{ marginBottom: 8 }} />
                <Text style={styles.statValue}>{todayBookings.length}</Text>
                <Text style={styles.statUnit}>عملية</Text>
                <Text style={styles.statLabel}>{isWinch ? 'رحلات اليوم' : 'حجوزات اليوم'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statCard} 
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('Profile', { openModal: 'Stats' })}
            >
              <LinearGradient
                colors={['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.04)']}
                style={styles.statGradient}
              >
                <MaterialCommunityIcons name="star" size={24} color="#F59E0B" style={{ marginBottom: 8 }} />
                <Text style={styles.statValue}>٤.٨</Text>
                <Text style={styles.statUnit}>من ٥</Text>
                <Text style={styles.statLabel}>التقييم</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Active Requests / Bookings */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons 
                name={isWinch ? "bell-outline" : "calendar-month-outline"} 
                size={20} 
                color={colors.accent.primary} 
              />
              <Text style={styles.sectionTitle}>
                {isWinch ? 'طلبات جديدة' : 'حجوزات اليوم'}
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>

          {isWinch ? (
            // Winch Requests (real pending tow orders)
            winchLoading && winchRequests.length === 0 ? (
              <Text style={styles.emptyText}>جاري تحميل الطلبات...</Text>
            ) : winchRequests.length === 0 ? (
              <Text style={styles.emptyText}>لا توجد طلبات جديدة حالياً</Text>
            ) : (
            winchRequests.map((req) => (
              <TouchableOpacity
                key={req.id}
                style={styles.requestCard}
                activeOpacity={0.85}
                onPress={() => { dispatch(setActiveWinchRequest(req)); navigation?.navigate('RequestAccept', { job: req }); }}
              >
                <LinearGradient
                  colors={['rgba(245,158,11,0.08)', 'rgba(10,21,32,0.6)']}
                  style={styles.requestGradient}
                >
                  <View style={styles.requestHeader}>
                    <View style={styles.requestCustomer}>
                      <View style={styles.customerAvatar}>
                        <Text style={styles.customerAvatarText}>
                          {req.customerName.charAt(0)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.customerName}>{req.customerName}</Text>
                        <Text style={styles.carType}>{req.carType}</Text>
                      </View>
                    </View>
                    <Text style={styles.timeAgo}>{req.timeAgo}</Text>
                  </View>

                  <View style={styles.requestDetails}>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.text.secondary} style={{ marginRight: 6 }} />
                      <Text style={styles.detailText}>{req.location}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.text.secondary} style={{ marginRight: 6 }} />
                      <Text style={styles.detailText}>{req.issueType}</Text>
                    </View>
                  </View>

                  <View style={styles.requestFooter}>
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>{req.distance} كم</Text>
                    </View>
                    <Text style={styles.priceText}>{req.estimatedPrice} ج.م</Text>
                    <TouchableOpacity 
                      style={styles.acceptButton}
                      onPress={() => { dispatch(setActiveWinchRequest(req)); navigation?.navigate('RequestAccept', { job: req }); }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="arrow-back" size={16} color={colors.background.primary} />
                        <Text style={styles.acceptButtonText}>قبول</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))
            )
          ) : ordersLoading ? (
            <Text style={styles.emptyText}>جاري تحميل الحجوزات...</Text>
          ) : todayBookings.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد حجوزات نشطة حالياً</Text>
          ) : (
            todayBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                activeOpacity={0.85}
                onPress={() => handleAcceptBooking(booking)}
              >
                <View style={styles.bookingTime}>
                  <Text style={styles.bookingTimeText}>{booking.scheduledTime}</Text>
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingCustomer}>{booking.customerName}</Text>
                  <Text style={styles.bookingCar}>{booking.carType}</Text>
                  <Text style={styles.bookingService}>{booking.serviceName || booking.services[0]?.name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}20` }]}>
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(booking.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                    {booking.statusLabel || booking.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation?.navigate('Wallet')}>
              <LinearGradient
                colors={['rgba(212,160,86,0.12)', 'rgba(212,160,86,0.04)']}
                style={styles.quickActionGradient}
              >
                <MaterialCommunityIcons name="wallet-outline" size={28} color={colors.accent.primary} style={{ marginBottom: 8 }} />
                <Text style={styles.quickActionText}>المحفظة</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation?.navigate('Profile')}>
              <LinearGradient
                colors={['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.04)']}
                style={styles.quickActionGradient}
              >
                <MaterialCommunityIcons name="chart-bar" size={28} color={colors.accent.emerald} style={{ marginBottom: 8 }} />
                <Text style={styles.quickActionText}>الإحصائيات</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <LinearGradient
                colors={['rgba(59,130,246,0.12)', 'rgba(59,130,246,0.04)']}
                style={styles.quickActionGradient}
              >
                <MaterialCommunityIcons name="chat-processing-outline" size={28} color="#3B82F6" style={{ marginBottom: 8 }} />
                <Text style={styles.quickActionText}>الرسائل</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation?.navigate('Profile', { openModal: 'Support' })}>
              <LinearGradient
                colors={['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.04)']}
                style={styles.quickActionGradient}
              >
                <MaterialCommunityIcons name="help-circle-outline" size={28} color="#EF4444" style={{ marginBottom: 8 }} />
                <Text style={styles.quickActionText}>الدعم</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  // Header
  header: { marginBottom: spacing['2xl'] },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.body,
    color: colors.text.secondary,
  },
  name: {
    ...typography.h3,
    color: colors.text.primary,
  },
  avatarContainer: {},
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h4,
    color: colors.background.primary,
  },
  // Online Toggle
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  onlineToggleActive: {
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.05)',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.status.offline,
  },
  statusDotOnline: {
    backgroundColor: colors.status.online,
    shadowColor: colors.status.online,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  onlineText: {
    ...typography.label,
    color: colors.text.tertiary,
    flex: 1,
  },
  onlineTextActive: {
    color: colors.status.online,
  },
  switch: { transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  statCard: { flex: 1, borderRadius: borderRadius.lg, overflow: 'hidden' },
  statGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statIcon: { fontSize: 22, marginBottom: spacing.sm },
  statValue: {
    ...typography.h3,
    color: colors.text.primary,
  },
  statUnit: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  seeAll: {
    ...typography.labelSmall,
    color: colors.accent.primary,
  },
  // Request Card (Winch)
  requestCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)',
  },
  requestGradient: { padding: spacing.lg },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  requestCustomer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  customerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(245,158,11,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    ...typography.label,
    color: colors.role.winch,
  },
  customerName: {
    ...typography.label,
    color: colors.text.primary,
  },
  carType: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  timeAgo: {
    ...typography.caption,
    color: colors.text.muted,
  },
  requestDetails: { gap: spacing.sm, marginBottom: spacing.lg },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailIcon: { fontSize: 14 },
  detailText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  distanceText: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },
  priceText: {
    ...typography.h4,
    color: colors.accent.primary,
  },
  acceptButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  acceptButtonText: {
    ...typography.label,
    color: colors.background.primary,
  },
  // Booking Card (Workshop)
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.background.glassBorder,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  bookingTime: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 65,
    alignItems: 'center',
  },
  bookingTimeText: {
    ...typography.labelSmall,
    color: colors.accent.emerald,
  },
  bookingInfo: { flex: 1 },
  bookingCustomer: {
    ...typography.label,
    color: colors.text.primary,
  },
  bookingCar: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  bookingService: {
    ...typography.caption,
    color: colors.accent.primary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickAction: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  quickActionGradient: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  quickActionIcon: { fontSize: 28, marginBottom: spacing.sm },
  quickActionText: {
    ...typography.label,
    color: colors.text.primary,
  },
});

export default DashboardScreen;
