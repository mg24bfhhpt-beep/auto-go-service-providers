import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { borderRadius } from '../theme/spacing';
import { useAppSelector } from '../hooks';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Winch screens
import RequestAcceptScreen from '../screens/winch/RequestAcceptScreen';
import ActiveJobScreen from '../screens/winch/ActiveJobScreen';
import JobCompletionScreen from '../screens/winch/JobCompletionScreen';

// Workshop screens
import CarReceptionScreen from '../screens/workshop/CarReceptionScreen';
import ProgressUpdateScreen from '../screens/workshop/ProgressUpdateScreen';

// Service Flow screens (shared, role-agnostic)
import OrderRequestScreen from '../screens/serviceFlow/OrderRequestScreen';
import TrackingMapScreen from '../screens/serviceFlow/TrackingMapScreen';
import FaultDiagnosisScreen from '../screens/serviceFlow/FaultDiagnosisScreen';
import InvoiceScreen from '../screens/serviceFlow/InvoiceScreen';
import ServiceCompletedScreen from '../screens/serviceFlow/ServiceCompletedScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Icon Component
const TabIcon = ({ icon, label, focused }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; focused: boolean }) => (
  <View style={[tabStyles.container, focused && tabStyles.containerFocused]}>
    <MaterialCommunityIcons 
      name={icon} 
      size={24} 
      color={focused ? colors.tab.active : colors.tab.inactive} 
      style={{ marginBottom: 2 }}
    />
    <Text style={[tabStyles.label, focused && tabStyles.labelFocused]}>{label}</Text>
  </View>
);

const tabStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerFocused: {},
  label: {
    ...typography.caption,
    color: colors.tab.inactive,
    fontSize: 10,
  },
  labelFocused: {
    color: colors.tab.active,
    fontWeight: '700',
    fontSize: 10,
  },
});

// Jobs Stack (Dashboard + sub-screens filtered by role)
const JobsStack = ({ role }: { role: string }) => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_left' }}>
    <Stack.Screen name="DashboardHome" component={DashboardScreen} />
    {role === 'winch_driver' ? (
      <>
        <Stack.Screen name="RequestAccept" component={RequestAcceptScreen} />
        <Stack.Screen name="ActiveJob" component={ActiveJobScreen} />
        <Stack.Screen name="JobCompletion" component={JobCompletionScreen} />
      </>
    ) : (
      <>
        <Stack.Screen name="CarReception" component={CarReceptionScreen} />
        <Stack.Screen name="ProgressUpdate" component={ProgressUpdateScreen} />
      </>
    )}
    <Stack.Screen name="OrderRequest" component={OrderRequestScreen} />
    <Stack.Screen name="TrackingMap" component={TrackingMapScreen} />
    <Stack.Screen name="FaultDiagnosis" component={FaultDiagnosisScreen} />
    <Stack.Screen name="Invoice" component={InvoiceScreen} />
    <Stack.Screen name="ServiceCompleted" component={ServiceCompletedScreen} />
  </Stack.Navigator>
);

const MainNavigator = () => {
  const insets = useSafeAreaInsets();
  const provider = useAppSelector((state) => state.auth.provider);
  const selectedRole = useAppSelector((state) => state.auth.selectedRole);
  const role = provider?.role || selectedRole || 'winch_driver';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tab.background,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={focused ? 'home' : 'home-outline'} label="الرئيسية" focused={focused} />
          ),
        }}
      >
        {() => <JobsStack role={role} />}
      </Tab.Screen>
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={focused ? 'wallet' : 'wallet-outline'} label="المحفظة" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={focused ? 'account' : 'account-outline'} label="حسابي" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
