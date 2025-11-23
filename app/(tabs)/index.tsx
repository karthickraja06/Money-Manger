import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { DashboardScreen } from '@/src/components/screens/DashboardScreen';
import { useStore } from '@/src/store/appStore';

export default function HomeScreen() {
  const user = useStore((state) => state.user);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize user if not present
    if (!user) {
      // In a real app, you'd load the user from storage or auth
      setIsReady(true);
    } else {
      setIsReady(true);
    }
  }, [user]);

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  return <DashboardScreen />;
}
