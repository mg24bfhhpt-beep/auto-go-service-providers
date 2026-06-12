import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { providerApi } from '../../services/providerApi';
import socketService from '../../services/socket';

const { width, height } = Dimensions.get('window');

interface Props {
  navigation?: any;
  route?: any;
}

// ─── Realistic coordinates (Cairo, Egypt) ────────────────────────────────────
const PROVIDER_LOCATION = { latitude: 29.9719, longitude: 31.2494 }; // Maadi area
const CUSTOMER_LOCATION = { latitude: 29.9600, longitude: 31.2560 }; // Nearby

// Simulated route waypoints between provider and customer
const ROUTE_COORDS = [
  { latitude: 29.9719, longitude: 31.2494 },
  { latitude: 29.9700, longitude: 31.2510 },
  { latitude: 29.9670, longitude: 31.2530 },
  { latitude: 29.9640, longitude: 31.2548 },
  { latitude: 29.9600, longitude: 31.2560 },
];

// ─── Custom Map Style (Dark Mode) ────────────────────────────────────────────
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0D1B2A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0D1B2A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8899AA' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E3A4A' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1A3040' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2A4A60' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A1A2A' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#101E2D' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#111C29' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1A3040' }] },
];

// ─── Main Screen ─────────────────────────────────────────────────────────────
const TrackingMapScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const order = route?.params?.order;
  const mapRef = useRef<MapView>(null);

  const [eta, setEta] = useState(12);
  const [distance, setDistance] = useState(3.2);
  const [isNavigating, setIsNavigating] = useState(false);

  const infoCardAnim = useRef(new Animated.Value(-120)).current;
  const buttonsAnim = useRef(new Animated.Value(120)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate panels in
    Animated.parallel([
      Animated.spring(infoCardAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      Animated.spring(buttonsAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Join order socket room
    const orderId = order?.orderId || order?.id || 'demo_id';
    socketService.joinOrder(orderId);

    // Simulate ETA countdown and location tracking
    const timer = setInterval(() => {
      setEta((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });

      // Emit simulated live location to customer
      socketService.emitLocation(orderId, PROVIDER_LOCATION.latitude, PROVIDER_LOCATION.longitude);

    }, 15000); // Decrement/emit every 15 seconds

    return () => clearInterval(timer);
  }, [order]);

  // Center map on both markers
  const fitToMarkers = () => {
    mapRef.current?.fitToCoordinates([PROVIDER_LOCATION, CUSTOMER_LOCATION], {
      edgePadding: { top: 160, right: 60, bottom: 200, left: 60 },
      animated: true,
    });
  };

  const handleCallCustomer = () => {
    const phone = order?.customer?.phone || '01012345678';
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() =>
      Alert.alert('خطأ', 'لا يمكن فتح تطبيق الاتصال.')
    );
  };

  const handleOpenNavigation = () => {
    const { latitude, longitude } = CUSTOMER_LOCATION;
    const url = `https://maps.google.com/?daddr=${latitude},${longitude}&travelmode=driving`;
    Linking.openURL(url).catch(() =>
      Alert.alert('خطأ', 'لا يمكن فتح خرائط جوجل.')
    );
  };

  const handleStartRepair = async () => {
    try {
      const orderId = order?.orderId || order?.id;
      if (orderId) {
        await providerApi.updateStatus(orderId, 'in_progress', 'بدء فحص وإصلاح السيارة');
      }
      navigation?.navigate('FaultDiagnosis', { order });
    } catch (err) {
      console.error('Failed to update status to in_progress', err);
      // Navigate anyway for demo/fallback
      navigation?.navigate('FaultDiagnosis', { order });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Full-Screen Map ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE}
        initialRegion={{
          latitude: 29.9660,
          longitude: 31.2527,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        }}
        onMapReady={fitToMarkers}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
      >
        {/* Route polyline */}
        <Polyline
          coordinates={ROUTE_COORDS}
          strokeWidth={4}
          strokeColor={colors.accent.primary}
          lineDashPattern={[1]}
        />

        {/* Provider Marker */}
        <Marker coordinate={PROVIDER_LOCATION} title="موقعك الحالي" anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.providerMarker}>
            <LinearGradient colors={['#D4A056', '#C4842D']} style={styles.markerInner}>
              <MaterialCommunityIcons name="truck-fast" size={18} color={colors.background.primary} />
            </LinearGradient>
            <View style={styles.markerTail} />
          </View>
        </Marker>

        {/* Customer Marker */}
        <Marker coordinate={CUSTOMER_LOCATION} title="موقع العميل" anchor={{ x: 0.5, y: 1 }}>
          <View style={styles.customerMarkerWrapper}>
            <View style={styles.customerMarker}>
              <MaterialCommunityIcons name="map-marker-account" size={22} color={colors.white} />
            </View>
            <View style={styles.customerMarkerLabel}>
              <Text style={styles.customerMarkerText}>{order?.customer?.name || 'العميل'}</Text>
            </View>
          </View>
        </Marker>
      </MapView>

      {/* ── ETA & Distance Info Card (top overlay) ── */}
      <Animated.View
        style={[
          styles.infoCard,
          { top: insets.top + spacing.sm },
          { transform: [{ translateY: infoCardAnim }] },
          { opacity: fadeAnim },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>

        <LinearGradient
          colors={['rgba(13,27,42,0.97)', 'rgba(10,21,32,0.97)']}
          style={styles.infoCardInner}
        >
          <View style={styles.infoMetric}>
            <MaterialCommunityIcons name="clock-fast" size={20} color={colors.accent.primary} />
            <View>
              <Text style={styles.infoMetricValue}>{eta} دقيقة</Text>
              <Text style={styles.infoMetricLabel}>وقت الوصول المتوقع</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoMetric}>
            <MaterialCommunityIcons name="map-marker-distance" size={20} color={colors.accent.emerald} />
            <View>
              <Text style={styles.infoMetricValue}>{distance} كم</Text>
              <Text style={styles.infoMetricLabel}>المسافة المتبقية</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoMetric}>
            <MaterialCommunityIcons name="cash" size={20} color={colors.status.warning} />
            <View>
              <Text style={styles.infoMetricValue}>{order?.estimatedPrice || 450} ج.م</Text>
              <Text style={styles.infoMetricLabel}>الأجر المتوقع</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── Map Controls (zoom, fit) ── */}
      <Animated.View style={[styles.mapControls, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.mapControlBtn} onPress={fitToMarkers}>
          <MaterialCommunityIcons name="fit-to-screen" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapControlBtn}
          onPress={() => mapRef.current?.animateCamera({ zoom: 15 }, { duration: 400 })}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapControlBtn}
          onPress={() => mapRef.current?.animateCamera({ zoom: 12 }, { duration: 400 })}
        >
          <MaterialCommunityIcons name="minus" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Bottom Action Buttons ── */}
      <Animated.View
        style={[
          styles.bottomPanel,
          { paddingBottom: insets.bottom + spacing.lg },
          { transform: [{ translateY: buttonsAnim }] },
        ]}
      >
        <LinearGradient colors={['rgba(10,21,32,0)', 'rgba(10,21,32,0.98)']} style={styles.bottomGradient}>
          {/* Secondary actions */}
          <View style={styles.secondaryButtons}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleCallCustomer} activeOpacity={0.8}>
              <MaterialCommunityIcons name="phone" size={22} color={colors.accent.emerald} />
              <Text style={styles.secondaryBtnText}>اتصال بالعميل</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleOpenNavigation} activeOpacity={0.8}>
              <MaterialCommunityIcons name="navigation" size={22} color={colors.accent.primary} />
              <Text style={styles.secondaryBtnText}>فتح الخريطة</Text>
            </TouchableOpacity>
          </View>

          {/* Primary CTA */}
          <TouchableOpacity onPress={handleStartRepair} activeOpacity={0.85}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.primaryBtn}>
              <MaterialCommunityIcons name="tools" size={22} color={colors.white} />
              <Text style={styles.primaryBtnText}>بدء الإصلاح</Text>
              <MaterialCommunityIcons name="arrow-left" size={18} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  map: { ...StyleSheet.absoluteFillObject },

  // Back button
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13,27,42,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },

  // Info card (top)
  infoCard: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: spacing.md,
  },
  infoMetric: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoMetricValue: { ...typography.label, color: colors.text.primary },
  infoMetricLabel: { ...typography.caption, color: colors.text.muted },
  infoDivider: { width: 1, height: 32, backgroundColor: colors.divider },

  // Map controls
  mapControls: {
    position: 'absolute',
    right: spacing.xl,
    top: '40%',
    gap: spacing.sm,
  },
  mapControlBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(13,27,42,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },

  // Provider marker
  providerMarker: { alignItems: 'center' },
  markerInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.white,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#C4842D',
  },

  // Customer marker
  customerMarkerWrapper: { alignItems: 'center' },
  customerMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.status.info,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.white,
    shadowColor: colors.status.info,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  customerMarkerLabel: {
    backgroundColor: colors.status.info,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 3,
  },
  customerMarkerText: { ...typography.caption, color: colors.white, fontWeight: '700' },

  // Bottom panel
  bottomPanel: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bottomGradient: { paddingTop: spacing['4xl'], paddingHorizontal: spacing.xl, gap: spacing.md },
  secondaryButtons: { flexDirection: 'row', gap: spacing.md },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  secondaryBtnText: { ...typography.label, color: colors.text.primary },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg + 2,
  },
  primaryBtnText: { ...typography.button, color: colors.white, flex: 1, textAlign: 'center' },
});

export default TrackingMapScreen;
