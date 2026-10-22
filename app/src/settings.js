import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const KEY = 'ai-settings';
const SECRET = 'ai-api-key';
const native = Platform.OS !== 'web';

export const DEFAULTS = {
  provider: 'gemini',
  model: 'gemini-3.5-flash-lite',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
};

async function getSecret() {
  try {
    return native ? await SecureStore.getItemAsync(SECRET) : await AsyncStorage.getItem(SECRET);
  } catch {
    return null;
  }
}

async function setSecret(value) {
  try {
    if (native) await SecureStore.setItemAsync(SECRET, value);
    else await AsyncStorage.setItem(SECRET, value);
  } catch (e) {
    console.warn('Could not store the API key', e);
  }
}

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const saved = raw ? JSON.parse(raw) : {};
    return { ...DEFAULTS, ...saved, apiKey: (await getSecret()) || '' };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSettings(s) {
  const { apiKey, ...rest } = s;
  await AsyncStorage.setItem(KEY, JSON.stringify(rest));
  await setSecret((apiKey || '').trim());
}