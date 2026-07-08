-- =============================================================
-- 20260707200000_seed_logros_30
-- Amplía las insignias globales por defecto a ~30, con leyendas
-- emotivas estilo "logro de videojuego". Aplican a cualquier negocio.
-- =============================================================

-- 1) Reescribe las descripciones de las 10 existentes como leyendas emotivas.
update logro set descripcion = 'Cruzaste la puerta por primera vez. Aquí empieza tu historia con nosotros. ¡Bienvenido!' where ambito='global' and nombre='Primera Visita';
update logro set descripcion = '50 visitas. Ya eres parte del alma de este lugar.'                                        where ambito='global' and nombre='Veterano';
update logro set descripcion = '100 visitas. Pocos llegan tan lejos. Eres leyenda.'                                       where ambito='global' and nombre='Centenario';
update logro set descripcion = 'Llegaste antes de las 9. El mundo aún dormía, pero tú ya estabas aquí.'                    where ambito='global' and nombre='Madrugador';
update logro set descripcion = 'Después de las 9 de la noche. La noche es tuya.'                                          where ambito='global' and nombre='Nocturno';
update logro set descripcion = 'Invitaste a tu primer amigo. Lo bueno se comparte.'                                       where ambito='global' and nombre='Referidor';
update logro set descripcion = 'Nos visitaste en tu cumpleaños. Gracias por celebrar con nosotros.'                       where ambito='global' and nombre='Cumpleañero';
update logro set descripcion = 'Visitaste 3 negocios distintos de la red. Te gusta descubrir.'                            where ambito='global' and nombre='Explorador';
update logro set descripcion = '3 días seguidos. La constancia te define.'                                                where ambito='global' and nombre='Constante';
update logro set descripcion = 'Alcanzaste el nivel Embajador Oro. Brillas entre los mejores.'                            where ambito='global' and nombre='Embajador Oro';

-- 2) Inserta 20 nuevas (idempotente por nombre).
insert into logro (negocio_id, ambito, nombre, descripcion, icono, condicion)
select v.negocio_id::uuid, v.ambito::logro_ambito, v.nombre, v.descripcion, v.icono, v.condicion::jsonb
from (values
  (null, 'global', 'Habitual',                'Cinco visitas. Ya sabes el camino de memoria.',                 'star',    '{"tipo":"visitas_totales","valor":5}'),
  (null, 'global', 'Cliente Frecuente',       'Diez visitas. Tu lugar ya te guarda un espacio.',               'ticket',  '{"tipo":"visitas_totales","valor":10}'),
  (null, 'global', 'Fiel de Corazón',         '25 visitas. Esto ya es amor del bueno.',                        'heart',   '{"tipo":"visitas_totales","valor":25}'),
  (null, 'global', 'Coleccionista',           '75 visitas llenas de buenos momentos.',                         'chart',   '{"tipo":"visitas_totales","valor":75}'),
  (null, 'global', 'Leyenda Viva',            '250 visitas. Tu nombre se cuenta en historias.',                'trophy',  '{"tipo":"visitas_totales","valor":250}'),
  (null, 'global', 'Racha de Fuego',          '7 días seguidos. Estás encendido.',                             'flame',   '{"tipo":"racha_dias","valor":7}'),
  (null, 'global', 'Imparable',               '14 días sin fallar. Nada te detiene.',                          'flame',   '{"tipo":"racha_dias","valor":14}'),
  (null, 'global', 'Inquebrantable',          '30 días seguidos. Eres de otro nivel.',                         'crown',   '{"tipo":"racha_dias","valor":30}'),
  (null, 'global', 'Amanecer',                'Antes de las 7 de la mañana. El primero en todo.',              'sunrise', '{"tipo":"hora_antes","valor":7}'),
  (null, 'global', 'Trasnochador',            'Después de las 11 de la noche. Las mejores historias pasan tarde.', 'moon', '{"tipo":"hora_despues","valor":23}'),
  (null, 'global', 'Buen Amigo',              '3 amigos invitados. Eres pura buena vibra.',                    'users',   '{"tipo":"referidos_completados","valor":3}'),
  (null, 'global', 'Red de Amigos',           '10 amigos. Construiste una comunidad.',                         'users',   '{"tipo":"referidos_completados","valor":10}'),
  (null, 'global', 'Turista',                 '5 negocios distintos. Nada se te escapa.',                      'compass', '{"tipo":"negocios_distintos","valor":5}'),
  (null, 'global', 'Aventurero',              '10 negocios explorados. El mapa es tuyo.',                      'map',     '{"tipo":"negocios_distintos","valor":10}'),
  (null, 'global', 'Embajador Bronce',        'Nivel Embajador Bronce. El primer escalón de la gloria.',       'medal',   '{"tipo":"nivel_embajador","valor":"bronce"}'),
  (null, 'global', 'Embajador Plata',         'Nivel Embajador Plata. Cada vez más cerca de la cima.',         'medal',   '{"tipo":"nivel_embajador","valor":"plata"}'),
  (null, 'global', 'Embajador Platino',       'Nivel Embajador Platino. Estás entre los elegidos.',            'crown',   '{"tipo":"nivel_embajador","valor":"platino"}'),
  (null, 'global', 'Corazón del Lugar',       'El negocio te reconoce como parte de la familia.',              'heart',   '{}'),
  (null, 'global', 'Estrella del Mes',        'Fuiste el cliente del mes. Brillaste más que nadie.',           'star',    '{}'),
  (null, 'global', 'Fundador',                'Estuviste desde el principio. Un verdadero pionero.',           'sparkle', '{}')
) as v(negocio_id, ambito, nombre, descripcion, icono, condicion)
where not exists (select 1 from logro l where l.ambito='global' and l.nombre = v.nombre);
