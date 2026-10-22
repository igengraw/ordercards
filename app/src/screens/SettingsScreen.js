import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { colors, radius } from '../theme';
import { PROVIDERS, testConnection } from '../ai/providers';
import { loadSettings, saveSettings } from '../settings';
import ApiKeyGuide from '../components/ApiKeyGuide';

function Field({ label, children, hint }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

export default function SettingsScreen() {
  const [s, setS] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    loadSettings().then(setS);
  }, []);
  if (!s) return null;

  const set = (patch) => {
    setMsg(null);
    setS((v) => ({ ...v, ...patch }));
  };

  function pick(id) {
    const p = PROVIDERS[id];
    set({ provider: id, model: p.model, baseUrl: p.baseUrl || s.baseUrl });
  }

  async function save() {
    await saveSettings(s);
    setMsg({ ok: true, text: 'Saved.' });
  }

  async function test() {
    setBusy(true);
    setMsg(null);
    try {
      await saveSettings(s);
      const reply = await testConnection(s);
      setMsg({ ok: true, text: `Connected. The model replied: ${reply.slice(0, 60)}` });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  const p = PROVIDERS[s.provider];

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>AI settings</Text>
        <Text style={styles.sub}>Choose which AI reads your chats. Your key stays on this device.</Text>
      </View>
      <ApiKeyGuide />
      <ScrollView style={styles.flex} contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.chips}>
          {Object.entries(PROVIDERS).map(([id, x]) => (
            <Pressable key={id} onPress={() => pick(id)} style={[styles.chip, s.provider === id && styles.chipOn]}>
              <Text style={[styles.chipText, s.provider === id && { color: '#fff' }]}>{x.label}</Text>
            </Pressable>
          ))}
        </View>

        <Field label="API key" hint={p.hint}>
          <View style={styles.keyRow}>
            <TextInput
              style={[styles.input, styles.flex]}
              value={s.apiKey}
              onChangeText={(t) => set({ apiKey: t })}
              placeholder="Paste your API key"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable onPress={() => setShowKey((v) => !v)} hitSlop={8}>
              <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
            </Pressable>
          </View>
        </Field>

        <Field label="Model" hint="Copy the exact model name from the provider's website.">
          <TextInput
            style={styles.input}
            value={s.model}
            onChangeText={(t) => set({ model: t })}
            placeholder="Model name"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>

        {s.provider === 'openai' && (
          <Field label="Base URL" hint="Ollama on your computer: http://YOUR-COMPUTER-IP:11434/v1">
            <TextInput
              style={styles.input}
              value={s.baseUrl}
              onChangeText={(t) => set({ baseUrl: t })}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Field>
        )}

        {!!msg && (
          <View style={[styles.msg, { backgroundColor: msg.ok ? colors.okBg : '#FDECEC' }]}>
            <Ionicons name={msg.ok ? 'checkmark-circle' : 'warning'} size={16} color={msg.ok ? colors.ok : colors.danger} />
            <Text style={[styles.msgText, { color: msg.ok ? colors.ok : colors.danger }]}>{msg.text}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bar}>
        <Button title="Save" variant="secondary" onPress={save} style={styles.flex} />
        <Button title="Test connection" icon="flash" loading={busy} onPress={test} style={{ flex: 1.4 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: colors.muted, marginTop: 4, lineHeight: 20 },
  wrap: { paddingHorizontal: 16, paddingBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface,
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9,
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontWeight: '700', color: colors.ink, fontSize: 14 },
  field: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 8, marginBottom: 10,
  },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { fontSize: 16, color: colors.ink, paddingVertical: 6, outlineStyle: 'none' },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  msg: { flexDirection: 'row', gap: 8, alignItems: 'center', borderRadius: radius.md, padding: 10, marginTop: 4 },
  msgText: { flex: 1, fontSize: 13, fontWeight: '600' },
  bar: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line },
});