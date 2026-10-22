import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

const STATES = {
  ok: { bg: colors.surface, border: colors.line, icon: 'checkmark-circle', color: colors.ok, hint: '' },
  edited: { bg: colors.surface, border: colors.line, icon: 'checkmark-circle', color: colors.ok, hint: '' },
  missing: { bg: colors.warnBg, border: colors.warnLine, icon: 'alert-circle', color: colors.warn, hint: 'Not found in chat — ask the customer' },
  uncertain: { bg: colors.unsureBg, border: colors.unsureLine, icon: 'help-circle', color: colors.unsure, hint: 'Please double-check this' },
};

export default function FieldInput({ field, value, flag, onChange }) {
  const s = STATES[flag] || STATES.ok;
  return (
    <View style={[styles.box, { backgroundColor: s.bg, borderColor: s.border }]}>
      <View style={styles.top}>
        <Text style={styles.label}>{field.label}</Text>
        <Ionicons name={s.icon} size={16} color={s.color} />
      </View>
      <TextInput
        style={[styles.input, field.multiline && { minHeight: 52 }]}
        value={value}
        onChangeText={onChange}
        placeholder={flag === 'missing' ? 'Fill in manually' : field.placeholder}
        placeholderTextColor={colors.muted}
        multiline={!!field.multiline}
      />
      {!!s.hint && <Text style={[styles.hint, { color: s.color }]}>{s.hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 8, marginBottom: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { fontSize: 16, color: colors.ink, paddingVertical: 4, paddingHorizontal: 0, outlineStyle: 'none' },
  hint: { fontSize: 12, marginTop: 2, fontWeight: '600' },
});