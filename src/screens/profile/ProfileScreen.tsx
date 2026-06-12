import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { logout, updateProfile } from '../../store/slices/authSlice';

interface Props {
  navigation?: any;
  route?: any;
}

const ProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const provider = useAppSelector((state) => state.auth.provider);
  const insets = useSafeAreaInsets();

  const isWinch = provider?.role === 'winch_driver';

  // Modal control states
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const [editName, setEditName] = useState(provider?.name || '');
  const [editEmail, setEditEmail] = useState(provider?.email || '');
  const [editPhone, setEditPhone] = useState(provider?.phone || '');
  
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (route?.params?.openModal) {
      setActiveModal(route.params.openModal);
    }
  }, [route?.params?.openModal]);

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
    loadAvatar();
  }, [provider?.phone]);

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('تنبيه', 'نحتاج إلى صلاحية الوصول إلى الصور لاختيار صورة شخصية.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setAvatarUri(selectedUri);
        await AsyncStorage.setItem(`@avatar_${provider?.phone || 'default'}`, selectedUri);
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة.');
    }
  };
  
  // Role-specific Edit fields
  const [editWinchPlate, setEditWinchPlate] = useState(
    provider?.role === 'winch_driver' ? (provider as any).winchPlateNumber || '' : ''
  );
  const [editWorkshopName, setEditWorkshopName] = useState(
    provider?.role === 'workshop_receptionist' ? (provider as any).workshopName || '' : ''
  );
  const [editAddress, setEditAddress] = useState(
    provider?.role === 'workshop_receptionist' ? (provider as any).address || '' : ''
  );

  // Notifications states
  const [notifRequests, setNotifRequests] = useState(true);
  const [notifWallet, setNotifWallet] = useState(true);
  const [notifSupport, setNotifSupport] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);

  // Support state
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');

  // Handle Edit Profile Save
  const handleSaveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاسم بالكامل');
      return;
    }
    if (!editPhone.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رقم الهاتف');
      return;
    }

    const updatedData: any = {
      name: editName,
      email: editEmail,
      phone: editPhone,
    };

    if (isWinch) {
      updatedData.winchPlateNumber = editWinchPlate;
    } else {
      updatedData.workshopName = editWorkshopName;
      updatedData.address = editAddress;
    }

    dispatch(updateProfile(updatedData));
    Alert.alert('تم التحديث', 'تم حفظ التعديلات بنجاح');
    setActiveModal(null);
  };

  // Handle Support Send
  const handleSendSupport = () => {
    if (!supportSubject.trim() || !supportMsg.trim()) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول لإرسال الرسالة');
      return;
    }
    Alert.alert(
      'تم الإرسال',
      'شكراً لتواصلك معنا. تم إرسال رسالتك بنجاح وسنقوم بالرد عليك في أقرب وقت.'
    );
    setSupportSubject('');
    setSupportMsg('');
    setActiveModal(null);
  };

  const menuItems = [
    { icon: 'account-edit-outline', label: 'تعديل البيانات الشخصية', screen: 'EditProfile' },
    { icon: 'file-document-multiple-outline', label: 'المستندات والتوثيق', screen: 'Documents' },
    { icon: 'chart-bar', label: 'إحصائيات الأداء', screen: 'Stats' },
    { icon: 'comment-quote-outline', label: 'التقييمات والآراء', screen: 'Reviews' },
    { icon: 'bell-cog-outline', label: 'إعدادات الإشعارات', screen: 'Notifications' },
    { icon: 'face-agent', label: 'الدعم والمساعدة', screen: 'Support' },
    { icon: 'shield-text-outline', label: 'الشروط والأحكام', screen: 'Terms' },
  ];

  // Helper component to render Modal Headers consistently
  const renderModalHeader = (title: string) => (
    <View style={styles.modalHeader}>
      <TouchableOpacity 
        style={styles.modalCloseButton} 
        onPress={() => setActiveModal(null)}
      >
        <Ionicons name="close" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.modalTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0A1520', '#0D2B2D', '#0A1520']} style={styles.gradient}>
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]} 
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <LinearGradient
              colors={['rgba(212,160,86,0.12)', 'rgba(13,43,45,0.5)']}
              style={styles.profileGradient}
            >
              <TouchableOpacity style={styles.avatarLarge} onPress={handlePickAvatar} activeOpacity={0.8}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={[styles.avatarGradient, { resizeMode: 'cover' }]} />
                ) : (
                  <LinearGradient colors={['#D4A056', '#C4842D']} style={styles.avatarGradient}>
                    <Text style={styles.avatarText}>
                      {(provider?.name || 'أ').charAt(0)}
                    </Text>
                  </LinearGradient>
                )}
                <View style={styles.editAvatarBadge}>
                  <MaterialCommunityIcons name="camera" size={14} color={colors.background.primary} />
                </View>
              </TouchableOpacity>
              <Text style={styles.profileName}>{provider?.name || 'شريك أوتو جو'}</Text>
              
              <View style={styles.roleTagContainer}>
                <MaterialCommunityIcons 
                  name={isWinch ? 'tow-truck' : 'garage-open'} 
                  size={16} 
                  color={colors.accent.primary} 
                />
                <Text style={styles.profileRole}>
                  {isWinch ? 'سائق ونش إنقاذ' : 'مركز صيانة معتمد'}
                </Text>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.profileStat}>
                  <View style={styles.statValueContainer}>
                    <Ionicons name="star" size={16} color={colors.accent.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.profileStatValue}>{provider?.rating || 4.8}</Text>
                  </View>
                  <Text style={styles.profileStatLabel}>التقييم</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatValue}>{provider?.totalJobs || 156}</Text>
                  <Text style={styles.profileStatLabel}>عملية مكتملة</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStat}>
                  <View style={[
                    styles.verifiedBadge,
                    provider?.isVerified ? styles.verifiedBadgeActive : styles.verifiedBadgePending,
                  ]}>
                    <MaterialCommunityIcons 
                      name={provider?.isVerified ? 'check-decagram' : 'clock-outline'} 
                      size={12} 
                      color={provider?.isVerified ? colors.accent.emerald : colors.accent.primary} 
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[
                      styles.verifiedText, 
                      { color: provider?.isVerified ? colors.accent.emerald : colors.accent.primary }
                    ]}>
                      {provider?.isVerified ? 'موثق' : 'مراجعة'}
                    </Text>
                  </View>
                  <Text style={styles.profileStatLabel}>الحالة</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && { borderBottomWidth: 0 }
                ]} 
                activeOpacity={0.7}
                onPress={() => setActiveModal(item.screen)}
              >
                <View style={styles.menuIconContainer}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.accent.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-back" size={16} color={colors.text.muted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                'تسجيل الخروج',
                'هل أنت متأكد من رغبتك في تسجيل الخروج من التطبيق؟',
                [
                  { text: 'إلغاء', style: 'cancel' },
                  { text: 'نعم، خروج', style: 'destructive', onPress: () => dispatch(logout()) }
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="logout" size={20} color={colors.status.error} />
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
          </TouchableOpacity>

          {/* Version */}
          <Text style={styles.version}>AutoGo Partners v1.1.0</Text>
        </ScrollView>
      </LinearGradient>

      {/* ==================== MODAL: EDIT PROFILE ==================== */}
      <Modal visible={activeModal === 'EditProfile'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            {renderModalHeader('تعديل البيانات الشخصية')}
            
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الاسم بالكامل</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="أدخل الاسم ثلاثي أو رباعي"
                  placeholderTextColor={colors.input.placeholder}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>رقم الجوال</Text>
                <TextInput
                  style={styles.input}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                  placeholder="01xxxxxxxxx"
                  placeholderTextColor={colors.input.placeholder}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>البريد الإلكتروني (اختياري)</Text>
                <TextInput
                  style={styles.input}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  placeholder="name@example.com"
                  placeholderTextColor={colors.input.placeholder}
                  autoCapitalize="none"
                />
              </View>

              {isWinch ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>رقم لوحة الونش</Text>
                  <TextInput
                    style={styles.input}
                    value={editWinchPlate}
                    onChangeText={setEditWinchPlate}
                    placeholder="مثال: أ ب ج ١ ٢ ٣ ٤"
                    placeholderTextColor={colors.input.placeholder}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>اسم مركز الصيانة</Text>
                    <TextInput
                      style={styles.input}
                      value={editWorkshopName}
                      onChangeText={setEditWorkshopName}
                      placeholder="اسم المركز أو الورشة"
                      placeholderTextColor={colors.input.placeholder}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>عنوان المركز</Text>
                    <TextInput
                      style={styles.input}
                      value={editAddress}
                      onChangeText={setEditAddress}
                      placeholder="العنوان التفصيلي للمركز"
                      placeholderTextColor={colors.input.placeholder}
                    />
                  </View>
                </>
              )}

              <TouchableOpacity 
                style={styles.saveButton}
                activeOpacity={0.8}
                onPress={handleSaveProfile}
              >
                <LinearGradient colors={colors.gradient.gold} style={styles.buttonGradient}>
                  <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ==================== MODAL: DOCUMENTS ==================== */}
      <Modal visible={activeModal === 'Documents'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {renderModalHeader('المستندات والتوثيق')}
            
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.infoAlert}>
                <Ionicons name="information-circle" size={20} color={colors.accent.primary} />
                <Text style={styles.infoAlertText}>
                  هذه المستندات معتمدة لتوثيق حسابك وتقديم الخدمات على شبكة AutoGO.
                </Text>
              </View>

              {isWinch ? (
                <>
                  <View style={styles.docCard}>
                    <View style={styles.docIconWrapper}>
                      <MaterialCommunityIcons name="card-account-details-outline" size={28} color={colors.accent.primary} />
                    </View>
                    <View style={styles.docDetails}>
                      <Text style={styles.docTitle}>بطاقة الرقم القومي</Text>
                      <Text style={styles.docMeta}>تم التحديث: 2026-05-10</Text>
                    </View>
                    <View style={[styles.docStatusBadge, styles.badgeSuccess]}>
                      <Text style={styles.docStatusText}>موثق</Text>
                    </View>
                  </View>

                  <View style={styles.docCard}>
                    <View style={styles.docIconWrapper}>
                      <MaterialCommunityIcons name="card-bulleted-settings-outline" size={28} color={colors.accent.primary} />
                    </View>
                    <View style={styles.docDetails}>
                      <Text style={styles.docTitle}>رخصة القيادة المهنية</Text>
                      <Text style={styles.docMeta}>تاريخ الانتهاء: 2029-12-30</Text>
                    </View>
                    <View style={[styles.docStatusBadge, styles.badgeSuccess]}>
                      <Text style={styles.docStatusText}>موثق</Text>
                    </View>
                  </View>

                  <View style={styles.docCard}>
                    <View style={styles.docIconWrapper}>
                      <MaterialCommunityIcons name="tow-truck" size={28} color={colors.accent.primary} />
                    </View>
                    <View style={styles.docDetails}>
                      <Text style={styles.docTitle}>رخصة تشغيل الونش</Text>
                      <Text style={styles.docMeta}>لوحة رقم: {provider?.role === 'winch_driver' ? (provider as any).winchPlateNumber || 'أ ب ج ١٢٣' : 'أ ب ج ١٢٣'}</Text>
                    </View>
                    <View style={[styles.docStatusBadge, styles.badgeSuccess]}>
                      <Text style={styles.docStatusText}>موثق</Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.docCard}>
                    <View style={styles.docIconWrapper}>
                      <MaterialCommunityIcons name="file-document-multiple-outline" size={28} color={colors.accent.primary} />
                    </View>
                    <View style={styles.docDetails}>
                      <Text style={styles.docTitle}>السجل التجاري</Text>
                      <Text style={styles.docMeta}>رقم السجل: 87462-أ</Text>
                    </View>
                    <View style={[styles.docStatusBadge, styles.badgeSuccess]}>
                      <Text style={styles.docStatusText}>موثق</Text>
                    </View>
                  </View>

                  <View style={styles.docCard}>
                    <View style={styles.docIconWrapper}>
                      <MaterialCommunityIcons name="file-percent-outline" size={28} color={colors.accent.primary} />
                    </View>
                    <View style={styles.docDetails}>
                      <Text style={styles.docTitle}>البطاقة الضريبية</Text>
                      <Text style={styles.docMeta}>رقم التسجيل: 456-112-984</Text>
                    </View>
                    <View style={[styles.docStatusBadge, styles.badgeSuccess]}>
                      <Text style={styles.docStatusText}>موثق</Text>
                    </View>
                  </View>

                  <View style={styles.docCard}>
                    <View style={styles.docIconWrapper}>
                      <MaterialCommunityIcons name="store-outline" size={28} color={colors.accent.primary} />
                    </View>
                    <View style={styles.docDetails}>
                      <Text style={styles.docTitle}>الترخيص البلدي وصور المركز</Text>
                      <Text style={styles.docMeta}>تم التحديث: 2026-05-12</Text>
                    </View>
                    <View style={[styles.docStatusBadge, styles.badgeSuccess]}>
                      <Text style={styles.docStatusText}>موثق</Text>
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity 
                style={styles.uploadDocBtn}
                onPress={() => Alert.alert('تحديث المستندات', 'يرجى التواصل مع الدعم الفني لتحديث المستندات الرسمية.')}
              >
                <MaterialCommunityIcons name="cloud-upload-outline" size={20} color={colors.accent.primary} style={{ marginLeft: 8 }} />
                <Text style={styles.uploadDocText}>تحديث أو إرسال مستند جديد</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL: STATS ==================== */}
      <Modal visible={activeModal === 'Stats'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {renderModalHeader('إحصائيات الأداء والعمل')}
            
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Top Row Cards */}
              <View style={styles.statsCardsRow}>
                <View style={styles.statMiniCard}>
                  <MaterialCommunityIcons name="currency-usd" size={22} color={colors.accent.primary} />
                  <Text style={styles.miniCardVal}>24,500</Text>
                  <Text style={styles.miniCardLbl}>الأرباح الكلية (ج.م)</Text>
                </View>
                <View style={styles.statMiniCard}>
                  <MaterialCommunityIcons name="check-all" size={22} color={colors.accent.emerald} />
                  <Text style={styles.miniCardVal}>{provider?.totalJobs || 156}</Text>
                  <Text style={styles.miniCardLbl}>طلبات منتهية</Text>
                </View>
              </View>

              {/* Progress Stat */}
              <View style={styles.largeStatCard}>
                <View style={styles.statCardHeader}>
                  <Text style={styles.largeCardTitle}>معدل قبول الطلبات</Text>
                  <Text style={styles.largeCardHighlight}>98%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '98%' }]} />
                </View>
                <Text style={styles.statExplanation}>ممتاز! معدل قبولك مرتفع ويساعدك في الحصول على طلبات أكثر.</Text>
              </View>

              {/* Simulated Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>أرباح الأيام الأخيرة (ج.م)</Text>
                
                <View style={styles.chartContainer}>
                  <View style={styles.chartYAxis}>
                    <Text style={styles.yAxisText}>1200</Text>
                    <Text style={styles.yAxisText}>800</Text>
                    <Text style={styles.yAxisText}>400</Text>
                    <Text style={styles.yAxisText}>0</Text>
                  </View>
                  
                  <View style={styles.chartBarsArea}>
                    {[
                      { label: 'س', val: 700, height: 70 },
                      { label: 'ح', val: 950, height: 95 },
                      { label: 'ن', val: 1100, height: 110 },
                      { label: 'ث', val: 400, height: 40 },
                      { label: 'ر', val: 650, height: 65 },
                      { label: 'خ', val: 800, height: 80 },
                      { label: 'ج', val: 1200, height: 120 },
                    ].map((bar, i) => (
                      <View key={i} style={styles.barColumn}>
                        <View style={styles.barOuter}>
                          <LinearGradient 
                            colors={colors.gradient.gold} 
                            style={[styles.barInner, { height: bar.height }]} 
                          />
                        </View>
                        <Text style={styles.barLabel}>{bar.label}</Text>
                        <Text style={styles.barVal}>{bar.val}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL: REVIEWS ==================== */}
      <Modal visible={activeModal === 'Reviews'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {renderModalHeader('تقييمات وآراء العملاء')}
            
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.ratingSummaryCard}>
                <View style={styles.ratingSummaryLeft}>
                  <Text style={styles.summaryBigRating}>{provider?.rating || 4.8}</Text>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons 
                        key={s} 
                        name={s <= Math.round(provider?.rating || 4.8) ? 'star' : 'star-outline'} 
                        size={16} 
                        color={colors.accent.primary} 
                      />
                    ))}
                  </View>
                  <Text style={styles.summaryTotalText}>من 156 تقييم</Text>
                </View>
                <View style={styles.ratingSummaryRight}>
                  <View style={styles.percentageRow}>
                    <Text style={styles.rowPercentLabel}>5 نجوم</Text>
                    <View style={styles.rowPercentBarBg}>
                      <View style={[styles.rowPercentBarFill, { width: '85%' }]} />
                    </View>
                    <Text style={styles.rowPercentVal}>85%</Text>
                  </View>
                  <View style={styles.percentageRow}>
                    <Text style={styles.rowPercentLabel}>4 نجوم</Text>
                    <View style={styles.rowPercentBarBg}>
                      <View style={[styles.rowPercentBarFill, { width: '12%' }]} />
                    </View>
                    <Text style={styles.rowPercentVal}>12%</Text>
                  </View>
                  <View style={styles.percentageRow}>
                    <Text style={styles.rowPercentLabel}>3 نجوم</Text>
                    <View style={styles.rowPercentBarBg}>
                      <View style={[styles.rowPercentBarFill, { width: '3%' }]} />
                    </View>
                    <Text style={styles.rowPercentVal}>3%</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionHeader}>أحدث الآراء</Text>

              {[
                { name: 'محمد أحمد', date: 'منذ ساعتين', rate: 5, comment: 'شخص مهذب جداً ووصل في الوقت المحدد وقام بسحب السيارة بحرص شديد، شكراً جزيلاً له!' },
                { name: 'أحمد محمود', date: 'أمس', rate: 5, comment: 'مركز ممتاز والخدمة سريعة للغاية، التعامل كان راقي جداً والأسعار واضحة.' },
                { name: 'ياسر كريم', date: 'منذ يومين', rate: 4, comment: 'محترف وملتزم وسريع الاستجابة. أوصي بالتعامل معه.' },
                { name: 'مصطفى علي', date: 'منذ 4 أيام', rate: 5, comment: 'من أفضل مزودي الخدمة في التطبيق، تعامل ممتاز جداً.' }
              ].map((rev, index) => (
                <View key={index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewUserArea}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>{rev.name.charAt(0)}</Text>
                      </View>
                      <View style={{ marginRight: spacing.sm }}>
                        <Text style={styles.reviewUserName}>{rev.name}</Text>
                        <Text style={styles.reviewUserDate}>{rev.date}</Text>
                      </View>
                    </View>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons 
                          key={s} 
                          name={s <= rev.rate ? 'star' : 'star-outline'} 
                          size={12} 
                          color={colors.accent.primary} 
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL: NOTIFICATIONS ==================== */}
      <Modal visible={activeModal === 'Notifications'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {renderModalHeader('إعدادات الإشعارات')}
            
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.settingSwitchRow}>
                <View style={styles.settingTextContent}>
                  <Text style={styles.settingTitle}>إشعارات الطلبات الجديدة</Text>
                  <Text style={styles.settingDesc}>إرسال تنبيه فوري عند تلقي طلب سحب أو صيانة جديد في نطاقك.</Text>
                </View>
                <Switch
                  value={notifRequests}
                  onValueChange={setNotifRequests}
                  trackColor={{ false: '#1A202C', true: colors.accent.glow }}
                  thumbColor={notifRequests ? colors.accent.primary : '#A0AEC0'}
                />
              </View>

              <View style={styles.settingSwitchRow}>
                <View style={styles.settingTextContent}>
                  <Text style={styles.settingTitle}>تحديثات المحفظة والمدفوعات</Text>
                  <Text style={styles.settingDesc}>تنبيهات عند إيداع أرباح العمليات أو اكتمال عمليات سحب الرصيد.</Text>
                </View>
                <Switch
                  value={notifWallet}
                  onValueChange={setNotifWallet}
                  trackColor={{ false: '#1A202C', true: colors.accent.glow }}
                  thumbColor={notifWallet ? colors.accent.primary : '#A0AEC0'}
                />
              </View>

              <View style={styles.settingSwitchRow}>
                <View style={styles.settingTextContent}>
                  <Text style={styles.settingTitle}>رسائل الدعم والمساعدة</Text>
                  <Text style={styles.settingDesc}>استلام تنبيه عند رد فريق الدعم الفني على استفساراتك.</Text>
                </View>
                <Switch
                  value={notifSupport}
                  onValueChange={setNotifSupport}
                  trackColor={{ false: '#1A202C', true: colors.accent.glow }}
                  thumbColor={notifSupport ? colors.accent.primary : '#A0AEC0'}
                />
              </View>

              <View style={styles.settingSwitchRow}>
                <View style={styles.settingTextContent}>
                  <Text style={styles.settingTitle}>العروض والخصومات والرسائل الترويجية</Text>
                  <Text style={styles.settingDesc}>إشعارات حول الميزات الجديدة، التحديثات الهامة، والمكافآت الحصرية للشركاء.</Text>
                </View>
                <Switch
                  value={notifPromos}
                  onValueChange={setNotifPromos}
                  trackColor={{ false: '#1A202C', true: colors.accent.glow }}
                  thumbColor={notifPromos ? colors.accent.primary : '#A0AEC0'}
                />
              </View>

              <TouchableOpacity 
                style={styles.saveButton}
                activeOpacity={0.8}
                onPress={() => {
                  Alert.alert('حفظ الإعدادات', 'تم حفظ تفضيلات الإشعارات بنجاح.');
                  setActiveModal(null);
                }}
              >
                <LinearGradient colors={colors.gradient.gold} style={styles.buttonGradient}>
                  <Text style={styles.saveButtonText}>حفظ الإعدادات</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL: SUPPORT ==================== */}
      <Modal visible={activeModal === 'Support'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            {renderModalHeader('الدعم الفني والمساعدة')}
            
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.supportCardsRow}>
                <TouchableOpacity 
                  style={styles.supportContactCard}
                  onPress={() => Alert.alert('اتصال هاتفي', 'يرجى الاتصال بخدمة العملاء المباشرة على الرقم: 19999')}
                >
                  <Ionicons name="call" size={24} color={colors.accent.primary} />
                  <Text style={styles.supportCardTitle}>اتصل بنا</Text>
                  <Text style={styles.supportCardMeta}>19999 (24/7)</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.supportContactCard}
                  onPress={() => Alert.alert('محادثة فورية', 'ميزة المحادثة الفورية مع الدعم ستتوفر قريباً.')}
                >
                  <MaterialCommunityIcons name="chat-processing-outline" size={24} color={colors.accent.primary} />
                  <Text style={styles.supportCardTitle}>محادثة مباشرة</Text>
                  <Text style={styles.supportCardMeta}>متصل الآن</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionHeader}>إرسال رسالة تذكرة دعم</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>عنوان المشكلة / الموضوع</Text>
                <TextInput
                  style={styles.input}
                  value={supportSubject}
                  onChangeText={setSupportSubject}
                  placeholder="مثال: مشكلة في سحب الرصيد"
                  placeholderTextColor={colors.input.placeholder}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>تفاصيل المشكلة بالتفصيل</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={supportMsg}
                  onChangeText={setSupportMsg}
                  multiline
                  numberOfLines={5}
                  placeholder="اكتب هنا تفاصيل المشكلة التي تواجهها لكي نتمكن من مساعدتك..."
                  placeholderTextColor={colors.input.placeholder}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity 
                style={styles.saveButton}
                activeOpacity={0.8}
                onPress={handleSendSupport}
              >
                <LinearGradient colors={colors.gradient.gold} style={styles.buttonGradient}>
                  <Text style={styles.saveButtonText}>إرسال الرسالة</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ==================== MODAL: TERMS ==================== */}
      <Modal visible={activeModal === 'Terms'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {renderModalHeader('الشروط والأحكام')}
            
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.termsTitle}>اتفاقية استخدام شريك AutoGO</Text>
              <Text style={styles.termsDate}>آخر تحديث: مايو 2026</Text>

              <Text style={styles.termsText}>
                مرحباً بك في شبكة شركاء AutoGO. تنظم هذه الاتفاقية العلاقة القانونية والمهنية بين منصة AutoGO ومزودي خدمات المساعدة على الطريق (سائقي الأوناش ومراكز الصيانة).
              </Text>

              <Text style={styles.termsSubtitle}>1. الالتزام بالمعايير المهنية</Text>
              <Text style={styles.termsText}>
                يتعهد مزود الخدمة بتقديم خدماته بأعلى درجات الاحترافية والأمان، والمحافظة على سلامة مركبات العملاء أثناء عمليات النقل أو الصيانة، والالتزام بأسعار الخدمة المحددة مسبقاً من خلال التطبيق دون زيادة.
              </Text>

              <Text style={styles.termsSubtitle}>2. الرسوم والمدفوعات</Text>
              <Text style={styles.termsText}>
                تتقاضى المنصة نسبة مئوية متفق عليها من قيمة كل عملية مكتملة. يتم تحويل المستحقات إلى محفظة شريك العمل داخل التطبيق فور اكتمال الخدمة وتأكيد العميل، ويحق للشريك سحب مستحقاته عبر وسائل الدفع المتاحة بموجب الشروط الخاصة بكل وسيلة.
              </Text>

              <Text style={styles.termsSubtitle}>3. السلوك العام والتقييمات</Text>
              <Text style={styles.termsText}>
                يخضع جميع شركاء الخدمة لنظام تقييم مباشر من قبل العملاء. تحتفظ المنصة بالحق الكامل في تعليق أو حظر أي حساب ينخفض تقييمه العام عن الحد المقبول (4.0 نجوم) أو عند تلقي شكاوى متكررة تتعلق بسوء المعاملة أو عدم الأمانة.
              </Text>

              <Text style={styles.termsSubtitle}>4. حماية البيانات والخصوصية</Text>
              <Text style={styles.termsText}>
                يجب على الشريك عدم الاحتفاظ بأي بيانات شخصية خاصة بالعملاء (مثل أرقام الهواتف أو العناوين) أو مشاركتها خارج نطاق تقديم الخدمة المحدد. أي انتهاك لخصوصية العملاء يعرض الحساب للإيقاف الفوري والمساءلة القانونية.
              </Text>

              <Text style={styles.termsSubtitle}>5. تعديل شروط الخدمة</Text>
              <Text style={styles.termsText}>
                تحتفظ AutoGO بالحق في مراجعة وتحديث هذه الشروط دورياً. سيتم إشعار الشركاء بأي تعديلات هامة من خلال التطبيق، ويُعتبر استمرار استخدام التطبيق بعد التعديل موافقة ضمنية على الشروط الجديدة.
              </Text>

              <View style={{ height: spacing['2xl'] }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  gradient: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  // Profile Card
  profileCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(212,160,86,0.15)',
  },
  profileGradient: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  avatarLarge: { marginBottom: spacing.md },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212,160,86,0.3)',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  avatarText: { fontSize: 32, color: colors.background.primary, fontWeight: '700' },
  profileName: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  roleTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212,160,86,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xl,
    gap: 6,
  },
  profileRole: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  profileStat: {
    flex: 1,
    alignItems: 'center',
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  profileStatValue: {
    ...typography.h4,
    color: colors.text.primary,
  },
  profileStatLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  profileStatDivider: {
    width: 1,
    backgroundColor: colors.divider,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: 2,
  },
  verifiedBadgeActive: { backgroundColor: 'rgba(16,185,129,0.12)' },
  verifiedBadgePending: { backgroundColor: 'rgba(212,160,86,0.12)' },
  verifiedText: { 
    ...typography.caption, 
    fontSize: 10,
    fontWeight: '700',
  },
  // Menu
  menuContainer: {
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.background.glassBorder,
    overflow: 'hidden',
    marginBottom: spacing['2xl'],
  },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.md,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(212, 160, 86, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  // Logout
  logoutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  logoutText: {
    ...typography.label,
    color: colors.status.error,
  },
  version: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
  },
  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 14, 23, 0.92)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.background.dark,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  modalScroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 60,
  },
  // Edit Profile Inputs
  inputGroup: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'right',
  },
  input: {
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.input.text,
    ...typography.body,
    textAlign: 'right',
  },
  textArea: {
    height: 120,
  },
  saveButton: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    height: 52,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.button,
    color: colors.button.primaryText,
  },
  // Documents Style
  infoAlert: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(212,160,86,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,86,0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  infoAlertText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
    textAlign: 'right',
  },
  docCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  docIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(212,160,86,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.lg,
  },
  docDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  docTitle: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: 4,
  },
  docMeta: {
    ...typography.caption,
    color: colors.text.muted,
  },
  docStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  docStatusText: {
    ...typography.caption,
    color: colors.accent.emerald,
    fontWeight: '700',
  },
  uploadDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  uploadDocText: {
    ...typography.label,
    color: colors.accent.primary,
  },
  // Stats Styles
  statsCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  statMiniCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  miniCardVal: {
    ...typography.h3,
    color: colors.text.primary,
    marginVertical: 4,
  },
  miniCardLbl: {
    ...typography.caption,
    color: colors.text.muted,
  },
  largeStatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  statCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  largeCardTitle: {
    ...typography.label,
    color: colors.text.primary,
  },
  largeCardHighlight: {
    ...typography.h4,
    color: colors.accent.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 4,
  },
  statExplanation: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  chartTitle: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.xl,
    textAlign: 'right',
  },
  chartContainer: {
    flexDirection: 'row-reverse',
    height: 160,
    alignItems: 'flex-end',
  },
  chartYAxis: {
    width: 40,
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 10,
    marginLeft: spacing.sm,
  },
  yAxisText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  chartBarsArea: {
    flex: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    height: '100%',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.sm,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barOuter: {
    height: 120,
    justifyContent: 'flex-end',
  },
  barInner: {
    width: 14,
    borderRadius: borderRadius.sm,
  },
  barLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 4,
  },
  barVal: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.muted,
    marginTop: 2,
  },
  // Reviews Style
  ratingSummaryCard: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  ratingSummaryLeft: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  summaryBigRating: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text.primary,
    lineHeight: 52,
  },
  starsContainer: {
    flexDirection: 'row-reverse',
    gap: 2,
    marginVertical: 4,
  },
  summaryTotalText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  ratingSummaryRight: {
    flex: 2,
    paddingRight: spacing.lg,
    justifyContent: 'center',
  },
  percentageRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
    gap: spacing.sm,
  },
  rowPercentLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    width: 45,
    textAlign: 'right',
  },
  rowPercentBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
  },
  rowPercentBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 3,
  },
  rowPercentVal: {
    ...typography.caption,
    color: colors.text.muted,
    width: 25,
  },
  sectionHeader: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'right',
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reviewUserArea: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212,160,86,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    ...typography.label,
    color: colors.accent.primary,
  },
  reviewUserName: {
    ...typography.label,
    color: colors.text.primary,
    textAlign: 'right',
  },
  reviewUserDate: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'right',
  },
  reviewComment: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'right',
    lineHeight: 20,
  },
  // Notifications Style
  settingSwitchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.lg,
  },
  settingTextContent: {
    flex: 1,
  },
  settingTitle: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'right',
  },
  settingDesc: {
    ...typography.bodySmall,
    color: colors.text.muted,
    textAlign: 'right',
    lineHeight: 18,
  },
  // Support style
  supportCardsRow: {
    flexDirection: 'row-reverse',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  supportContactCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  supportCardTitle: {
    ...typography.label,
    color: colors.text.primary,
  },
  supportCardMeta: {
    ...typography.caption,
    color: colors.accent.primary,
    fontWeight: '700',
  },
  // Terms style
  termsTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'right',
    marginBottom: 4,
  },
  termsDate: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'right',
    marginBottom: spacing.xl,
  },
  termsSubtitle: {
    ...typography.h4,
    color: colors.accent.primary,
    textAlign: 'right',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  termsText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
});

export default ProfileScreen;
