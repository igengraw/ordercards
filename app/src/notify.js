import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { dueDate } from './orders';

// Android Expo Go no longer supports expo-notifications (removed in SDK 53).
// There we skip the package entirely and rely on the in-app banner.
const inExpoGo = Constants.executionEnvironment === 'storeClient';
export const systemRemindersAvailable =
  Platform.OS !== 'web' && !(Platform.OS === 'android' && inExpoGo);

let Notifications = null;

function api() {
  if (!systemRemindersAvailable) return null;
  if (!Notifications) {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
  return Notifications;
}

// Schedules a notification 24 hours before the order is due.
// If that moment has already passed but the order is still ahead, it fires in a few seconds.
export async function scheduleReminder(order) {
  try {
    const N = api();
    if (!N) return null;
    const due = dueDate(order);
    if (!due || due <= new Date()) return null;

    let perm = await N.getPermissionsAsync();
    if (!perm.granted) perm = await N.requestPermissionsAsync();
    if (!perm.granted) return null;

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('orders', {
        name: 'Order reminders',
        importance: N.AndroidImportance.HIGH,
      });
    }

    let at = new Date(due.getTime() - 864e5);
    if (at <= new Date()) at = new Date(Date.now() + 5000);

    return await N.scheduleNotificationAsync({
      content: {
        title: 'Order due within 24 hours',
        body: `${order.client || 'Customer'}: ${order.item || 'check the details'}`,
      },
      trigger: { type: N.SchedulableTriggerInputTypes?.DATE || 'date', date: at, channelId: 'orders' },
    });
  } catch (e) {
    console.warn('Could not schedule the reminder', e);
    return null;
  }
}

export async function cancelReminder(id) {
  try {
    const N = api();
    if (!N || !id) return;
    await N.cancelScheduledNotificationAsync(id);
  } catch {}
}