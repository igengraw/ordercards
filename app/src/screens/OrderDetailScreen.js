import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Button from '../components/Button';
import { colors, radius, dark } from '../theme';
import { StatusPicker } from '../components/StatusBadge';
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from 'react-native';
import { TABLE_ROWS, rowValue, confirmationText, hasDeposit, remainderText } from '../orders';

export default function OrderDetailScreen({ order, onBack, onChangeStatus, onTogglePaid, onTogglePaidFull }) {
  const [copied, setCopied] = useState(false);
  const unsure = order.uncertain || [];
  const message = confirmationText(order);

  async function copy() {
    try {
      await Clipboard.setStringAsync(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Order details</Text>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.wrap}>
        <View style={styles.table}>
          {TABLE_ROWS.map((r, i) => {
            const value = rowValue(order, r.key);
            const missing = !value;
            const check = !missing && r.keys.some((k) => unsure.includes(k));
            return (
              <View key={r.key} style={[styles.row, i > 0 && styles.rowLine]}>
                <Text style={styles.label}>{r.label}</Text>
                <Text style={[styles.value, (missing || check) && styles.warn]}>
                  {missing ? 'Not specified — ask customer' : check ? `${value} — check this` : value}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.section}>Status</Text>
        <StatusPicker value={order.status || 'new'} onChange={onChangeStatus} />
        <Text style={styles.section}>Payment</Text>
          <View style={styles.pay}>
            {hasDeposit(order) ? (
              <View style={styles.payRow}>
                <View style={styles.flex}>
                  <Text style={styles.payLabel}>Deposit {order.deposit}</Text>
                  <Text style={[styles.payState, !order.depositPaid && !order.paid && { color: colors.warn }]}>
                    {order.depositPaid || order.paid ? 'Received' : 'Not received yet'}
                  </Text>
                </View>
                <Switch value={!!order.depositPaid || !!order.paid} onValueChange={onTogglePaid} disabled={!!order.paid} />
              </View>
            ) : (
              <Text style={styles.payState}>No deposit in this order</Text>
            )}

            <View style={[styles.payRow, styles.payTop]}>
              <View style={styles.flex}>
                <Text style={styles.payLabel}>Paid in full</Text>
                <Text style={styles.payState}>Customer paid the whole amount</Text>
              </View>
              <Switch value={!!order.paid} onValueChange={onTogglePaidFull} />
            </View>

            <View style={[styles.payRow, styles.payTop]}>
              <Text style={styles.payLabel}>Left to pay</Text>
              {order.paid ? (
                <Text style={[styles.payAmount, { color: colors.ok }]}>Paid in full</Text>
              ) : remainderText(order) ? (
                <Text style={styles.payAmount}>{remainderText(order)}</Text>
              ) : (
                <Text style={[styles.payState, { color: colors.warn }]}>Price not specified</Text>
              )}
            </View>
          </View>
        <View style={styles.preview}>
          <Text selectable style={styles.previewText}>{message}</Text>
        </View>
      </ScrollView>

      <View style={styles.bar}>
        <Button
          title={copied ? 'Copied!' : 'Copy message for customer'}
          icon={copied ? 'checkmark' : 'copy-outline'}
          onPress={copy}
          style={styles.flex}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  back: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  wrap: { paddingHorizontal: 16, paddingBottom: 16 },
  table: { backgroundColor: dark.bg, borderRadius: radius.lg, paddingHorizontal: 18, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 14 },
  rowLine: { borderTopWidth: 1, borderTopColor: dark.line },
  label: { width: 86, fontSize: 15, color: dark.label },
  value: { flex: 1, fontSize: 16, color: dark.value, lineHeight: 22 },
  warn: { color: dark.warn },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 20, marginBottom: 8 },
  preview: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14 },
  previewText: { fontSize: 14, color: colors.ink, lineHeight: 21 },
  bar: { flexDirection: 'row', padding: 14, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line },
  pay: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14 },
  payRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  payTop: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  payLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  payState: { fontSize: 13, color: colors.muted, marginTop: 2 },
  payAmount: { fontSize: 18, fontWeight: '800', color: colors.ink },
});