import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { UserRole } from '../../types';
import { useAppDispatch } from '../../hooks';
import { loginSuccess } from '../../store/slices/authSlice';
import { providerApi } from '../../services/providerApi';
import { saveToken } from '../../services/api';
import { formatEgyptPhone } from '../../utils/phone';

interface Props {
  navigation?: any;
  route?: any;
}

interface DocumentItem {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  isUploaded: boolean;
  uri?: string;
}

const DocumentUploadScreen: React.FC<Props> = ({ navigation, route }) => {
  const role = route?.params?.role || 'winch_driver';
  const phone = formatEgyptPhone(route?.params?.phone || '01000000000');
  const isWinch = role === 'winch_driver';
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Synchronous lock to stop double-tap creating two register/login attempts.
  const submitLock = useRef(false);

  const [documents, setDocuments] = useState<DocumentItem[]>(
    isWinch
      ? [
          { id: 'national_id', label: 'البطاقة الشخصية', description: 'صورة واضحة للبطاقة - وش وضهر', icon: 'card-account-details-outline', isUploaded: false },
          { id: 'license', label: 'رخصة القيادة', description: 'رخصة سارية المفعول', icon: 'card-bulleted-outline', isUploaded: false },
          { id: 'winch_photo', label: 'صورة الونش', description: 'صورة كاملة للونش من الأمام', icon: 'truck-flatbed', isUploaded: false },
          { id: 'winch_plate', label: 'لوحة الونش', description: 'صورة واضحة للوحة المعدنية', icon: 'car-info', isUploaded: false },
        ]
      : [
          { id: 'commercial_register', label: 'السجل التجاري', description: 'صورة سجل تجاري ساري', icon: 'file-certificate-outline', isUploaded: false },
          { id: 'workshop_front', label: 'واجهة المركز', description: 'صورة لواجهة مركز الصيانة', icon: 'storefront-outline', isUploaded: false },
          { id: 'workshop_inside', label: 'صورة من الداخل', description: 'صورة لمنطقة العمل', icon: 'tools', isUploaded: false },
          { id: 'location', label: 'موقع المركز', description: 'تحديد الموقع على الخريطة', icon: 'map-marker-outline', isUploaded: false },
        ]
  );

  const handleUpload = async (docId: string) => {
    if (docId === 'location') {
      Alert.alert(
        'تحديد الموقع',
        'هل تود تحديد الموقع الجغرافي لمركز الصيانة الخاص بك؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'تحديد الموقع الحالي',
            onPress: () => {
              setDocuments((prev) =>
                prev.map((d) => (d.id === docId ? { ...d, isUploaded: true, uri: 'mock_location' } : d))
              );
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'رفع المستند',
      'اختر طريقة رفع المستند أو الصورة:',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استخدام صورة نموذجية (افتراضية)',
          onPress: () => {
            setDocuments((prev) =>
              prev.map((d) => (d.id === docId ? { ...d, isUploaded: true, uri: 'default_template' } : d))
            );
          },
        },
        {
          text: 'من مكتبة الصور',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('خطأ', 'نحتاج لإذن الوصول لمعرض الصور لرفع المستند');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedUri = result.assets[0].uri;
                setDocuments((prev) =>
                  prev.map((d) => (d.id === docId ? { ...d, isUploaded: true, uri: selectedUri } : d))
                );
              }
            } catch (err) {
              Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة');
            }
          },
        },
        {
          text: 'التقاط صورة بالكاميرا',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('خطأ', 'نحتاج لإذن الكاميرا لالتقاط صورة المستند');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedUri = result.assets[0].uri;
                setDocuments((prev) =>
                  prev.map((d) => (d.id === docId ? { ...d, isUploaded: true, uri: selectedUri } : d))
                );
              }
            } catch (err) {
              Alert.alert('خطأ', 'حدث خطأ أثناء التقاط الصورة');
            }
          },
        },
      ]
    );
  };

  const allUploaded = documents.every((d) => d.isUploaded);

  const dispatchLogin = (data: Record<string, unknown>) => {
    const driverData = (data.driver ?? data.provider ?? data) as Record<string, unknown>;
    if (!driverData?.id) {
      throw new Error('بيانات المزود غير مكتملة من الخادم');
    }

    saveToken(String(data.token || ''));
    dispatch(
      loginSuccess({
        id: String(driverData.id),
        name: String(driverData.name),
        phone: String(driverData.phone),
        role: driverData.towType ? 'winch_driver' : role,
        rating: Number(driverData.rating) || 5.0,
        totalJobs: 0,
        isOnline: Boolean(driverData.isOnline ?? false),
        isVerified: true,
        verificationStatus: 'approved',
        createdAt: String(driverData.createdAt ?? new Date().toISOString()),
      })
    );
  };

  const handleSubmit = async () => {
    if (submitLock.current) return;

    if (!allUploaded) {
      Alert.alert('تنبيه', 'لازم ترفع كل المستندات المطلوبة');
      return;
    }

    submitLock.current = true;

    if (!isWinch) {
      dispatch(
        loginSuccess({
          id: 'provider_workshop_mock',
          name: 'مركز الصيانة',
          phone,
          role,
          rating: 4.8,
          totalJobs: 0,
          isOnline: true,
          isVerified: true,
          verificationStatus: 'approved',
          createdAt: new Date().toISOString(),
        })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      try {
        const res = await providerApi.register({
          name: 'سائق ونش',
          phone,
          password: 'password123',
          role,
        });
        if (res.success) {
          dispatchLogin(res.data);
          return;
        }
      } catch (registerErr: unknown) {
        const status = registerErr instanceof Error && 'status' in registerErr ? (registerErr as { status: number }).status : 0;
        if (status !== 409) {
          throw registerErr;
        }
      }

      const loginRes = await providerApi.login(phone, 'password123');
      if (loginRes.success) {
        dispatchLogin(loginRes.data);
      } else {
        throw new Error('فشل تسجيل الدخول');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ، تأكد من الاتصال بالخادم وأعد المحاولة';
      Alert.alert('خطأ', message);
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  };

  return (
    <LinearGradient colors={['#060E17', '#0D2B2D', '#0A1520']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-forward" size={22} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stepBadge}>الخطوة الأخيرة</Text>
          <Text style={styles.title}>رفع المستندات</Text>
          <Text style={styles.subtitle}>
            {isWinch
              ? 'ارفع الأوراق المطلوبة عشان نقدر نفعّل حسابك كسائق ونش'
              : 'ارفع بيانات المركز عشان نقدر نفعّل حسابك على المنصة'}
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(documents.filter((d) => d.isUploaded).length / documents.length) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {documents.filter((d) => d.isUploaded).length} / {documents.length} مستند
          </Text>
        </View>

        {/* Document Cards */}
        <View style={styles.documentsContainer}>
          {documents.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={[styles.docCard, doc.isUploaded && styles.docCardUploaded]}
              onPress={() => handleUpload(doc.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.docIconContainer, doc.isUploaded && styles.docIconUploaded]}>
                {doc.isUploaded ? (
                  <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
                ) : (
                  <MaterialCommunityIcons name={doc.icon} size={24} color={colors.accent.primary} />
                )}
              </View>
              <View style={doc.isUploaded ? [styles.docInfo, { opacity: 0.7 }] : styles.docInfo}>
                <Text style={styles.docLabel}>{doc.label}</Text>
                <Text style={styles.docDescription}>{doc.description}</Text>
              </View>
              <View style={[styles.uploadBadge, doc.isUploaded && styles.uploadBadgeDone]}>
                <Text style={[styles.uploadBadgeText, doc.isUploaded && styles.uploadBadgeTextDone]}>
                  {doc.isUploaded ? 'تم' : 'ارفع'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, !allUploaded && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={!allUploaded}
        >
          <LinearGradient
            colors={allUploaded ? ['#D4A056', '#C4842D'] : ['rgba(212,160,86,0.2)', 'rgba(196,132,45,0.2)']}
            style={styles.submitGradient}
          >
            <Text style={[styles.submitText, !allUploaded && styles.submitTextDisabled]}>
              دخول التطبيق 🚀
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: spacing['4xl'],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background.glassBorder,
    alignSelf: 'flex-start',
    marginBottom: spacing['2xl'],
  },
  backArrow: { color: colors.text.primary, fontSize: 20 },
  header: { marginBottom: spacing['2xl'] },
  stepBadge: {
    ...typography.labelSmall,
    color: colors.accent.primary,
    backgroundColor: 'rgba(212,160,86,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  progressContainer: {
    marginBottom: spacing['2xl'],
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent.primary,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'left',
  },
  documentsContainer: {
    gap: spacing.md,
    marginBottom: spacing['3xl'],
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.background.glassBorder,
    padding: spacing.lg,
    gap: spacing.md,
  },
  docCardUploaded: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  docIconContainer: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docIconUploaded: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  docIcon: { fontSize: 24 },
  docInfo: { flex: 1 },
  docLabel: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: 2,
  },
  docDescription: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  uploadBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(212,160,86,0.15)',
  },
  uploadBadgeDone: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  uploadBadgeText: {
    ...typography.labelSmall,
    color: colors.accent.primary,
  },
  uploadBadgeTextDone: {
    color: colors.status.success,
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#D4A056',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  submitGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    ...typography.button,
    color: colors.button.primaryText,
  },
  submitTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
});

export default DocumentUploadScreen;
