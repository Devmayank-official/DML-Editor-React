export const triggerHaptic = (pattern: number | number[] = 10): void => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};
