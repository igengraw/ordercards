import { View, Text, Pressable, StyleSheet } from 'react-native';
import { radius } from '../theme';
import { STATUSES, statusInfo } from '../orders';

export function StatusBadge({ status }) {
  const s = statusInfo(status);
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.color }]} />
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

export function StatusPicker({ value, onChange }) {
  return (
    <View style={styles.row}>
      {STATUSES.map((s) => {
        const active = value === s.key;
        return (
          <Pressable
            key={s.key}
            onPress={() => onChange(s.key)}
            style={[styles.chip, { borderColor: s.color }, active && { backgroundColor: s.color }]}
          >
            <Text style={[styles.chipText, { color: active ? '#fff' : s.color }]}>{s.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 14, fontWeight: '700' },
});