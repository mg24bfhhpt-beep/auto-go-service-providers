import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { UserRole } from '../../types';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { verifyWorkshopOTP } from '../../store/slices/authSlice';

interface Props {
  navigation?: any;
  route?: any;
}

const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const phone = route?.params?.phone || '';
  const role = (route?.params?.role || 'winch_driver') as UserRole;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (canResend) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [canResend]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all 4 digits entered
    if (newOtp.every((d) => d !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    if (role === 'workshop_receptionist') {
      const result = await dispatch(verifyWorkshopOTP({ phone, otp: code, role }));
      if (verifyWorkshopOTP.rejected.match(result)) {
        Alert.alert('فشل تسجيل الدخول', String(result.payload || 'حدث خطأ'));
        return;
      }
      return;
    }

    if (code === '1234') {
      navigation?.navigate('DocumentUpload', { role, phone });
    }
  };

  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '']);
  };

  return (
    <LinearGradient colors={['#060E17', '#0D2B2D', '#0A1520']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        {/* Back */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-forward" size={22} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient colors={['#D4A056', '#C4842D']} style={styles.iconGradient}>
              <MaterialCommunityIcons name="lock-outline" size={32} color="#0A1520" />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.title}>كود التحقق</Text>
          <Text style={styles.subtitle}>
            ادخل الكود اللي وصلك على الرقم{'\n'}
            <Text style={styles.phoneText}>+20 {phone}</Text>
          </Text>
        </View>

        {/* OTP Inputs */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(v) => handleOtpChange(v, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Timer / Resend */}
        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendText}>ابعتلي الكود تاني</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              ابعت تاني بعد <Text style={styles.timerCount}>{timer}</Text> ثانية
            </Text>
          )}
        </View>

        {/* Dev Hint */}
        <View style={styles.devHint}>
          <Ionicons name="flask-outline" size={18} color={colors.status.info} style={{ marginRight: 6 }} />
          <Text style={styles.devHintText}>
            {role === 'workshop_receptionist'
              ? 'للتجربة: 01098765432 + كود 1234'
              : 'للتجربة: استخدم الكود 1234'}
          </Text>
        </View>

        {isLoading && (
          <ActivityIndicator color={colors.accent.primary} style={{ marginTop: spacing.lg }} />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
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
    marginBottom: spacing['3xl'],
  },
  backArrow: {
    color: colors.text.primary,
    fontSize: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A056',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneText: {
    color: colors.accent.primary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing['3xl'],
  },
  otpInput: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.input.background,
    borderWidth: 1.5,
    borderColor: colors.input.border,
    textAlign: 'center',
    ...typography.h3,
    color: colors.text.primary,
  },
  otpInputFilled: {
    borderColor: colors.accent.primary,
    backgroundColor: 'rgba(212, 160, 86, 0.1)',
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  timerText: {
    ...typography.body,
    color: colors.text.tertiary,
  },
  timerCount: {
    color: colors.accent.primary,
    fontWeight: '700',
  },
  resendText: {
    ...typography.label,
    color: colors.accent.primary,
    textDecorationLine: 'underline',
  },
  devHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    alignSelf: 'center',
  },
  devHintIcon: {
    fontSize: 16,
  },
  devHintText: {
    ...typography.bodySmall,
    color: colors.status.info,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.error,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default OTPVerificationScreen;
