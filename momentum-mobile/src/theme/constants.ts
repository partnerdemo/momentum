// src/theme/constants.ts
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';
export const KEYBOARD_VERTICAL_OFFSET = IS_IOS ? 0 : 20;

export const THEME_MODES = {
  PARENT: 'PARENT',
  FAMILY: 'FAMILY',
} as const;
