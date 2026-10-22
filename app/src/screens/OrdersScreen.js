import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';
import { StatusBadge } from '../components/StatusBadge';
import { dueDate, formatDate, relativeLabel, remindersDue, STATUSES, hasDeposit, remainderText } from '../orders';

function Chip({ icon, value, missingText, warn }) {
  const missing = !value;
  const flagged = missing || warn;
  return (
    <View style={[styles.chip, flagged && styles.chipWarn]}>
      <Ionicons name={missing ? 'alert-circle' : icon} size={14} color={flagged ? colors.warn : colors.muted} />
      <Text style={[styles.chipText, flagged && { color: colors.warn }]} numberOfLines={1}>
        {missing ? missingText : value}
      </Text>
    </View>
  );
}

export default function OrdersScreen({ orders, now, onDelete, onOpen }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const reminders = remindersDue(orders, now).filter((o) => o.status !== 'done');

  const list = useMemo(() => {
  const q = query.trim().toLowerCase();
  return orders
    .filter((o) => statusFilter === 'all' || (o.status || 'new') === statusFilter)
    .filter((o) => !q || [o.client, o.item, o.date, formatDate(o.date)].some((x) => (x || '').toLowerCase().includes(q)))
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
}, [orders, query, statusFilter]);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Your orders</Text>
        <Text style={styles.sub}>
          {orders.length} order{orders.length === 1 ? '' : 's'}
        </Text>
      </View>
      <ScrollView style={styles.flex} contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        {reminders.map((o) => {
          const hours = Math.round((dueDate(o) - now) / 36e5);
          return (
            <View key={o.id} style={styles.banner}>
              <View style={styles.bell}>
                <Ionicons name="notifications" size={18} color="#fff" />
              </View>
              <View style={styles.flex}>
                <Text style={styles.bannerTitle}>{hours > 0 ? `Due in ${hours} h` : 'Due now'}</Text>
                <Text style={styles.bannerText} numberOfLines={2}>
                  {o.client || 'Order'} — {o.item || 'no details'}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or date"
            placeholderTextColor={colors.muted}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersInner}>
          {[{ key: 'all', label: 'All', color: colors.ink }, ...STATUSES].map((s) => {
            const count = s.key === 'all' ? orders.length : orders.filter((o) => (o.status || 'new') === s.key).length;
            const active = statusFilter === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setStatusFilter(s.key)}
                style={[styles.fchip, { borderColor: s.color }, active && { backgroundColor: s.color }]}
              >
                <Text style={[styles.fchipText, { color: active ? '#fff' : s.color }]}>{s.label} {count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {!list.length && (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={44} color={colors.line} />
            <Text style={styles.emptyText}>{orders.length ? 'Nothing found' : 'No orders yet.\nTap “New order” to add one.'}</Text>
          </View>
        )}

        {list.map((o) => {
          const label = relativeLabel(o.date);
          const soon = label === 'Today' || label === 'Tomorrow';
          const missingCount = [o.client, o.item, o.date, o.price, o.deposit, o.address].filter((v) => !v).length;
          return (
                        <Pressable key={o.id} onPress={() => onOpen(o.id)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
              <View style={styles.head}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(o.client || '?').trim().charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.name} numberOfLines={1}>{o.client || 'No name'}</Text>
                  <Text style={[styles.item, !o.item && { color: colors.warn }]} numberOfLines={2}>
                    {o.item || 'Order details not specified'}
                  </Text>
                </View>
                <View style={[styles.date, soon && styles.dateSoon, !o.date && styles.chipWarn]}>
                  <Text style={[styles.dateText, soon && { color: '#fff' }, !o.date && { color: colors.warn }]}>
                    {o.date ? `${label}${o.time ? ' · ' + o.time : ''}` : 'No date'}
                  </Text>
                </View>
              </View>

              <View style={styles.chips}>
                <Chip icon="cash-outline" value={o.price} missingText="No price" />
                <Chip
                  icon={o.depositPaid || o.paid ? 'checkmark-circle-outline' : 'wallet-outline'}
                  value={o.deposit ? `${o.deposit}${hasDeposit(o) ? (o.depositPaid || o.paid ? ' · received' : ' · not received') : ''}` : ''}
                  missingText="No deposit info"
                  warn={hasDeposit(o) && !o.depositPaid && !o.paid}
                />
                {o.paid ? (
                  <Chip icon="checkmark-done-outline" value="Paid in full" />
                ) : (
                  !!remainderText(o) && <Chip icon="calculator-outline" value={`Balance ${remainderText(o)}`} />
                )}
                <Chip icon="location-outline" value={o.address} missingText="No address" />
              </View>

              <View style={styles.foot}>
                <View style={styles.footLeft}>
                  <StatusBadge status={o.status} />
                  <Text style={[styles.footText, missingCount > 0 && { color: colors.warn }]}>
                    {missingCount > 0 ? `${missingCount} detail${missingCount > 1 ? 's' : ''} missing` : 'All details complete'}
                  </Text>
                </View>
                <Pressable onPress={() => onDelete(o.id)} hitSlop={10} style={styles.trash}>
                  <Ionicons name="trash-outline" size={19} color={colors.danger} />
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2 },
  wrap: { paddingHorizontal: 16, paddingBottom: 20 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.accentSoft,
    borderRadius: radius.md, padding: 12, marginBottom: 10,
  },
  bell: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontWeight: '800', color: colors.accent, fontSize: 14 },
  bannerText: { color: colors.ink, fontSize: 13, marginTop: 1 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, height: 46, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink, outlineStyle: 'none' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { color: colors.muted, textAlign: 'center', lineHeight: 21 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, marginBottom: 12, ...shadow },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.accent, fontWeight: '800', fontSize: 17 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  item: { fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 18 },
  date: { backgroundColor: colors.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  dateSoon: { backgroundColor: colors.accent },
  dateText: { fontSize: 12, fontWeight: '700', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.bg, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 6, maxWidth: '100%',
  },
  chipWarn: { backgroundColor: colors.warnBg },
  chipText: { fontSize: 13, color: colors.ink, flexShrink: 1 },
  foot: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line,
  },
  footText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  trash: { padding: 2 },
  filters: { marginBottom: 12, flexGrow: 0 },
  filtersInner: { gap: 8, paddingRight: 8 },
  fchip: { borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  fchipText: { fontSize: 13, fontWeight: '700' },
  footLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
});