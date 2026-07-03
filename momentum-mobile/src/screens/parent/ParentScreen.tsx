import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { bentoPalette, spacing } from '../../theme/bentoTokens';
import {
  LayoutDashboard, ClipboardList, Zap,
  Users, Settings, Sun,
} from 'lucide-react-native';

import ParentDashboard from './tabs/ParentDashboard';
import TaskManagement from './tabs/TaskManagement';
import QuestManagement from './tabs/QuestManagement';
import RoutinesManagement from './tabs/RoutinesManagement';
import MemberManagement from './tabs/MemberManagement';
import ParentSettings from './tabs/ParentSettings';

const Tab = createBottomTabNavigator();

export default function ParentScreen() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.05)',
          height: 85,
          paddingBottom: 25,
          paddingTop: 8,
        },
        tabBarActiveTintColor: bentoPalette.brandPrimary,
        tabBarInactiveTintColor: bentoPalette.textTertiary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const s = size - 2;
          if (route.name === 'Dashboard')  return <LayoutDashboard size={s} color={color} />;
          if (route.name === 'Tasks')      return <ClipboardList   size={s} color={color} />;
          if (route.name === 'Quests')     return <Zap             size={s} color={color} />;
          if (route.name === 'Routines')   return <Sun             size={s} color={color} />;
          if (route.name === 'Members')    return <Users           size={s} color={color} />;
          if (route.name === 'Settings')   return <Settings        size={s} color={color} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={ParentDashboard} />
      <Tab.Screen name="Tasks"     component={TaskManagement}  />
      <Tab.Screen name="Quests"    component={QuestManagement} />
      <Tab.Screen name="Routines"  component={RoutinesManagement} />
      <Tab.Screen name="Members"   component={MemberManagement} />
      <Tab.Screen name="Settings"  component={ParentSettings}  />
    </Tab.Navigator>
  );
}
