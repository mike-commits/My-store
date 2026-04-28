/**
 * src/presenter/screens/ProductFormScreen.tsx
 * Shared Add / Edit product screen.
 * Route params: { productId?: number }
 * If productId is provided, loads and pre-fills the existing product.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useStore }    from '../../domain/useStore';
import { useAppTheme } from '../../core/contexts/ThemeContext';
import { supabase }    from '../../data/supabase';
import { AppButton }   from '../components/AppButton';
import { CategoryPicker } from '../components/CategoryPicker';
import { ProductSchema }  from '../../domain/validation';

const CATEGORIES = [
  'Shoes (Men)', 'Shoes (Women)', 'Shoes (Kids)',
  'Clothing (Men)', 'Clothing (Women)', 'Clothing (Kids)',
  'Jewelry', 'Accessories', 'Others',
];

export function ProductFormScreen({ route, navigation }: any) {
  const productId: number | undefined = route?.params?.productId;
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const { colors } = useAppTheme();

  const existing = products.find(p => p.id === productId);

  const [name,        setName]        = useState(existing?.name ?? '');
  const [category,    setCategory]    = useState(existing?.category ?? 'Others');
  const [buyPrice,    setBuyPrice]    = useState(existing?.buy_price?.toString() ?? '');
  const [sellPrice,   setSellPrice]   = useState(existing?.sell_price?.toString() ?? '');
  const [quantity,    setQuantity]    = useState(existing?.quantity?.toString() ?? '');
  const [notes,       setNotes]       = useState(existing?.notes ?? '');
  const [imageUri,    setImageUri]    = useState<string>((existing as any)?.image_url ?? '');
  const [uploading,   setUploading]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim())     errs.name     = 'Name is required';
    if (!buyPrice.trim()) errs.buyPrice = 'Buy price is required';
    if (!sellPrice.trim())errs.sellPrice= 'Sell price is required';
    if (!quantity.trim()) errs.quantity = 'Quantity is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission denied'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const ext      = res.assets[0].uri.split('.').pop() ?? 'jpg';
      const path     = `${user.id}/${productId ?? 'new'}_${Date.now()}.${ext}`;
      const response = await fetch(res.assets[0].uri);
      const blob     = await response.blob();
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, blob, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setImageUri(data.publicUrl);
    } catch (e: unknown) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = {
        name: name.trim(), category,
        buy_price:  parseFloat(buyPrice),
        sell_price: parseFloat(sellPrice),
        quantity:   parseInt(quantity, 10),
        notes:      notes.trim(),
        image_url:  imageUri,
        date:       new Date().toISOString(),
      };
      const result = ProductSchema.safeParse(data);
      if (!result.success) { Alert.alert('Validation Error', result.error.issues[0]?.message || 'Invalid data'); return; }
      if (productId) { await updateProduct({ id: productId, ...data }); }
      else           { await addProduct(data); }
      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Product', 'This will also delete all sales for this product. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteProduct(productId!);
        navigation.goBack();
      }},
    ]);
  };

  const Field = ({ label, value, onChangeText, error, numeric = false, placeholder = '' }:
    { label: string; value: string; onChangeText: (t: string) => void; error?: string; numeric?: boolean; placeholder?: string }) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        style={[styles.input, { borderColor: error ? colors.error : colors.border, color: colors.text }]}
        value={value} onChangeText={onChangeText}
        keyboardType={numeric ? 'numeric' : 'default'}
        placeholder={placeholder} placeholderTextColor={colors.textMuted}
      />
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{productId ? 'Edit Product' : 'New Product'}</Text>
        {productId && (
          <TouchableOpacity onPress={handleDelete}>
            <Feather name="trash-2" size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Image picker */}
        <TouchableOpacity onPress={pickImage} style={[styles.imagePicker, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {uploading ? <ActivityIndicator color={colors.primary} /> :
           imageUri  ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> :
           <View style={{ alignItems: 'center', gap: 8 }}>
             <Feather name="camera" size={32} color={colors.textMuted} />
             <Text style={[styles.imageHint, { color: colors.textMuted }]}>Tap to add photo</Text>
           </View>
          }
        </TouchableOpacity>

        <Field label="PRODUCT NAME *"    value={name}      onChangeText={setName}      error={errors.name}      placeholder="e.g. Nike Air Max" />
        <CategoryPicker value={category} onSelect={setCategory} categories={CATEGORIES} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Field label="BUY PRICE *"  value={buyPrice}  onChangeText={setBuyPrice}  error={errors.buyPrice}  numeric placeholder="0.00" /></View>
          <View style={{ flex: 1 }}><Field label="SELL PRICE *" value={sellPrice} onChangeText={setSellPrice} error={errors.sellPrice} numeric placeholder="0.00" /></View>
        </View>
        <Field label="QUANTITY *" value={quantity} onChangeText={setQuantity} error={errors.quantity} numeric placeholder="0" />
        <Field label="NOTES"      value={notes}    onChangeText={setNotes}    placeholder="Optional notes…" />

        <AppButton title={saving ? 'Saving…' : 'Save Product'} onPress={handleSave} style={{ marginTop: 20 }} />
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  backBtn:      { padding: 4 },
  headerTitle:  { flex: 1, fontSize: 18, fontWeight: '900' },
  scroll:       { padding: 24 },
  imagePicker:  { width: '100%', height: 180, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 24, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageHint:    { fontSize: 12, fontWeight: '600' },
  fieldGroup:   { marginBottom: 16 },
  label:        { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  input:        { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 15 },
  errorText:    { fontSize: 11, fontWeight: '600', marginTop: 4 },
  row:          { flexDirection: 'row', gap: 12 },
});
