import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { UserRole } from '../../types';

interface Props {
  navigation?: any;
}

const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const handleRoleSelect = (role: UserRole) => {
    navigation?.navigate('Login', { role });
  };

  return (
    <LinearGradient
      colors={['#060E17', '#0D2B2D', '#0A1520']}
      style={[styles.container, { paddingTop: insets.top + 20 }]}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Logo Area */}
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#D4A056', '#C4842D']}
            style={styles.logoGradient}
          >
            <MaterialCommunityIcons name="car-wrench" size={40} color="#0A1520" />
          </LinearGradient>
        </View>
        <Text style={styles.appName}>AutoGo Partners</Text>
        <Text style={styles.subtitle}>شـريـك الـنـجـاح</Text>
      </View>

      {/* Welcome Text */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>أهلاً بيك!</Text>
        <Text style={styles.welcomeDescription}>
          اختار نوع نشاطك عشان نقدر نوصلك بالعملاء
        </Text>
      </View>

      {/* Role Cards */}
      <View style={styles.cardsContainer}>
        {/* Winch Driver Card */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => handleRoleSelect('winch_driver')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)']}
            style={styles.roleCardGradient}
          >
            <View style={[styles.roleIconContainer, { backgroundColor: colors.role.winchGlow }]}>
              <MaterialCommunityIcons name="truck-flatbed" size={30} color={colors.role.winch} />
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>سائق ونش</Text>
              <Text style={styles.roleDescription}>
                خدمات الإنقاذ والسحب على الطريق
              </Text>
            </View>
            <View style={[styles.roleArrow, { backgroundColor: colors.role.winch }]}>
              <Ionicons name="arrow-back" size={18} color="#0A1520" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Workshop Receptionist Card */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => handleRoleSelect('workshop_receptionist')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
            style={styles.roleCardGradient}
          >
            <View style={[styles.roleIconContainer, { backgroundColor: colors.role.workshopGlow }]}>
              <MaterialCommunityIcons name="car-cog" size={30} color={colors.role.workshop} />
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>مركز صيانة</Text>
              <Text style={styles.roleDescription}>
                استقبال حجوزات الصيانة والإصلاح
              </Text>
            </View>
            <View style={[styles.roleArrow, { backgroundColor: colors.role.workshop }]}>
              <Ionicons name="arrow-back" size={18} color="#0A1520" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          بتسجيلك أنت موافق على{' '}
          <Text style={styles.footerLink}>الشروط والأحكام</Text>
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: borderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A056',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoIcon: {
    fontSize: 40,
  },
  appName: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  welcomeSection: {
    paddingHorizontal: spacing['3xl'],
    marginBottom: spacing['3xl'],
    alignItems: 'center',
  },
  welcomeTitle: {
    ...typography.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeDescription: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  cardsContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  roleCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  roleCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  roleTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 4,
  },
  roleDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'left',
  },
  roleArrow: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.text.muted,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.accent.primary,
    textDecorationLine: 'underline',
  },
});

export default RoleSelectionScreen;
