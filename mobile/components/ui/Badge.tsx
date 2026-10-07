import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'secondary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'primary', size = 'md', style }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], size === 'sm' ? styles.sm : styles.md, style]}>
      <Text style={[styles.text, styles[`text_${variant}`], size === 'sm' ? styles.textSm : styles.textMd]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: Colors.primaryLight,
  },
  success: {
    backgroundColor: '#DCFCE7',
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
  error: {
    backgroundColor: '#FEE2E2',
  },
  secondary: {
    backgroundColor: '#F1F5F9',
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: Colors.primary,
  },
  text_success: {
    color: Colors.success,
  },
  text_warning: {
    color: '#92400E',
  },
  text_error: {
    color: Colors.error,
  },
  text_secondary: {
    color: Colors.textSecondary,
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 12,
  },
} as any);
