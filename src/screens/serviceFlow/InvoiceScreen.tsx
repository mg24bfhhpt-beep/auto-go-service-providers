import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { providerApi } from '../../services/providerApi';

interface Props {
  navigation?: any;
  route?: any;
}

// ─── Invoice Generator ────────────────────────────────────────────────────────
const generateInvoiceNumber = () => {
  const now = new Date();
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// ─── Line Item Component ──────────────────────────────────────────────────────
const LineItem = ({
  label,
  value,
  isTotal = false,
  isDiscount = false,
}: {
  label: string;
  value: string;
  isTotal?: boolean;
  isDiscount?: boolean;
}) => (
  <View style={[styles.lineItem, isTotal && styles.lineItemTotal]}>
    <Text style={[styles.lineItemLabel, isTotal && styles.lineItemTotalLabel]}>{label}</Text>
    <Text
      style={[
        styles.lineItemValue,
        isTotal && styles.lineItemTotalValue,
        isDiscount && { color: colors.status.success },
      ]}
    >
      {value}
    </Text>
  </View>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, color = colors.accent.primary }: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  color?: string;
}) => (
  <View style={styles.sectionHeader}>
    <MaterialCommunityIcons name={icon} size={18} color={color} />
    <Text style={[styles.sectionHeaderText, { color }]}>{title}</Text>
  </View>
);

// ─── HTML Invoice Template ────────────────────────────────────────────────────
const buildInvoiceHTML = (data: {
  invoiceNumber: string;
  date: string;
  customer: { name: string; phone: string };
  vehicle: { type: string; plate: string };
  categories: string[];
  serviceTotal: number;
  partsTotal: number;
  extraFees: number;
  vat: number;
  total: number;
  paymentMethod: string;
}) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
  body { background: #f4f7fa; padding: 30px; }
  .invoice { background: white; border-radius: 12px; padding: 40px; max-width: 700px; margin: 0 auto; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #E2E8F0; }
  .brand { display: flex; flex-direction: column; gap: 4px; }
  .brand-name { font-size: 28px; font-weight: 800; color: #D4A056; }
  .brand-sub { font-size: 13px; color: #64748B; }
  .invoice-meta { text-align: left; }
  .invoice-num { font-size: 16px; font-weight: 700; color: #1E293B; }
  .invoice-date { font-size: 13px; color: #64748B; margin-top: 4px; }
  .badge { display: inline-block; background: #D4A05620; color: #D4A056; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 8px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 13px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .info-item { background: #F8FAFC; border-radius: 8px; padding: 12px; }
  .info-label { font-size: 11px; color: #94A3B8; margin-bottom: 4px; }
  .info-value { font-size: 14px; font-weight: 600; color: #1E293B; }
  .services-table { width: 100%; border-collapse: collapse; }
  .services-table th { background: #F1F5F9; padding: 10px 14px; font-size: 12px; color: #64748B; text-align: right; }
  .services-table td { padding: 12px 14px; font-size: 14px; color: #1E293B; border-bottom: 1px solid #E2E8F0; }
  .totals { background: #F8FAFC; border-radius: 10px; padding: 20px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #1E293B; }
  .total-row.grand { border-top: 2px solid #D4A056; margin-top: 8px; padding-top: 12px; font-size: 20px; font-weight: 800; color: #D4A056; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #E2E8F0; text-align: center; color: #94A3B8; font-size: 12px; }
</style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <div class="brand">
      <div class="brand-name">AutoGO</div>
      <div class="brand-sub">شبكة الخدمات المتخصصة</div>
      <div class="badge">فاتورة ضريبية</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-num">${data.invoiceNumber}</div>
      <div class="invoice-date">${data.date}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">بيانات العميل والمركبة</div>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">اسم العميل</div><div class="info-value">${data.customer.name}</div></div>
      <div class="info-item"><div class="info-label">رقم الهاتف</div><div class="info-value">${data.customer.phone}</div></div>
      <div class="info-item"><div class="info-label">نوع السيارة</div><div class="info-value">${data.vehicle.type}</div></div>
      <div class="info-item"><div class="info-label">رقم اللوحة</div><div class="info-value">${data.vehicle.plate}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">تفاصيل الخدمة</div>
    <table class="services-table">
      <thead><tr><th>الخدمة</th><th>الوصف</th><th>السعر</th></tr></thead>
      <tbody>
        ${data.categories.map((cat) => `<tr><td>${cat}</td><td>خدمة إصلاح وصيانة</td><td>${Math.floor(data.serviceTotal / data.categories.length)} ج.م</td></tr>`).join('')}
        ${data.partsTotal > 0 ? `<tr><td>قطع الغيار</td><td>قطع غيار أصلية</td><td>${data.partsTotal} ج.م</td></tr>` : ''}
        ${data.extraFees > 0 ? `<tr><td>رسوم إضافية</td><td>رسوم الانتقال والتشخيص</td><td>${data.extraFees} ج.م</td></tr>` : ''}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="total-row"><span>إجمالي الخدمات</span><span>${data.serviceTotal} ج.م</span></div>
    <div class="total-row"><span>قطع الغيار</span><span>${data.partsTotal} ج.م</span></div>
    <div class="total-row"><span>رسوم إضافية</span><span>${data.extraFees} ج.م</span></div>
    <div class="total-row"><span>ضريبة القيمة المضافة (14%)</span><span>${data.vat} ج.م</span></div>
    <div class="total-row grand"><span>الإجمالي النهائي</span><span>${data.total} ج.م</span></div>
  </div>

  <div class="section" style="margin-top:24px">
    <div class="section-title">طريقة السداد</div>
    <div class="info-item" style="display:inline-block;padding:10px 20px">${data.paymentMethod}</div>
  </div>

  <div class="footer">
    شكراً لاختياركم AutoGO | للاستفسار: 19999 | autogo.com.eg<br>
    هذه فاتورة إلكترونية معتمدة ولا تحتاج إلى توقيع
  </div>
</div>
</body>
</html>
`;

// ─── Main Screen ──────────────────────────────────────────────────────────────
const InvoiceScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const order = route?.params?.order;
  const diagnosis = route?.params?.diagnosis;

  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('نقدي');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Calculate Financials ──
  const invoiceNumber = generateInvoiceNumber();
  const invoiceDate = formatDate(new Date());
  const serviceTotal = diagnosis?.estimatedCost || order?.estimatedPrice || 450;
  const partsTotal = diagnosis?.spareParts ? 120 : 0;
  const extraFees = 50;
  const subtotal = serviceTotal + partsTotal + extraFees;
  const vatRate = 0.14;
  const vatAmount = Math.round(subtotal * vatRate);
  const total = subtotal + vatAmount;

  const PAYMENT_METHODS = ['نقدي', 'فيزا / ماستر كارد', 'فودافون كاش', 'إنستاباي'];

  const buildData = () => ({
    invoiceNumber,
    date: invoiceDate,
    customer: {
      name: order?.customer?.name || 'محمود عبد الرحمن',
      phone: order?.customer?.phone || '0101 234 5678',
    },
    vehicle: {
      type: order?.vehicle?.type || 'Toyota Corolla 2022',
      plate: order?.vehicle?.plate || 'أ ب ج ١٢٣٤',
    },
    categories: diagnosis?.categories || ['إصلاح المحرك'],
    serviceTotal,
    partsTotal,
    extraFees,
    vat: vatAmount,
    total,
    paymentMethod: selectedPayment,
  });

  const handlePrintPDF = async () => {
    setIsPrinting(true);
    try {
      const html = buildInvoiceHTML(buildData());
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'تحميل الفاتورة',
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Print.printAsync({ uri });
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء ملف PDF.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShareInvoice = async () => {
    setIsSharing(true);
    try {
      const html = buildInvoiceHTML(buildData());
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'مشاركة الفاتورة',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      // Fallback to text share
      await Share.share({
        message: `فاتورة AutoGO\nرقم: ${invoiceNumber}\nإجمالي: ${total} ج.م\nالعميل: ${order?.customer?.name || 'محمود عبد الرحمن'}`,
        title: `فاتورة ${invoiceNumber}`,
      });
    } finally {
      setIsSharing(false);
    }
  };

  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinishService = async () => {
    setIsFinishing(true);
    try {
      const orderId = order?.orderId || order?.id;
      let finalInvoiceNumber = invoiceNumber;

      if (orderId) {
        // Send to backend
        const res = await providerApi.generateInvoice({
          orderId,
          items: diagnosis?.categories?.map((c: string) => ({ name: c, price: Math.floor(serviceTotal / (diagnosis?.categories?.length || 1)) })) || [{ name: 'إصلاح', price: serviceTotal }],
          paymentMethod: selectedPayment,
        });
        
        if (res.success && res.data) {
          finalInvoiceNumber = res.data.invoiceNo || invoiceNumber;
        }
      }

      navigation?.navigate('ServiceCompleted', {
        order,
        invoice: { number: finalInvoiceNumber, total, date: invoiceDate },
      });
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      // Fallback for demo
      navigation?.navigate('ServiceCompleted', {
        order,
        invoice: { number: invoiceNumber, total, date: invoiceDate },
      });
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0A1520', '#0D2B2D', '#0A1520']} style={styles.gradient}>
        {/* ── Header ── */}
        <Animated.View
          style={[
            styles.header,
            { paddingTop: insets.top + spacing.md },
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>الفاتورة</Text>
            <Text style={styles.headerSub}>{invoiceNumber}</Text>
          </View>
          <View style={styles.paidBadge}>
            <MaterialCommunityIcons name="check-circle" size={14} color={colors.status.success} />
            <Text style={styles.paidBadgeText}>إلكترونية</Text>
          </View>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* ── Invoice Header Card ── */}
            <LinearGradient colors={['rgba(212,160,86,0.18)', 'rgba(10,21,32,0.6)']} style={styles.invoiceHeaderCard}>
              <View style={styles.invoiceBrandRow}>
                <View>
                  <Text style={styles.brandName}>AutoGO</Text>
                  <Text style={styles.brandSub}>شبكة الخدمات المتخصصة</Text>
                </View>
                <View style={styles.invoiceTag}>
                  <MaterialCommunityIcons name="receipt-text" size={14} color={colors.accent.primary} />
                  <Text style={styles.invoiceTagText}>فاتورة ضريبية</Text>
                </View>
              </View>
              <View style={styles.invoiceMeta}>
                <View>
                  <Text style={styles.invoiceMetaLabel}>رقم الفاتورة</Text>
                  <Text style={styles.invoiceMetaValue}>{invoiceNumber}</Text>
                </View>
                <View>
                  <Text style={styles.invoiceMetaLabel}>التاريخ</Text>
                  <Text style={styles.invoiceMetaValue}>{invoiceDate}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* ── Customer & Vehicle Info ── */}
            <View style={styles.card}>
              <SectionHeader icon="account-circle-outline" title="بيانات العميل والمركبة" />
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemLabel}>اسم العميل</Text>
                  <Text style={styles.infoItemValue}>{order?.customer?.name || 'محمود عبد الرحمن'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemLabel}>رقم الهاتف</Text>
                  <Text style={styles.infoItemValue}>{order?.customer?.phone || '0101 234 5678'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemLabel}>نوع السيارة</Text>
                  <Text style={styles.infoItemValue}>{order?.vehicle?.type || 'Toyota Corolla 2022'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemLabel}>رقم اللوحة</Text>
                  <Text style={styles.infoItemValue}>{order?.vehicle?.plate || 'أ ب ج ١٢٣٤'}</Text>
                </View>
              </View>
            </View>

            {/* ── Service Details ── */}
            <View style={styles.card}>
              <SectionHeader icon="tools" title="تفاصيل الخدمة" color={colors.status.inProgress} />

              {/* Table header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>الخدمة</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'left' }]}>السعر</Text>
              </View>

              {/* Service rows */}
              {(diagnosis?.categories || ['إصلاح المحرك']).map((cat: string, i: number) => (
                <View key={i} style={styles.tableRow}>
                  <View style={[styles.tableCell, { flex: 2 }]}>
                    <MaterialCommunityIcons name="check-circle-outline" size={14} color={colors.accent.emerald} />
                    <Text style={styles.tableCellText}>{cat}</Text>
                  </View>
                  <Text style={[styles.tableCellPrice, { flex: 1 }]}>
                    {Math.floor(serviceTotal / (diagnosis?.categories?.length || 1))} ج.م
                  </Text>
                </View>
              ))}

              {partsTotal > 0 && (
                <View style={styles.tableRow}>
                  <View style={[styles.tableCell, { flex: 2 }]}>
                    <MaterialCommunityIcons name="cog-outline" size={14} color={colors.accent.teal} />
                    <Text style={styles.tableCellText}>قطع الغيار</Text>
                  </View>
                  <Text style={[styles.tableCellPrice, { flex: 1 }]}>{partsTotal} ج.م</Text>
                </View>
              )}

              <View style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color={colors.text.muted} />
                  <Text style={styles.tableCellText}>رسوم الانتقال والتشخيص</Text>
                </View>
                <Text style={[styles.tableCellPrice, { flex: 1 }]}>{extraFees} ج.م</Text>
              </View>
            </View>

            {/* ── Totals ── */}
            <View style={styles.card}>
              <SectionHeader icon="calculator-variant-outline" title="ملخص الفاتورة" color={colors.status.warning} />
              <LineItem label="إجمالي الخدمات" value={`${serviceTotal} ج.م`} />
              <LineItem label="قطع الغيار" value={`${partsTotal} ج.م`} />
              <LineItem label="رسوم إضافية" value={`${extraFees} ج.م`} />
              <View style={styles.divider} />
              <LineItem label={`ضريبة القيمة المضافة (14%)`} value={`${vatAmount} ج.م`} />
              <View style={styles.totalDivider} />
              <LineItem label="الإجمالي النهائي" value={`${total} ج.م`} isTotal />
            </View>

            {/* ── Payment Method ── */}
            <View style={styles.card}>
              <SectionHeader icon="credit-card-outline" title="طريقة الدفع" color={colors.accent.teal} />
              <View style={styles.paymentRow}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentOption,
                      selectedPayment === method && styles.paymentOptionSelected,
                    ]}
                    onPress={() => setSelectedPayment(method)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.paymentOptionText,
                        selectedPayment === method && styles.paymentOptionTextSelected,
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* ── Action Buttons ── */}
        <View style={[styles.actionsContainer, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Row 1: Download PDF + Share */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={handlePrintPDF}
              disabled={isPrinting}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={isPrinting ? 'loading' : 'download-outline'}
                size={18}
                color={colors.accent.primary}
              />
              <Text style={styles.secondaryActionText}>
                {isPrinting ? 'جاري...' : 'تحميل PDF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={handleShareInvoice}
              disabled={isSharing}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={isSharing ? 'loading' : 'share-variant-outline'}
                size={18}
                color={colors.accent.emerald}
              />
              <Text style={[styles.secondaryActionText, { color: colors.accent.emerald }]}>
                {isSharing ? 'جاري...' : 'مشاركة'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Finish Service */}
          <TouchableOpacity onPress={handleFinishService} activeOpacity={0.85} disabled={isFinishing}>
            <LinearGradient colors={['#D4A056', '#C4842D']} style={styles.finishBtn}>
              {isFinishing ? (
                <MaterialCommunityIcons name="loading" size={22} color={colors.background.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-all" size={22} color={colors.background.primary} />
                  <Text style={styles.finishBtnText}>إنهاء الخدمة</Text>
                  <MaterialCommunityIcons name="arrow-left" size={18} color={colors.background.primary} />
                </>
              )}
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
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  paidBadgeText: { ...typography.caption, color: colors.status.success, fontWeight: '700' },

  // Scroll
  scrollContent: { paddingHorizontal: spacing.xl },

  // Invoice header card
  invoiceHeaderCard: {
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(212,160,86,0.2)',
    gap: spacing.lg,
  },
  invoiceBrandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandName: { ...typography.h2, color: colors.accent.primary },
  brandSub: { ...typography.caption, color: colors.text.muted },
  invoiceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(212,160,86,0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(212,160,86,0.25)',
  },
  invoiceTagText: { ...typography.caption, color: colors.accent.primary, fontWeight: '700' },
  invoiceMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  invoiceMetaLabel: { ...typography.caption, color: colors.text.muted, marginBottom: 4 },
  invoiceMetaValue: { ...typography.label, color: colors.text.primary },

  // Card
  card: {
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.background.glassBorder,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionHeaderText: { ...typography.label, fontWeight: '700' },

  // Info grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  infoItemLabel: { ...typography.caption, color: colors.text.muted, marginBottom: 4 },
  infoItemValue: { ...typography.label, color: colors.text.primary },

  // Table
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: spacing.sm,
  },
  tableHeaderText: { ...typography.caption, color: colors.text.muted, fontWeight: '700' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  tableCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tableCellText: { ...typography.body, color: colors.text.secondary },
  tableCellPrice: { ...typography.label, color: colors.text.primary, textAlign: 'left' },

  // Line items
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  lineItemTotal: { paddingTop: spacing.lg },
  lineItemLabel: { ...typography.body, color: colors.text.secondary },
  lineItemValue: { ...typography.label, color: colors.text.primary },
  lineItemTotalLabel: { ...typography.h4, color: colors.text.primary },
  lineItemTotalValue: { ...typography.h4, color: colors.accent.primary },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  totalDivider: { height: 2, backgroundColor: 'rgba(212,160,86,0.3)', marginVertical: spacing.md },

  // Payment
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  paymentOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  paymentOptionSelected: {
    borderColor: colors.accent.teal,
    backgroundColor: 'rgba(45,212,191,0.12)',
  },
  paymentOptionText: { ...typography.labelSmall, color: colors.text.muted },
  paymentOptionTextSelected: { color: colors.accent.teal },

  // Actions
  actionsContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(10,21,32,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: spacing.md,
  },
  actionsRow: { flexDirection: 'row', gap: spacing.md },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.accent.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(212,160,86,0.06)',
  },
  secondaryActionText: { ...typography.label, color: colors.accent.primary },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
  },
  finishBtnText: { ...typography.button, color: colors.background.primary, flex: 1, textAlign: 'center' },
});

export default InvoiceScreen;
