import { useState } from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

const STEPS = [
  'Open Google AI Studio (button below) and sign in with your Google account.',
  'Tap “Create API key” and choose any project (or let it create one).',
  'Copy the key. It looks like a long string starting with “AIza”.',
  'Come back here, choose “Gemini” as the provider and paste the key into the field.',
  'Press Save, then parse a test chat on the “New order” tab.',
];

export default function ApiKeyGuide() {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setOpen(!open)} style={styles.head}>
        <Ionicons name="help-circle-outline" size={20} color={colors.accent} />
        <Text style={styles.title}>How to get a Gemini API key</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>

      {open && (
        <View style={styles.body}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.num}>
                <Text style={styles.numText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}

          <Pressable
            onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}
            style={({ pressed }) => [styles.link, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="open-outline" size={16} color="#fff" />
            <Text style={styles.linkText}>Open Google AI Studio</Text>
          </Pressable>

          <Text style={styles.note}>
            The key is stored only on this device and is sent only to the AI provider. Never share it or post it
            publicly. Free-tier limits and pricing change, so check the current terms on the AI Studio page.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  num: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 12, fontWeight: '800', color: colors.accent },
  stepText: { flex: 1, fontSize: 14, color: colors.ink, lineHeight: 20 },
  link: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 11, marginTop: 4,
  },
  linkText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  note: { fontSize: 12, color: colors.muted, lineHeight: 17 },
});