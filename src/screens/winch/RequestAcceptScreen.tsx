import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useAppDispatch } from '../../hooks';
import { acceptWinchOrder, rejectWinchOrder } from '../../store/slices/jobsSlice';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

interface Props {
  navigation?: any;
  route?: { params: { job: any } };
}

const RequestAcceptScreen: React.FC<Props> = ({ navigation, route }) => {
  const job = route?.params?.job || {} as any;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = React.useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Vibration.vibrate([0, 500, 200, 500]);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Timer countdown (30 seconds to accept)
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: 30000,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleAccept = async () => {
    if (submitting) return;
    setSubmitting(true);
    const result = await dispatch(acceptWinchOrder(job.id));
    setSubmitting(false);
    if (acceptWinchOrder.rejected.match(result)) {
      Alert.alert('تعذر قبول الطلب', String(result.payload || 'حاول مرة أخرى'));
      return;
    }
    navigation.replace('ActiveJob', { jobId: job.id, job });
  };

  const handleReject = () => {
    if (job.id) dispatch(rejectWinchOrder(job.id));
    navigation.goBack();
  };

  const timerWidth = timerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0A1520', '#1A0E05', '#0A1520']} style={styles.gradient}>
        
        {/* Timer Bar */}
        <View style={[styles.timerBar, { marginTop: insets.top + spacing.md }]}>
          <Animated.View style={[styles.timerFill, { width: timerWidth }]} />
        </View>

        {/* Alert Header */}
        <Animated.View style={[styles.alertHeader, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.alertIcon}>
            <MaterialCommunityIcons name="bell-ring-outline" size={36} color={colors.role.winch} />
          </View>
          <Text style={styles.alertTitle}>طلب ونش إنقاذ جديد!</Text>
        </Animated.View>

        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <LinearGradient
            colors={['rgba(245,158,11,0.08)', 'rgba(10,21,32,0.8)']}
            style={styles.mapPlaceholder}
          >
            <MaterialCommunityIcons name="google-maps" size={44} color="rgba(255,255,255,0.3)" style={{ marginBottom: spacing.md }} />
            <Text style={styles.mapText}>خارطة موقع العميل</Text>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceValue}>{job.distance || job.estimatedDistance || 3.2}</Text>
              <Text style={styles.distanceUnit}>كم</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Request Details */}
        <Animated.View style={[styles.detailsCard, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient
            colors={['rgba(30, 30, 30, 0.95)', 'rgba(13, 43, 45, 0.85)']}
            style={[styles.detailsGradient, { paddingBottom: insets.bottom + spacing.xl }]}
          >
            {/* Customer Info */}
            <View style={styles.customerSection}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerAvatarText}>
                  {(job.customerName || 'م').charAt(0)}
                </Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{job.customerName || 'محمود عبدالله'}</Text>
                <Text style={styles.carInfo}>{job.carType || 'سيارة العميل'}</Text>
              </View>
              <View style={styles.priceBadge}>
                <Text style={styles.priceValue}>{job.estimatedPrice || 350}</Text>
                <Text style={styles.priceUnit}>ج.م</Text>
              </View>
            </View>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailBox}>
                <View style={styles.detailBoxHeader}>
                  <MaterialCommunityIcons name="map-marker" size={16} color={colors.accent.primary} />
                  <Text style={styles.detailBoxLabel}>الموقع</Text>
                </View>
                <Text style={styles.detailBoxValue} numberOfLines={1}>{job.location || 'الموقع الحالي'}</Text>
              </View>
              
              <View style={styles.detailBox}>
                <View style={styles.detailBoxHeader}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color={colors.accent.primary} />
                  <Text style={styles.detailBoxLabel}>نوع العطل</Text>
                </View>
                <Text style={styles.detailBoxValue} numberOfLines={1}>{job.issueType || 'عطل ميكانيكي'}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.rejectButton} 
                onPress={handleReject}
                activeOpacity={0.8}
              >
                <Text style={styles.rejectButtonText}>رفض الطلب</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.acceptButtonWrap} 
                onPress={handleAccept}
                activeOpacity={0.8}
              >
                <LinearGradient colors={colors.gradient.gold} style={styles.acceptBtn}>
                  <Text style={styles.acceptBtnText}>قبول وتوجه للموقع</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  timerBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: spacing.xl,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: colors.role.winch,
    borderRadius: 2,
  },
  alertHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  alertIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(245,158,11,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  alertTitle: {
    ...typography.h3,
    color: colors.role.winch,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)',
  },
  mapText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  distanceBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  distanceValue: {
    ...typography.h3,
    color: colors.role.winch,
  },
  distanceUnit: {
    ...typography.label,
    color: colors.role.winch,
  },
  detailsCard: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  detailsGradient: {
    padding: spacing.xl,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
  },
  customerSection: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(212,160,86,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: { ...typography.h4, color: colors.accent.primary },
  customerInfo: { flex: 1, alignItems: 'flex-end' },
  customerName: { ...typography.h4, color: colors.text.primary },
  carInfo: { ...typography.bodySmall, color: colors.text.secondary },
  priceBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,160,86,0.12)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  priceValue: { ...typography.h3, color: colors.accent.primary },
  priceUnit: { ...typography.caption, color: colors.accent.primary },
  detailsGrid: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  detailBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'flex-end',
  },
  detailBoxHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  detailBoxLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  detailBoxValue: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
  },
  rejectButton: {
    flex: 1,
    height: 54,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonText: { ...typography.button, color: colors.status.error },
  acceptButtonWrap: {
    flex: 2.2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#D4A056',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  acceptBtn: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  acceptBtnText: { ...typography.button, color: colors.background.primary },
});

export default RequestAcceptScreen;
