import { Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the floating bottom tab bar (matches App.tsx) */
export const TAB_BAR_HEIGHT = 72;

/**
 * Returns the correct `paddingBottom` to add to any FlatList or ScrollView
 * inside a bottom-tab screen so content is never hidden behind the floating
 * tab bar, regardless of device safe-area inset.
 *
 * Use with `edges={['top', 'left', 'right']}` on SafeAreaView so the bottom
 * safe-area is not double-counted.
 */
export function useBottomTabPadding(extra = 16): number {
    const insets = useSafeAreaInsets();
    const { width } = Dimensions.get('window');
    const isMobileWeb   = Platform.OS === 'web' && width < 768;
    const floatingBottom = isMobileWeb ? 30 : Math.max(insets.bottom, 15);
    // Total clearance = tab bar height + distance from screen bottom + breathing room
    return TAB_BAR_HEIGHT + floatingBottom + extra;
}
