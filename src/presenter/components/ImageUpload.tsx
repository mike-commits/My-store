import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../core/contexts/ThemeContext';
import { supabase } from '../../data/supabase';

interface ImageUploadProps {
    value?: string;
    onUpload: (url: string) => void;
}

export function ImageUpload({ value, onUpload }: ImageUploadProps) {
    const { colors, isDark } = useAppTheme();
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        try {
            setLoading(true);
            const response = await fetch(uri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();
            
            const fileName = `product_${Date.now()}.jpg`;
            const filePath = `product-images/${fileName}`;

            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(filePath, arrayBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            onUpload(publicUrl);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableOpacity 
            style={[styles.container, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border }]} 
            onPress={pickImage}
            disabled={loading}
        >
            {value ? (
                <Image source={{ uri: value }} style={styles.image} />
            ) : (
                <View style={styles.placeholder}>
                    <Feather name="image" size={32} color={colors.textMuted} />
                    <Text style={[styles.placeholderText, { color: colors.textMuted }]}>Add Product Image</Text>
                </View>
            )}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator color="#FFF" />
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 180,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        overflow: 'hidden',
        marginBottom: 20,
    },
    image: { width: '100%', height: '100%' },
    placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    placeholderText: { fontSize: 13, fontWeight: '600' },
    loadingOverlay: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    }
});
