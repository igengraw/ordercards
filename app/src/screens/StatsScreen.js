import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';
import { parseAmount, balanceAmount } from '../orders';

const pad = (n) => String(n).padStart(2, '0');
const monthKey = (y, m) => `${y}-${pad(m + 1)}`;

function currencyOf(o) {
  return String(o.price || '').replace(/[\d\s\u00A0.,]/g, '').trim();
}

export default function StatsScreen({ orders, now }) {
  const [offset, setOffset] = useState(0);

  const base = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const key = monthKey(base.getFullYear(), base.getMonth());
  const label = base.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const stats = useMemo(() => {
    const cur = orders.map(currencyOf).find(Boolean) || '';

    const inMonth = orders.filter((o) => (o.date || '').slice(0, 7) === key);
    const priced = inMonth.filter((o) => parseAmount(o.price) != null);
    const income = priced.reduce((s, o) => s + parseAmount(o.price), 0);
    const received = priced.reduce((s, o) => s + (parseAmount(o.price) - balanceAmount(o)), 0);

    const owing = orders.filter((o) => balanceAmount(o) > 0);

    return {
      cur,
      count: inMonth.length,
      income,
      received,
      noPrice: inMonth.length - priced.length,
      balance: owing.reduce((s, o) => s + balanceAmount(o), 0),
      balanceCount: owing.length,
      openNoPrice: orders.filter((o) => !o.paid && parseAmount(o.price) == null).length,
    };
  }, [orders, key]);

  const money = (n) => `${Math.round(n).toLocaleString('ru-RU')}${stats.cur ? ' ' + stats.cur : ''}`;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Stats</Text>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.wrap}>
        <View style={styles.monthBar}>
          <Pressable onPress={() => setOffset(offset - 1)} hitSlop={10} style={styles.arrow}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <Pressable onPress={() => setOffset(0)} disabled={offset === 0}>
            <Text style={styles.monthLabel}>{label}</Text>
            {offset !== 0 && <Text style={styles.backNow}>back to this month</Text>}
          </Pressable>
          <Pressable onPress={() => setOffset(offset + 1)} hitSlop={10} style={styles.arrow}>
            <Ionicons name="chevron-forward" size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Income this month</Text>
          <Text style={styles.big}>{money(stats.income)}</Text>
          <Text style={styles.small}>
            {stats.count} order{stats.count === 1 ? '' : 's'} by delivery date
          </Text>
          <Text style={styles.small}>Received so far: {money(stats.received)}</Text>
          {stats.noPrice > 0 && (
            <View style={styles.warn}>
              <Ionicons name="alert-circle" size={14} color={colors.warn} />
              <Text style={styles.warnText}>{stats.noPrice} without a price, not counted</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Left to collect</Text>
          <Text style={styles.big}>{money(stats.balance)}</Text>
          <Text style={styles.small}>
            from {stats.balanceCount} unpaid order{stats.balanceCount === 1 ? '' : 's'}, all months
          </Text>
          {stats.openNoPrice > 0 && (
            <View style={styles.warn}>
              <Ionicons name="alert-circle" size={14} color={colors.warn} />
              <Text style={styles.warnText}>{stats.openNoPrice} unpaid without a price, not counted</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  wrap: { paddingHorizontal: 16, paddingBottom: 20 },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  arrow: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center',
  },
  monthLabel: { fontSize: 17, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  backNow: { fontSize: 11, color: colors.accent, textAlign: 'center', fontWeight: '600' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, marginBottom: 14, ...shadow },
  cardLabel: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  big: { fontSize: 32, fontWeight: '800', color: colors.ink, marginTop: 6, letterSpacing: -0.5 },
  small: { fontSize: 13, color: colors.muted, marginTop: 4 },
  warn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: colors.warnBg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, marginTop: 12,
  },
  warnText: { fontSize: 12, color: colors.warn, fontWeight: '600' },
});