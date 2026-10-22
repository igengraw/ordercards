import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';
import { formatDate } from '../orders';
import { StatusBadge } from '../components/StatusBadge';

const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function weekStart(now, offset) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7); // Monday
  return d;
}

export default function CalendarScreen({ orders, now, onOpen }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState(toKey(now));
  const todayKey = toKey(now);

  const days = useMemo(() => {
    const start = weekStart(now, weekOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [now, weekOffset]);

  const byDay = useMemo(() => {
    const m = {};
    orders.forEach((o) => {
      if (o.date) (m[o.date] = m[o.date] || []).push(o);
    });
    Object.values(m).forEach((list) =>
      list.sort((a, b) => (a.time || '99:99').padStart(5, '0').localeCompare((b.time || '99:99').padStart(5, '0')))
    );
    return m;
  }, [orders]);

  const noDate = orders.filter((o) => !o.date);
  const weekCount = days.reduce((sum, d) => sum + (byDay[toKey(d)]?.length || 0), 0);
  const dayOrders = byDay[selected] || [];

  function changeWeek(delta) {
    const next = weekOffset + delta;
    setWeekOffset(next);
    setSelected(next === 0 ? todayKey : toKey(weekStart(now, next)));
  }

  const fmt = (d) => `${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })}`;

  function Row({ o }) {
    return (
      <Pressable onPress={() => onOpen(o.id)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }, o.status === 'done' && { opacity: 0.55 }]}>
        <Text style={[styles.time, !o.time && { color: colors.warn, fontSize: 12 }]}>{o.time || 'No time'}</Text>
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>{o.client || 'No name'}</Text>
          <Text style={[styles.item, !o.item && { color: colors.warn }]} numberOfLines={1}>
            {o.item || 'Order details not specified'}
          </Text>
        </View>
        <StatusBadge status={o.status} />
      </Pressable>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.sub}>{weekCount} order{weekCount === 1 ? '' : 's'} this week</Text>
      </View>

      <View style={styles.weekBar}>
        <Pressable onPress={() => changeWeek(-1)} hitSlop={10} style={styles.arrow}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>
        <Pressable onPress={() => changeWeek(-weekOffset)} disabled={weekOffset === 0}>
          <Text style={styles.weekLabel}>{fmt(days[0])} – {fmt(days[6])}</Text>
          {weekOffset !== 0 && <Text style={styles.backToday}>back to this week</Text>}
        </Pressable>
        <Pressable onPress={() => changeWeek(1)} hitSlop={10} style={styles.arrow}>
          <Ionicons name="chevron-forward" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.days}>
        {days.map((d, i) => {
          const key = toKey(d);
          const count = byDay[key]?.length || 0;
          const busy = count >= 3;
          const active = key === selected;
          return (
            <Pressable
              key={key}
              onPress={() => setSelected(key)}
              style={[
                styles.day,
                count > 0 && { backgroundColor: colors.accentSoft },
                busy && { backgroundColor: colors.accent },
                active && styles.dayActive,
              ]}
            >
              <Text style={[styles.dayName, busy && { color: '#fff' }]}>{WEEKDAYS[i]}</Text>
              <Text style={[styles.dayNum, busy && { color: '#fff' }, key === todayKey && styles.today]}>{d.getDate()}</Text>
              <Text style={[styles.dayCount, busy && { color: '#fff' }]}>{count > 0 ? count : '·'}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.wrap}>
        <Text style={styles.section}>
          {formatDate(selected)}{selected === todayKey ? ' · today' : ''}
        </Text>
        {!dayOrders.length && <Text style={styles.empty}>No orders on this day</Text>}
        {dayOrders.map((o) => <Row key={o.id} o={o} />)}

        {noDate.length > 0 && (
          <>
            <Text style={[styles.section, { color: colors.warn, marginTop: 22 }]}>Without a date ({noDate.length})</Text>
            {noDate.map((o) => <Row key={o.id} o={o} />)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2 },
  weekBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 },
  arrow: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center',
  },
  weekLabel: { fontSize: 16, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  backToday: { fontSize: 11, color: colors.accent, textAlign: 'center', fontWeight: '600' },
  days: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, marginBottom: 14 },
  day: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.md,
    backgroundColor: colors.surface, borderWidth: 2, borderColor: 'transparent',
  },
  dayActive: { borderColor: colors.ink },
  dayName: { fontSize: 11, fontWeight: '700', color: colors.muted },
  dayNum: { fontSize: 18, fontWeight: '800', color: colors.ink, marginVertical: 2 },
  today: { textDecorationLine: 'underline' },
  dayCount: { fontSize: 12, fontWeight: '700', color: colors.muted },
  wrap: { paddingHorizontal: 16, paddingBottom: 20 },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  empty: { color: colors.muted, paddingVertical: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: 14, marginBottom: 10, ...shadow,
  },
  time: { width: 46, fontSize: 15, fontWeight: '800', color: colors.ink },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink },
  item: { fontSize: 13, color: colors.muted, marginTop: 2 },
});