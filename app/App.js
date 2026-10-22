import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, StatusBar, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadOrders, saveOrders } from './src/storage';
import { loadSettings } from './src/settings';
import { scheduleReminder, cancelReminder } from './src/notify';
import NewOrderScreen from './src/screens/NewOrderScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import { colors } from './src/theme';
import StatsScreen from './src/screens/StatsScreen';

const TOP = Platform.select({ ios: 56, android: (StatusBar.currentHeight || 24) + 10, default: 20 });

function Tab({ active, icon, iconActive, label, onPress }) {
  return (
    <Pressable style={styles.tab} onPress={onPress}>
      <Ionicons name={active ? iconActive : icon} size={24} color={active ? colors.accent : colors.muted} />
      <Text style={[styles.tabText, active && { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('orders');
  const [reviewing, setReviewing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [now, setNow] = useState(new Date());
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    Promise.all([loadOrders(), loadSettings()]).then(([o, s]) => {
      setOrders(o);
      setLoaded(true);
      // First launch: ask the user to connect an AI.
      if (!s.apiKey && s.provider !== 'openai') setTab('settings');
    });
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  function update(next) {
    setOrders(next);
    saveOrders(next);
  }

  async function addOrder(order) {
    const notifId = await scheduleReminder(order);
    update([...orders, { ...order, notifId }]);
  }

  function removeOrder(id) {
    const o = orders.find((x) => x.id === id);
    if (o) cancelReminder(o.notifId);
    update(orders.filter((x) => x.id !== id));
  }
  function updateOrder(id, patch) {
    update(orders.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  if (!loaded) return null;

  const selected = orders.find((o) => o.id === selectedId);
  const framed = Platform.OS === 'web' && width > 520; // phone-shaped window on a computer
  const hideTabs = !!selected || (tab === 'new' && reviewing);

  let screen;
  if (selected) {
    screen = (
      <OrderDetailScreen
        order={selected}
        onBack={() => setSelectedId(null)}
        onChangeStatus={(s) => updateOrder(selected.id, { status: s })}
        onTogglePaid={(v) => updateOrder(selected.id, { depositPaid: v })}
        onTogglePaidFull={(v) => updateOrder(selected.id, { paid: v })}
      />
    );
  } else if (tab === 'orders') {
    screen = <OrdersScreen orders={orders} now={now} onOpen={setSelectedId} onDelete={removeOrder} />;
  } else if (tab === 'calendar') {
  screen = <CalendarScreen orders={orders} now={now} onOpen={setSelectedId} />;
  } else if (tab === 'settings') {
    screen = <SettingsScreen />;
  } else if (tab === 'stats') {
  screen = <StatsScreen orders={orders} now={now} />;
  } else {
    screen = (
      <NewOrderScreen
        onReviewChange={setReviewing}
        onSave={async (order) => {
          await addOrder(order);
          setReviewing(false);
          setTab('orders');
        }}
      />
    );
  }

  const phone = (
    <View style={[styles.phone, framed && { width: 390, height: Math.min(height - 32, 844), ...styles.frame }]}>
      <View style={{ height: TOP }} />
      <View style={styles.flex}>{screen}</View>
      {!hideTabs && (
        <View style={styles.tabs}>
          <Tab active={tab === 'orders'} icon="receipt-outline" iconActive="receipt" label={`Orders (${orders.length})`} onPress={() => setTab('orders')} />
          <Tab active={tab === 'calendar'} icon="calendar-outline" iconActive="calendar" label="Calendar" onPress={() => setTab('calendar')} />
          <Tab active={tab === 'new'} icon="add-circle-outline" iconActive="add-circle" label="New order" onPress={() => setTab('new')} />
          <Tab active={tab === 'stats'} icon="stats-chart-outline" iconActive="stats-chart" label="Stats" onPress={() => setTab('stats')} />
          <Tab active={tab === 'settings'} icon="settings-outline" iconActive="settings" label="Settings" onPress={() => setTab('settings')} />
        </View>
      )}
    </View>
  );

  return framed ? <View style={styles.desk}>{phone}</View> : phone;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  desk: { flex: 1, backgroundColor: '#E3DDD6', alignItems: 'center', justifyContent: 'center' },
  phone: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  frame: { borderRadius: 40, borderWidth: 8, borderColor: colors.ink },
  tabs: {
    flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line,
    paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabText: { fontSize: 11, fontWeight: '700', color: colors.muted },
});