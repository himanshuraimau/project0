import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  buttonText?: string;
  style?: any;
  textStyle?: any;
};

const GenerateNote: React.FC<Props> = ({
  onPress,
  disabled = false,
  loading = false,
  loadingText = 'Processing...',
  buttonText = 'Generate Notes',
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity 
      style={[
        styles.generateBtn,
        isDisabled && styles.generateBtnDisabled,
        style
      ]} 
      activeOpacity={0.85} 
      onPress={onPress} 
      disabled={isDisabled}
    >
      {loading ? (
        <>
          <ActivityIndicator color="#fff" size="small" style={styles.icon} />
          <Text style={[styles.generateText, textStyle]}>
            {loadingText}
          </Text>
        </>
      ) : (
        <>
          <Sparkles size={16} color="#fff" style={styles.icon} />
          <Text style={[styles.generateText, textStyle]}>{buttonText}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default GenerateNote;

const styles = StyleSheet.create({
  generateBtn: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'center',
  },
  generateBtnDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  generateText: {
    color: '#fff', 
    fontWeight: '700',
  },
  icon: {
    marginRight: 8,
  },
});