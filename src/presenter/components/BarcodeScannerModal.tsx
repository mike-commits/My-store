import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Feather } from '@expo/vector-icons';
import { AppButton } from './AppButton';

interface BarcodeScannerModalProps {
    visible: boolean;
    onClose: () => void;
    onScan: (data: string) => void;
}

export function BarcodeScannerModal({ visible, onClose, onScan }: BarcodeScannerModalProps) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        if (visible) {
            getBarCodeScannerPermissions();
            setScanned(false);
        }
    }, [visible]);

    const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
        setScanned(true);
        onScan(data);
    };

    if (hasPermission === null) {
        return null;
    }
    if (hasPermission === false) {
        return (
            <Modal visible={visible} animationType="fade">
                <View style={styles.container}>
                    <Text style={styles.errorText}>No access to camera</Text>
                    <AppButton title="Close" onPress={onClose} />
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.container}>
                <BarCodeScanner
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.overlay}>
                    <View style={styles.scanArea} />
                    <Text style={styles.hint}>Align barcode within the frame</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <Feather name="x" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanArea: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#7C3AED',
        backgroundColor: 'transparent',
        borderRadius: 20,
    },
    hint: {
        color: '#FFF',
        marginTop: 20,
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: '#FFF',
        marginBottom: 20,
    },
    closeBtn: {
        position: 'absolute',
        top: 60,
        right: 24,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
