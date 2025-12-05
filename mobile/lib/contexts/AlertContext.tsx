import React, { createContext, useContext, useState, useCallback } from 'react'
import CustomAlert from '@/components/ui/CustomAlert'

interface AlertButton {
    text: string
    onPress?: () => void
    style?: 'default' | 'cancel' | 'destructive'
}

interface AlertOptions {
    title: string
    message?: string
    buttons?: AlertButton[]
}

interface AlertContextType {
    showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void
    hideAlert: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false)
    const [options, setOptions] = useState<AlertOptions>({ title: '' })

    const showAlert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
        setOptions({ title, message, buttons })
        setVisible(true)
    }, [])

    const hideAlert = useCallback(() => {
        setVisible(false)
    }, [])

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <CustomAlert
                visible={visible}
                title={options.title}
                message={options.message}
                buttons={options.buttons}
                onClose={hideAlert}
            />
        </AlertContext.Provider>
    )
}

export function useAlert() {
    const context = useContext(AlertContext)
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider')
    }
    return context
}
