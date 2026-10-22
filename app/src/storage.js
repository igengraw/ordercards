import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'orders';

export async function loadOrders() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveOrders(orders) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('Could not save orders', e);
  }
}