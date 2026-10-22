import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { extractOrder } from '../api';
import { FIELDS, normalize } from '../orders';
import FieldInput from '../components/FieldInput';
import Button from '../components/Button';
import { colors, radius } from '../theme';

const SAMPLE = `Aigerim: Hi! I'd like to order a cake for my daughter's birthday
You: Hello! What size and flavor?
Aigerim: 2 kg, chocolate with cherry, inscription "Aruzhan 7 years"
You: The price is 18,000 KZT
You: I need a 5,000 KZT deposit
Aigerim: Sent 5000 via Kaspi, screenshot attached
You: Received, thank you! When do you need it?
Aigerim: Tomorrow at 10:00`;

function Bar({ children }) {
  return <View style={styles.bar}>{children}</View>;
}

export default function NewOrderScreen({ onSave, onReviewChange }) {
  const [chat, setChat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState(null);
  const [flags, setFlags] = useState({});

  function setReview(v, f) {
    setValues(v);
    setFlags(f || {});
    onReviewChange && onReviewChange(!!v);
  }

  async function analyze() {
    if (!chat.trim()) return setError('Paste a chat first.');
    setError('');
    setLoading(true);
    try {
      const raw = await extractOrder(chat);
      const n = normalize(raw);
      setReview(n.values, n.flags);
    } catch (e) {
      setError(`Could not read the chat: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function change(key, text) {
    setValues((v) => ({ ...v, [key]: text }));
    setFlags((f) => ({
      ...f,
      [key]: !text.trim() ? 'missing' : f[key] === 'ok' ? 'ok' : 'edited',
    }));
  }

  function save() {
        onSave({
      id: String(Date.now()),
      ...values,
      uncertain: FIELDS.filter(({ key }) => flags[key] === 'uncertain').map(({ key }) => key),
    });
    setChat('');
    setReview(null);
  }

  if (values) {
    const attention = FIELDS.filter(({ key }) => flags[key] === 'missing' || flags[key] === 'uncertain').length;
    const F = (key) => (
      <FieldInput
        field={FIELDS.find((x) => x.key === key)}
        value={values[key]}
        flag={flags[key]}
        onChange={(t) => change(key, t)}
      />
    );
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Review order</Text>
          <View style={[styles.pill, attention ? styles.pillWarn : styles.pillOk]}>
            <Ionicons
              name={attention ? 'alert-circle' : 'checkmark-circle'}
              size={15}
              color={attention ? colors.warn : colors.ok}
            />
            <Text style={[styles.pillText, { color: attention ? colors.warn : colors.ok }]}>
              {attention ? `${attention} field${attention > 1 ? 's' : ''} need attention` : 'All fields found'}
            </Text>
          </View>
        </View>
        <ScrollView style={styles.flex} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {F('client')}
          {F('item')}
          <View style={styles.row}>
            <View style={styles.flex}>{F('date')}</View>
            <View style={styles.flex}>{F('time')}</View>
          </View>
          <View style={styles.row}>
            <View style={styles.flex}>{F('price')}</View>
            <View style={styles.flex}>{F('deposit')}</View>
          </View>
          {F('address')}
        </ScrollView>
        <Bar>
          <Button title="Back" variant="secondary" icon="arrow-back" onPress={() => setReview(null)} style={styles.flex} />
          <Button title="Save order" icon="checkmark" onPress={save} style={{ flex: 1.4 }} />
        </Bar>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>New order</Text>
        <Text style={styles.sub}>Paste a chat from Instagram or WhatsApp and we'll fill in the card for you.</Text>
      </View>
      <View style={styles.pasteWrap}>
        <View style={styles.tools}>
          <Pressable style={styles.tool} onPress={() => setChat(SAMPLE)}>
            <Ionicons name="sparkles" size={14} color={colors.accent} />
            <Text style={styles.toolText}>Use sample</Text>
          </Pressable>
          {!!chat && (
            <Pressable style={styles.tool} onPress={() => setChat('')}>
              <Ionicons name="close-circle" size={14} color={colors.muted} />
              <Text style={[styles.toolText, { color: colors.muted }]}>Clear</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.pasteCard}>
          <TextInput
            style={styles.chat}
            value={chat}
            onChangeText={setChat}
            placeholder="Paste the chat here…"
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
          />
        </View>
        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
      <Bar>
        <Button title="Analyze chat" icon="sparkles" loading={loading} onPress={analyze} style={styles.flex} />
      </Bar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: colors.muted, marginTop: 4, lineHeight: 20 },
  pasteWrap: { flex: 1, paddingHorizontal: 16 },
  tools: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tool: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7,
  },
  toolText: { fontSize: 13, fontWeight: '600', color: colors.accent },
  pasteCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14,
  },
  chat: { flex: 1, fontSize: 16, color: colors.ink, lineHeight: 22, outlineStyle: 'none' },
  errorBox: {
    flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#FDECEC', borderRadius: radius.md,
    padding: 10, marginTop: 10,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: 13 },
  form: { paddingHorizontal: 16, paddingBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 8,
    borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 5,
  },
  pillWarn: { backgroundColor: colors.warnBg },
  pillOk: { backgroundColor: colors.okBg },
  pillText: { fontSize: 13, fontWeight: '700' },
  bar: {
    flexDirection: 'row', gap: 10, padding: 14, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.line,
  },
});