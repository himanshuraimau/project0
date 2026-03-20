import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  buttonText?: string;
  icon?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  style?: any;
  textStyle?: any;
};

const FullWidthButton: React.FC<Props> = ({
  onPress,
  disabled = false,
  loading = false,
  loadingText = 'Processing...',
  buttonText = 'Generate Notes',
  icon,
  backgroundColor = '#000',
  textColor = '#fff',
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: isDisabled ? '#999' : backgroundColor },
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <>
          <ActivityIndicator color={textColor} size="small" style={styles.icon} />
          <Text style={[styles.buttonText, { color: textColor }, textStyle]}>
            {loadingText}
          </Text>
        </>
      ) : (
        <>
          {icon || <Sparkles size={20} color={textColor} style={styles.icon} />}
          <Text style={[styles.buttonText, { color: textColor }, textStyle]}>{buttonText}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default FullWidthButton;

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 56,
    borderRadius: 15,
    marginTop: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 19,
    lineHeight: 28,
  },
  icon: {
    marginRight: 8,
  },
});
