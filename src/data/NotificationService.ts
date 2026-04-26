import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class NotificationService {
    static async registerForPushNotificationsAsync() {
        if (Platform.OS === 'web') return null;

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            return null;
        }

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#7C3AED',
            });
        }
    }

    static async sendLowStockAlert(productName: string, currentStock: number) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Low Stock Alert! ⚠️",
                body: `${productName} is running low (${currentStock} left). Time to restock!`,
                data: { productName, currentStock },
            },
            trigger: null, // Send immediately
        });
    }
}

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});
