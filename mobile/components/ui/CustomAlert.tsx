import React from 'react'
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'

interface AlertButton {
    text: string
    onPress?: () => void
    style?: 'default' | 'cancel' | 'destructive'
}

interface CustomAlertProps {
    visible: boolean
    title?: string
    message?: string
    buttons?: AlertButton[]
    onClose: () => void
}

export default function CustomAlert({
    visible,
    title,
    message,
    buttons = [],
    onClose,
}: CustomAlertProps) {
    const handleButtonPress = (button: AlertButton) => {
        onClose()
        if (button.onPress) {
            button.onPress()
        }
    }

    // Default to "OK" if no buttons provided
    const alertButtons: AlertButton[] = buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }]

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.alertContainer}>
                    {title && <Text style={styles.title}>{title}</Text>}
                    {message && <Text style={styles.message}>{message}</Text>}

                    <View style={styles.buttonContainer}>
                        {alertButtons.map((button, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    button.style === 'cancel' && styles.cancelButton,
                                    button.style === 'destructive' && styles.destructiveButton,
                                    index > 0 && styles.buttonBorder,
                                ]}
                                onPress={() => handleButtonPress(button)}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        button.style === 'cancel' && styles.cancelButtonText,
                                        button.style === 'destructive' && styles.destructiveButtonText,
                                    ]}
                                >
                                    {button.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertContainer: {
        width: Dimensions.get('window').width * 0.8,
        maxWidth: 340,
        backgroundColor: 'white',
        borderRadius: 20,
        paddingTop: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
        paddingHorizontal: 24,
    },
    message: {
        fontSize: 14,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 24,
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonBorder: {
        borderLeftWidth: 1,
        borderLeftColor: '#E5E7EB',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4f3be7', // Primary color
    },
    cancelButton: {
        // Optional specific styling for cancel button container
    },
    cancelButtonText: {
        color: '#6B7280',
        fontWeight: '400',
    },
    destructiveButton: {
        // Optional specific styling for destructive button container
    },
    destructiveButtonText: {
        color: '#EF4444',
    },
})
