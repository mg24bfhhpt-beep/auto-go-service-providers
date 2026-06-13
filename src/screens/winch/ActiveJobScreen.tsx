import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useAppDispatch } from '../../hooks';
import { updateWinchOrderStatus } from '../../store/slices/jobsSlice';

interface Props {
  navigation?: any;
  route?: { params: { jobId: string; job?: any } };
}

const STATUS_STEPS = [
  { key: 'on_the_way', label: 'أنا في الطريق', iconName: 'truck-fast-outline' as const, description: 'إبلاغ العميل إنك في الطريق' },
  { key: 'arrived', label: 'وصلت للموقع', iconName: 'map-marker-check' as const, description: 'تأكيد الوصول لموقع العميل' },
  { key: 'car_picked_up', label: 'تم رفع السيارة', iconName: 'crane' as const, description: 'التقاط صورة للسيارة (توثيق)' },
  { key: 'delivered', label: 'تم التوصيل', iconName: 'check-circle' as const, description: 'تسليم السيارة للوجهة المطلوبة' },
];

const ActiveJobScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const jobId = route?.params?.jobId || '';
  const job = route?.params?.job;
  const [currentStep, setCurrentStep] = useState(0);
  const [photoTaken, setPhotoTaken] = useState(false);

  const stepLock = useRef(false);
  const handleNextStep = () => {
    if (stepLock.current) return;
    stepLock.current = true;
    setTimeout(() => { stepLock.current = false; }, 500);

    if (currentStep === 2 && !photoTaken) {
      // Need photo before proceeding
      setPhotoTaken(true); // Mock: simulate photo capture
      return;
    }
    // Report the status the driver just reached to the backend (location stays mock)
    const reached = STATUS_STEPS[currentStep];
    if (reached && jobId) {
      dispatch(updateWinchOrderStatus({ orderId: jobId, status: reached.key }));
    }
    if (currentStep < STATUS_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Job completed
      navigation.replace('JobCompletion', { jobId, job });
    }
  };

  const isLastStep = currentStep === STATUS_STEPS.length - 1;

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
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="truck-fast-outline" size={24} color={colors.accent.primary} />
              <Text style={styles.headerTitle}>رحلة جارية</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          {/* Map Placeholder */}
          <View style={styles.mapContainer}>
            <LinearGradient
              colors={['rgba(16,185,129,0.08)', 'rgba(10,21,32,0.6)']}
              style={styles.mapPlaceholder}
            >
              <MaterialCommunityIcons name="google-maps" size={40} color={colors.text.tertiary} style={{ marginBottom: spacing.sm }} />
              <Text style={styles.mapText}>التتبع اللحظي على الخريطة</Text>
            </LinearGradient>
          </View>

          {/* Customer Card */}
          <View style={styles.customerCard}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{(job?.customerName || 'م').charAt(0)}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{job?.customerName || 'العميل'}</Text>
              <Text style={styles.customerCar}>{job?.carType || 'سيارة العميل'}</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Ionicons name="call" size={20} color={colors.status.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatButton}>
              <MaterialCommunityIcons name="chat-outline" size={20} color={colors.status.info} />
            </TouchableOpacity>
          </View>

          {/* Progress Steps */}
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>مراحل الخدمة</Text>
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              const isPending = index > currentStep;

              return (
                <View key={step.key}>
                  <View style={styles.stepRow}>
                    <View style={[
                      styles.stepDot,
                      isCompleted && styles.stepDotCompleted,
                      isActive && styles.stepDotActive,
                    ]}>
                      <MaterialCommunityIcons
                        name={isCompleted ? 'check' : step.iconName}
                        size={18}
                        color={
                          isCompleted
                            ? colors.status.success
                            : isActive
                            ? colors.accent.primary
                            : colors.text.tertiary
                        }
                      />
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[
                        styles.stepLabel,
                        isCompleted && styles.stepLabelCompleted,
                        isActive && styles.stepLabelActive,
                      ]}>
                        {step.label}
                      </Text>
                      <Text style={styles.stepDescription}>{step.description}</Text>
                      {isActive && step.key === 'car_picked_up' && (
                        <TouchableOpacity
                          style={[styles.photoButton, photoTaken && styles.photoButtonDone]}
                          onPress={() => setPhotoTaken(true)}
                        >
                          <View style={styles.photoButtonContent}>
                            <MaterialCommunityIcons
                              name={photoTaken ? 'check-circle' : 'camera'}
                              size={16}
                              color={photoTaken ? colors.status.success : colors.status.info}
                            />
                            <Text style={[
                              styles.photoButtonText,
                              photoTaken && { color: colors.status.success },
                            ]}>
                              {photoTaken ? 'تم التصوير' : 'التقاط صورة السيارة'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  {index < STATUS_STEPS.length - 1 && (
                    <View style={[
                      styles.stepConnector,
                      isCompleted && styles.stepConnectorCompleted,
                    ]} />
                  )}
                </View>
              );
            })}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              currentStep === 2 && !photoTaken && styles.actionButtonPhoto,
            ]}
            onPress={handleNextStep}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                isLastStep
                  ? ['#10B981', '#059669']
                  : currentStep === 2 && !photoTaken
                  ? ['#3B82F6', '#2563EB']
                  : ['#D4A056', '#C4842D']
              }
              style={styles.actionButtonGradient}
            >
              <View style={styles.actionButtonRow}>
                {isLastStep ? (
                  <>
                    <Text style={styles.actionButtonText}>إنهاء الرحلة</Text>
                    <MaterialCommunityIcons name="check" size={20} color={colors.background.primary} />
                  </>
                ) : currentStep === 2 && !photoTaken ? (
                  <>
                    <Text style={styles.actionButtonText}>التقط صورة السيارة أولاً</Text>
                    <MaterialCommunityIcons name="camera" size={20} color={colors.background.primary} />
                  </>
                ) : (
                  <>
                    <Text style={styles.actionButtonText}>
                      {STATUS_STEPS[currentStep + 1]?.label || 'التالي'}
                    </Text>
                    <MaterialCommunityIcons name="arrow-left" size={20} color={colors.background.primary} />
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'right',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    ...typography.caption,
    color: '#EF4444',
    fontWeight: '700',
  },
  mapContainer: {
    height: 180,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
    borderRadius: borderRadius.xl,
  },
  mapText: { ...typography.body, color: colors.text.tertiary, textAlign: 'right' },
  customerCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.background.glassBorder,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  customerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(245,158,11,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: { ...typography.label, color: colors.role.winch },
  customerInfo: { flex: 1 },
  customerName: { ...typography.label, color: colors.text.primary, textAlign: 'right' },
  customerCar: { ...typography.bodySmall, color: colors.text.secondary, textAlign: 'right' },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(16,185,129,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(59,130,246,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepsContainer: {
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.background.glassBorder,
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  stepsTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xl,
    textAlign: 'right',
  },
  stepRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stepDotCompleted: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: colors.status.success,
  },
  stepDotActive: {
    backgroundColor: 'rgba(212,160,86,0.15)',
    borderColor: colors.accent.primary,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  stepContent: { flex: 1, paddingTop: spacing.xs },
  stepLabel: {
    ...typography.label,
    color: colors.text.tertiary,
    marginBottom: 2,
    textAlign: 'right',
  },
  stepLabelCompleted: { color: colors.status.success },
  stepLabelActive: { color: colors.accent.primary },
  stepDescription: {
    ...typography.bodySmall,
    color: colors.text.muted,
    textAlign: 'right',
  },
  photoButton: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(59,130,246,0.12)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
  },
  photoButtonDone: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  photoButtonContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  photoButtonText: {
    ...typography.labelSmall,
    color: colors.status.info,
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 19,
    marginVertical: spacing.xs,
    alignSelf: 'flex-end',
  },
  stepConnectorCompleted: {
    backgroundColor: colors.status.success,
  },
  actionButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#D4A056',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonPhoto: {
    shadowColor: '#3B82F6',
  },
  actionButtonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  actionButtonRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.background.primary,
  },
});

export default ActiveJobScreen;
