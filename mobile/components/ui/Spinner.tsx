import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

export function Spinner({ size = 'large', color = Colors.primary, fullScreen = false }: SpinnerProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }
  return <ActivityIndicator size={size} color={color} />;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
