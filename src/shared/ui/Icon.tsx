import React from 'react';
import Svg, { Circle, Line, Path, Polygon, Polyline } from 'react-native-svg';
import { colors } from '../theme';

export type IconName =
  | 'phone' | 'map' | 'chat' | 'gift' | 'trophy' | 'star' | 'medal'
  | 'ticket' | 'target' | 'dice' | 'calendar' | 'chart' | 'share' | 'chevron' | 'sparkles';

/** Iconos de línea propios (SVG). Estilo consistente: trazo redondeado, currentColor. */
export function Icon({ name, size = 22, color = colors.textPrimary, strokeWidth = 2 }: {
  name: IconName; size?: number; color?: string; strokeWidth?: number;
}) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'phone' && (
        <Path {...p} d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.8 2Z" />
      )}
      {name === 'map' && <Path {...p} d="M3 11 22 2l-9 19-2-8-8-2Z" />}
      {name === 'chat' && (
        <Path {...p} d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
      )}
      {name === 'gift' && (
        <>
          <Polyline {...p} points="20 12 20 22 4 22 4 12" />
          <Path {...p} d="M2 7h20v5H2z" />
          <Line {...p} x1="12" y1="22" x2="12" y2="7" />
          <Path {...p} d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <Path {...p} d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </>
      )}
      {name === 'trophy' && (
        <>
          <Path {...p} d="M6 4h12v5a6 6 0 0 1-12 0V4Z" />
          <Path {...p} d="M6 5H3v1a4 4 0 0 0 3 3.9" />
          <Path {...p} d="M18 5h3v1a4 4 0 0 1-3 3.9" />
          <Line {...p} x1="12" y1="15" x2="12" y2="19" />
          <Path {...p} d="M8 22h8l-1-3H9l-1 3Z" />
        </>
      )}
      {name === 'star' && (
        <Polygon {...p} points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3" />
      )}
      {name === 'medal' && (
        <>
          <Circle {...p} cx="12" cy="14" r="6" />
          <Path {...p} d="M8.5 8.5 6 2h5l1.5 4M15.5 8.5 18 2h-5l-1.5 4" />
        </>
      )}
      {name === 'ticket' && (
        <Path {...p} d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2 2 2 0 0 0 0-4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />
      )}
      {name === 'target' && (
        <>
          <Circle {...p} cx="12" cy="12" r="9" />
          <Circle {...p} cx="12" cy="12" r="5" />
          <Circle {...p} cx="12" cy="12" r="1.5" />
        </>
      )}
      {name === 'dice' && (
        <>
          <Path {...p} d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
          <Circle cx="9" cy="9" r="1.2" fill={color} />
          <Circle cx="15" cy="15" r="1.2" fill={color} />
          <Circle cx="15" cy="9" r="1.2" fill={color} />
          <Circle cx="9" cy="15" r="1.2" fill={color} />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Path {...p} d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
          <Line {...p} x1="4" y1="9" x2="20" y2="9" />
          <Line {...p} x1="8" y1="2" x2="8" y2="6" />
          <Line {...p} x1="16" y1="2" x2="16" y2="6" />
        </>
      )}
      {name === 'chart' && (
        <>
          <Line {...p} x1="4" y1="20" x2="20" y2="20" />
          <Line {...p} x1="7" y1="20" x2="7" y2="13" />
          <Line {...p} x1="12" y1="20" x2="12" y2="8" />
          <Line {...p} x1="17" y1="20" x2="17" y2="11" />
        </>
      )}
      {name === 'share' && (
        <>
          <Circle {...p} cx="18" cy="5" r="3" />
          <Circle {...p} cx="6" cy="12" r="3" />
          <Circle {...p} cx="18" cy="19" r="3" />
          <Line {...p} x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
          <Line {...p} x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
        </>
      )}
      {name === 'chevron' && <Polyline {...p} points="9 6 15 12 9 18" />}
      {name === 'sparkles' && (
        <Path {...p} d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3ZM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" />
      )}
    </Svg>
  );
}
