import { Platform } from 'react-native';

export const colors = {
  bg: '#F6F3EF',
  surface: '#FFFFFF',
  ink: '#1C1917',
  muted: '#78716C',
  line: '#ECE7E1',
  accent: '#E4572E',
  accentSoft: '#FDEBE5',
  ok: '#1F7A4D',
  okBg: '#E8F5EE',
  warn: '#8A5A00',
  warnBg: '#FFF4D6',
  warnLine: '#F2C14E',
  unsure: '#A3400F',
  unsureBg: '#FFE9DC',
  unsureLine: '#F29A62',
  danger: '#C62828',
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };

export const shadow = Platform.select({
  web: { boxShadow: '0 4px 14px rgba(28,25,23,0.06)' },
  default: {
    shadowColor: '#1C1917',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});

export const dark = {
  bg: '#241C2E',
  line: '#352B42',
  label: '#A79BB8',
  value: '#FFFFFF',
  warn: '#F2C14E',
};