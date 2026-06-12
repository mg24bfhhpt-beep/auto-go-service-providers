import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { providerApi } from '../../services/providerApi';

interface Props {
  navigation?: any;
  route?: any;
}

// ─── Issue Categories ─────────────────────────────────────────────────────────
const ISSUE_CATEGORIES = [
  { id: 'battery', label: 'البطارية', icon: 'battery-alert', color: '#F59E0B' },
  { id: 'engine', label: 'المحرك', icon: 'engine', color: '#EF4444' },
  { id: 'tire', label: 'الإطارات', icon: 'tire', color: '#8B5CF6' },
  { id: 'oil', label: 'تسريب زيت', icon: 'oil', color: '#F97316' },
  { id: 'electrical', label: 'كهرباء', icon: 'lightning-bolt', color: '#3B82F6' },
  { id: 'brakes', label: 'الفرامل', icon: 'car-brake-alert', color: '#EC4899' },
  { id: 'cooling', label: 'التبريد', icon: 'thermometer-alert', color: '#06B6D4' },
  { id: 'transmission', label: 'ناقل الحركة', icon: 'cog-transfer', color: '#10B981' },
] as const;

// ─── Repair Status ────────────────────────────────────────────────────────────
const REPAIR_STATUSES = [
  { id: 'pending', label: 'قيد الانتظار', color: colors.status.pending },
  { id: 'in_progress', label: 'جاري الإصلاح', color: colors.status.inProgress },
  { id: 'resolved', label: 'تم الحل', color: colors.status.success },
] as const;

type IssueCategory = typeof ISSUE_CATEGORIES[number]['id'];
type RepairStatus = typeof REPAIR_STATUSES[number]['id'];

// ─── Category Chip Component ──────────────────────────────────────────────────
const CategoryChip = ({
  item,
  selected,
  onPress,
}: {
  item: typeof ISSUE_CATEGORIES[number];
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.categoryChip, selected && { borderColor: item.color, backgroundColor: `${item.color}15` }]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <MaterialCommunityIcons
      name={item.icon as any}
      size={20}
      color={selected ? item.color : colors.text.muted}
    />
    <Text style={[styles.categoryChipText, selected && { color: item.color }]}>{item.label}</Text>
    {selected && (
      <View style={[styles.categorySelected, { backgroundColor: item.color }]}>
        <MaterialCommunityIcons name="check" size={10} color={colors.white} />
      </View>
    )}
  </TouchableOpacity>
);

// ─── Section Header ────────────────────────────────────────────────────────────
const SectionTitle = ({ icon, title, color = colors.accent.primary }: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  color?: string;
}) => (
  <View style={styles.sectionTitleRow}>
    <MaterialCommunityIcons name={icon} size={20} color={color} />
    <Text style={styles.sectionTitleText}>{title}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const FaultDiagnosisScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const order = route?.params?.order;

  const [selectedCategories, setSelectedCategories] = useState<IssueCategory[]>(['engine']);
  const [repairStatus, setRepairStatus] = useState<RepairStatus>('in_progress');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [spareParts, setSpareParts] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleCategory = (id: IssueCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSaveDiagnosis = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('تنبيه', 'يرجى اختيار نوع المشكلة على الأقل.');
      return;
    }
    setIsSaving(true);
    try {
      const orderId = order?.orderId || order?.id;
      if (orderId) {
        await providerApi.saveDiagnosis({
          orderId,
          categories: selectedCategories.map(id => ISSUE_CATEGORIES.find((c) => c.id === id)?.label || id),
          description,
          estimatedCost: parseFloat(estimatedCost) || 0,
          spareParts,
          repairNotes,
        });
      } else {
        // Mock fallback
        await new Promise((r) => setTimeout(r, 800));
      }
      Alert.alert('تم الحفظ', 'تم حفظ تشخيص الأعطال بنجاح.', [{ text: 'حسناً' }]);
    } catch (err) {
      console.error('Failed to save diagnosis:', err);
      Alert.alert('خطأ', 'لم نتمكن من حفظ التشخيص. حاول مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateInvoice = () => {
    if (selectedCategories.length === 0) {
      Alert.alert('تنبيه', 'يرجى اختيار نوع المشكلة أولاً قبل إنشاء الفاتورة.');
      return;
    }

    // Build diagnosis data for invoice
    const diagnosisData = {
      categories: selectedCategories.map(
        (id) => ISSUE_CATEGORIES.find((c) => c.id === id)?.label || id
      ),
      status: repairStatus,
      description,
      estimatedCost: parseFloat(estimatedCost) || order?.estimatedPrice || 450,
      spareParts,
      repairNotes,
    };

    navigation?.navigate('Invoice', { order, diagnosis: diagnosisData });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0A1520', '#0D2B2D', '#0A1520']} style={styles.gradient}>
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>تشخيص الأعطال</Text>
            <Text style={styles.headerSub}>
              {order?.vehicle?.type || 'Toyota Corolla 2022'}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <MaterialCommunityIcons name="wrench-clock" size={15} color={colors.status.inProgress} />
            <Text style={styles.statusPillText}>جاري الفحص</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Issue Categories ── */}
            <View style={styles.card}>
              <SectionTitle icon="shape-plus" title="نوع العطل (اختر كل ما ينطبق)" />
              <View style={styles.categoriesGrid}>
                {ISSUE_CATEGORIES.map((item) => (
                  <CategoryChip
                    key={item.id}
                    item={item}
                    selected={selectedCategories.includes(item.id)}
                    onPress={() => toggleCategory(item.id)}
                  />
                ))}
              </View>
            </View>

            {/* ── Repair Status ── */}
            <View style={styles.card}>
              <SectionTitle icon="progress-check" title="حالة الإصلاح" color={colors.status.inProgress} />
              <View style={styles.statusRow}>
                {REPAIR_STATUSES.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.statusOption,
                      repairStatus === s.id && { borderColor: s.color, backgroundColor: `${s.color}15` },
                    ]}
                    onPress={() => setRepairStatus(s.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.statusRadio, repairStatus === s.id && { backgroundColor: s.color }]}>
                      {repairStatus === s.id && (
                        <View style={styles.statusRadioInner} />
                      )}
                    </View>
                    <Text style={[styles.statusOptionText, repairStatus === s.id && { color: s.color }]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Description ── */}
            <View style={styles.card}>
              <SectionTitle icon="text-box-outline" title="وصف المشكلة التفصيلي" />
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="اكتب وصفاً دقيقاً للعطل والأعراض التي لاحظتها..."
                placeholderTextColor={colors.input.placeholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* ── Cost & Parts ── */}
            <View style={styles.card}>
              <SectionTitle icon="currency-usd" title="التكلفة والقطع" color={colors.status.warning} />

              <Text style={styles.inputLabel}>التكلفة التقديرية (ج.م)</Text>
              <TextInput
                style={styles.textInput}
                value={estimatedCost}
                onChangeText={setEstimatedCost}
                placeholder="مثال: 650"
                placeholderTextColor={colors.input.placeholder}
                keyboardType="numeric"
              />

              <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>قطع الغيار المطلوبة</Text>
              <TextInput
                style={styles.textArea}
                value={spareParts}
                onChangeText={setSpareParts}
                placeholder="مثال: فلتر الهواء، بلوجات الإشعال، سير التايمنج..."
                placeholderTextColor={colors.input.placeholder}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* ── Repair Notes ── */}
            <View style={styles.card}>
              <SectionTitle icon="note-text-outline" title="ملاحظات الفني" color={colors.accent.teal} />
              <TextInput
                style={styles.textArea}
                value={repairNotes}
                onChangeText={setRepairNotes}
                placeholder="أضف أي ملاحظات إضافية للسجل الفني..."
                placeholderTextColor={colors.input.placeholder}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Action Buttons ── */}
        <View style={[styles.actionsContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveDiagnosis}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isSaving ? 'loading' : 'content-save-outline'}
              size={20}
              color={colors.accent.primary}
            />
            <Text style={styles.saveButtonText}>{isSaving ? 'جاري الحفظ...' : 'حفظ التشخيص'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.invoiceButton}
            onPress={handleGenerateInvoice}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#D4A056', '#C4842D']} style={styles.invoiceGradient}>
              <MaterialCommunityIcons name="receipt" size={20} color={colors.background.primary} />
              <Text style={styles.invoiceButtonText}>إنشاء الفاتورة</Text>
              <MaterialCommunityIcons name="arrow-left" size={18} color={colors.background.primary} />
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
  },
  statusPillText: { ...typography.caption, color: colors.status.inProgress, fontWeight: '700' },

  // Scroll content
  scrollContent: { paddingHorizontal: spacing.xl },

  // Card
  card: {
    backgroundColor: colors.background.glass,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.background.glassBorder,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },

  // Section title
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  sectionTitleText: { ...typography.h4, color: colors.text.primary },

  // Categories
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255,255,255,0.03)',
    position: 'relative',
  },
  categoryChipText: { ...typography.labelSmall, color: colors.text.muted },
  categorySelected: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Status
  statusRow: { flexDirection: 'row', gap: spacing.sm },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.divider,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  statusRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusRadioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  statusOptionText: { ...typography.labelSmall, color: colors.text.muted, flex: 1 },

  // Inputs
  inputLabel: { ...typography.labelSmall, color: colors.text.muted, marginBottom: spacing.sm },
  textInput: {
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.input.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.input.text,
    ...typography.body,
  },
  textArea: {
    backgroundColor: colors.input.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.input.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.input.text,
    ...typography.body,
    minHeight: 90,
    textAlignVertical: 'top',
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(10,21,32,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  saveButton: {
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
  saveButtonText: { ...typography.label, color: colors.accent.primary },
  invoiceButton: { flex: 2, borderRadius: borderRadius.xl, overflow: 'hidden' },
  invoiceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  invoiceButtonText: { ...typography.button, color: colors.background.primary, flex: 1, textAlign: 'center' },
});

export default FaultDiagnosisScreen;
