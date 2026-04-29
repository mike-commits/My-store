try {
  const rn = require('react-native');
  console.log('React Native found:', Object.keys(rn).length, 'exports');
} catch (e) {
  console.error('React Native not found:', e.message);
}
