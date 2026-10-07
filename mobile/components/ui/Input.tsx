import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={20} color={Colors.textSecondary} style={styles.leftIcon} />
        )}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeft : null,
            (rightIcon || isPassword) ? styles.inputWithRight : null,
          ]}
          placeholderTextColor={Colors.placeholder}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text,
  },
  inputWithLeft: {
    paddingLeft: 4,
  },
  inputWithRight: {
    paddingRight: 4,
  },
  leftIcon: {
    paddingLeft: 14,
  },
  rightIcon: {
    paddingRight: 14,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
});
