import React from 'react';
import Svg, { Circle, Line, Path, Polygon, Polyline } from 'react-native-svg';
import { colors } from '../theme';

export type IconName =
  | 'phone' | 'map' | 'chat' | 'gift' | 'trophy' | 'star' | 'medal'
  | 'ticket' | 'target' | 'dice' | 'calendar' | 'chart' | 'share' | 'chevron' | 'sparkles'
  | 'home' | 'store' | 'user' | 'users' | 'scan' | 'crown' | 'camera' | 'check'
  | 'wheel' | 'bag' | 'coin' | 'lock' | 'flame' | 'compass' | 'sunrise' | 'moon'
  | 'cake' | 'megaphone' | 'bell' | 'help' | 'heart' | 'hand' | 'clover' | 'alert' | 'hash' | 'arrow'
  | 'trash' | 'check2';

/** Iconos de línea propios (SVG). Estilo consistente: trazo redondeado, currentColor. */
export function Icon({ name, size = 22, color = colors.textPrimary, strokeWidth = 2 }: {
  name: IconName; size?: number; color?: string; strokeWidth?: number;
}) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
  const f = { fill: color };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'phone' && <Path {...p} d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.8 2Z" />}
      {name === 'map' && <Path {...p} d="M3 11 22 2l-9 19-2-8-8-2Z" />}
      {name === 'chat' && <Path {...p} d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />}
      {name === 'gift' && (<>
        <Polyline {...p} points="20 12 20 22 4 22 4 12" />
        <Path {...p} d="M2 7h20v5H2z" /><Line {...p} x1="12" y1="22" x2="12" y2="7" />
        <Path {...p} d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <Path {...p} d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </>)}
      {name === 'trophy' && (<>
        <Path {...p} d="M6 4h12v5a6 6 0 0 1-12 0V4Z" />
        <Path {...p} d="M6 5H3v1a4 4 0 0 0 3 3.9M18 5h3v1a4 4 0 0 1-3 3.9" />
        <Line {...p} x1="12" y1="15" x2="12" y2="19" /><Path {...p} d="M8 22h8l-1-3H9l-1 3Z" />
      </>)}
      {name === 'star' && <Polygon {...p} points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3" />}
      {name === 'medal' && (<><Circle {...p} cx="12" cy="14" r="6" /><Path {...p} d="M8.5 8.5 6 2h5l1.5 4M15.5 8.5 18 2h-5l-1.5 4" /></>)}
      {name === 'ticket' && <Path {...p} d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2 2 2 0 0 0 0-4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />}
      {name === 'target' && (<><Circle {...p} cx="12" cy="12" r="9" /><Circle {...p} cx="12" cy="12" r="5" /><Circle {...f} cx="12" cy="12" r="1.5" /></>)}
      {name === 'dice' && (<>
        <Path {...p} d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
        <Circle {...f} cx="9" cy="9" r="1.2" /><Circle {...f} cx="15" cy="15" r="1.2" />
        <Circle {...f} cx="15" cy="9" r="1.2" /><Circle {...f} cx="9" cy="15" r="1.2" />
      </>)}
      {name === 'calendar' && (<>
        <Path {...p} d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
        <Line {...p} x1="4" y1="9" x2="20" y2="9" /><Line {...p} x1="8" y1="2" x2="8" y2="6" /><Line {...p} x1="16" y1="2" x2="16" y2="6" />
      </>)}
      {name === 'chart' && (<><Line {...p} x1="4" y1="20" x2="20" y2="20" /><Line {...p} x1="7" y1="20" x2="7" y2="13" /><Line {...p} x1="12" y1="20" x2="12" y2="8" /><Line {...p} x1="17" y1="20" x2="17" y2="11" /></>)}
      {name === 'share' && (<><Circle {...p} cx="18" cy="5" r="3" /><Circle {...p} cx="6" cy="12" r="3" /><Circle {...p} cx="18" cy="19" r="3" /><Line {...p} x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><Line {...p} x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></>)}
      {name === 'chevron' && <Polyline {...p} points="9 6 15 12 9 18" />}
      {name === 'arrow' && (<><Line {...p} x1="4" y1="12" x2="20" y2="12" /><Polyline {...p} points="14 6 20 12 14 18" /></>)}
      {name === 'sparkles' && <Path {...p} d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3ZM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" />}
      {name === 'home' && (<><Path {...p} d="M3 11l9-8 9 8" /><Path {...p} d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" /></>)}
      {name === 'store' && (<><Path {...p} d="M4 9l1.2-5h13.6L20 9" /><Path {...p} d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" /><Path {...p} d="M9 21v-6h6v6" /></>)}
      {name === 'user' && (<><Circle {...p} cx="12" cy="8" r="4" /><Path {...p} d="M4 21a8 8 0 0 1 16 0" /></>)}
      {name === 'users' && (<><Circle {...p} cx="9" cy="8" r="3.5" /><Path {...p} d="M2.5 21a6.5 6.5 0 0 1 13 0" /><Path {...p} d="M16 5a3.5 3.5 0 0 1 0 7M18 21a6.5 6.5 0 0 0-3-5.5" /></>)}
      {name === 'scan' && (<><Path {...p} d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><Line {...p} x1="4" y1="12" x2="20" y2="12" /></>)}
      {name === 'crown' && (<><Path {...p} d="M3 7l4 4 5-6 5 6 4-4-1.6 12H4.6L3 7Z" /><Line {...p} x1="4.6" y1="19" x2="19.4" y2="19" /></>)}
      {name === 'camera' && (<><Path {...p} d="M4 8a2 2 0 0 1 2-2h1.5l1-2h7l1 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /><Circle {...p} cx="12" cy="12.5" r="3.5" /></>)}
      {name === 'check' && <Polyline {...p} points="5 13 9 17 19 7" />}
      {name === 'wheel' && (<><Circle {...p} cx="12" cy="12" r="9" /><Line {...p} x1="12" y1="3" x2="12" y2="21" /><Line {...p} x1="3" y1="12" x2="21" y2="12" /><Line {...p} x1="5.6" y1="5.6" x2="18.4" y2="18.4" /><Line {...p} x1="18.4" y1="5.6" x2="5.6" y2="18.4" /><Circle {...f} cx="12" cy="12" r="2" /></>)}
      {name === 'bag' && (<><Path {...p} d="M6 8h12l-1 12H7L6 8Z" /><Path {...p} d="M9 8a3 3 0 0 1 6 0" /></>)}
      {name === 'coin' && (<><Circle {...p} cx="12" cy="12" r="9" /><Path {...p} d="M12 7v10M14.5 9.2A2.6 2.6 0 0 0 12 8c-1.4 0-2.5.8-2.5 2s1.1 2 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2a2.6 2.6 0 0 1-2.5-1.2" /></>)}
      {name === 'lock' && (<><Path {...p} d="M6 10V8a6 6 0 0 1 12 0v2" /><Path {...p} d="M5 10h14v10H5z" /><Line {...p} x1="12" y1="14" x2="12" y2="16" /></>)}
      {name === 'flame' && <Path {...p} d="M12 3c2.5 3.5 5 5.5 5 9a5 5 0 0 1-10 0c0-1.3.5-2.4 1.3-3.4.4 1.7 1.3 2.2 2.2 1.4C11.5 8.5 10.5 6 12 3Z" />}
      {name === 'compass' && (<><Circle {...p} cx="12" cy="12" r="9" /><Polygon {...p} points="15.5 8.5 10.5 10.5 8.5 15.5 13.5 13.5" /></>)}
      {name === 'sunrise' && (<><Path {...p} d="M4 18h16M7 18a5 5 0 0 1 10 0" /><Line {...p} x1="12" y1="3" x2="12" y2="7" /><Line {...p} x1="4.5" y1="9.5" x2="6" y2="11" /><Line {...p} x1="19.5" y1="9.5" x2="18" y2="11" /></>)}
      {name === 'moon' && <Path {...p} d="M21 13a8 8 0 1 1-9-9 6 6 0 0 0 9 9Z" />}
      {name === 'cake' && (<><Path {...p} d="M4 21v-8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8" /><Line {...p} x1="3" y1="21" x2="21" y2="21" /><Path {...p} d="M4 15c1.5 1.5 3 1.5 4 0s2.5-1.5 4 0 2.5 1.5 4 0" /><Line {...p} x1="12" y1="3" x2="12" y2="8" /></>)}
      {name === 'megaphone' && (<><Path {...p} d="M3 11v2a1 1 0 0 0 1 1h2l9 5V5L6 10H4a1 1 0 0 0-1 1Z" /><Path {...p} d="M18 8a4 4 0 0 1 0 8" /></>)}
      {name === 'bell' && (<><Path {...p} d="M6 9a6 6 0 0 1 12 0c0 4 2 5 2 5H4s2-1 2-5Z" /><Path {...p} d="M10 19a2 2 0 0 0 4 0" /></>)}
      {name === 'help' && (<><Circle {...p} cx="12" cy="12" r="9" /><Path {...p} d="M9.5 9.5a2.5 2.5 0 0 1 4.9.5c0 1.7-2.4 2-2.4 3.5" /><Circle {...f} cx="12" cy="17" r="1" /></>)}
      {name === 'heart' && <Path {...p} d="M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5C19 15.5 12 20 12 20Z" />}
      {name === 'hand' && (<><Path {...p} d="M8 11V5a2 2 0 0 1 4 0v6" /><Path {...p} d="M12 11V4a2 2 0 0 1 4 0v7" /><Path {...p} d="M16 11V6a2 2 0 0 1 4 0v8a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.6L4 15a2 2 0 0 1 3-2.6l1 1.3V11a2 2 0 0 1 4 0" /></>)}
      {name === 'clover' && (<><Circle {...p} cx="9" cy="9" r="3.5" /><Circle {...p} cx="15" cy="9" r="3.5" /><Circle {...p} cx="9" cy="15" r="3.5" /><Circle {...p} cx="15" cy="15" r="3.5" /></>)}
      {name === 'alert' && (<><Circle {...p} cx="12" cy="12" r="9" /><Line {...p} x1="12" y1="8" x2="12" y2="13" /><Circle {...f} cx="12" cy="16.5" r="1" /></>)}
      {name === 'hash' && (<><Line {...p} x1="4" y1="9" x2="20" y2="9" /><Line {...p} x1="4" y1="15" x2="20" y2="15" /><Line {...p} x1="9" y1="4" x2="7" y2="20" /><Line {...p} x1="17" y1="4" x2="15" y2="20" /></>)}
      {name === 'trash' && (<>
        <Path {...p} d="M4 7h16" />
        <Path {...p} d="M6.5 7l.9 12a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9L17.5 7" />
        <Path {...p} d="M9.5 7V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
        <Line {...p} x1="10" y1="11" x2="10" y2="17" /><Line {...p} x1="14" y1="11" x2="14" y2="17" />
      </>)}
      {name === 'check2' && <Polyline {...p} points="20 6 9 17 4 12" />}
    </Svg>
  );
}
