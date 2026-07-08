import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const COLORS = ['#4F3CE0', '#34D6A8', '#FB3D93', '#F5B731', '#7C5CFC', '#00BCD4', '#FF7A59'];
const { width, height } = Dimensions.get('window');

/** Ráfaga de confeti (cae desde arriba). Reproduce al montar. */
export function Confetti({ count = 44 }: { count?: number }) {
  const piezas = useRef(
    Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 250,
      drift: (Math.random() - 0.5) * 160,
      giro: Math.random() * 3 + 1,
      anim: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    Animated.stagger(
      12,
      piezas.map(p =>
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 1900 + Math.random() * 900,
          delay: p.delay,
          useNativeDriver: true,
        }),
      ),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {piezas.map((p, i) => {
        const translateY = p.anim.interpolate({ inputRange: [0, 1], outputRange: [-40, height * 0.9] });
        const translateX = p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] });
        const opacity = p.anim.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
        const rotate = p.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.giro * 360}deg`] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute', left: p.x, top: 0, width: p.size, height: p.size * 0.6,
              backgroundColor: p.color, borderRadius: 2, opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
