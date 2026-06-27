-- =============================================================
-- 20260624090500_seed_logros
-- 10 insignias globales por defecto (requerimientos 4.5.5).
-- El dueño puede activarlas/editarlas o crear las suyas por negocio.
-- =============================================================

insert into logro (negocio_id, ambito, nombre, descripcion, icono, condicion) values
  (null, 'global', 'Primera Visita', 'Tu primera visita registrada.',            'sparkle',   '{"tipo":"visitas_totales","valor":1}'::jsonb),
  (null, 'global', 'Veterano',       '50 visitas acumuladas.',                   'medal',     '{"tipo":"visitas_totales","valor":50}'::jsonb),
  (null, 'global', 'Centenario',     '100 visitas acumuladas.',                  'trophy',    '{"tipo":"visitas_totales","valor":100}'::jsonb),
  (null, 'global', 'Madrugador',     'Visita antes de las 9:00 am.',             'sunrise',   '{"tipo":"hora_antes","valor":9}'::jsonb),
  (null, 'global', 'Nocturno',       'Visita después de las 9:00 pm.',           'moon',      '{"tipo":"hora_despues","valor":21}'::jsonb),
  (null, 'global', 'Referidor',      'Invitaste a tu primer amigo.',             'users',     '{"tipo":"referidos_completados","valor":1}'::jsonb),
  (null, 'global', 'Cumpleañero',    'Visitaste en tu cumpleaños.',              'cake',      '{"tipo":"visita_cumpleanos","valor":1}'::jsonb),
  (null, 'global', 'Explorador',     'Visitaste 3 negocios distintos de la red.','compass',   '{"tipo":"negocios_distintos","valor":3}'::jsonb),
  (null, 'global', 'Constante',      'Visitaste 3 días seguidos.',               'flame',     '{"tipo":"racha_dias","valor":3}'::jsonb),
  (null, 'global', 'Embajador Oro',  'Alcanzaste el nivel Embajador Oro.',       'crown',     '{"tipo":"nivel_embajador","valor":"oro"}'::jsonb);
