-- =============================================================
-- 20260707220000_imagenes_reales
-- Reemplaza las imágenes aleatorias (picsum) por fotos REALES por
-- keyword (loremflickr) acordes al tipo de negocio y al producto.
-- =============================================================

-- Logo + portada por tipo de negocio.
update negocio n set
  logo_url    = 'https://loremflickr.com/300/300/' || m.k || '?lock=' || abs(hashtext('logo' || n.id::text)),
  portada_url = 'https://loremflickr.com/900/400/' || m.k || '?lock=' || abs(hashtext('port' || n.id::text))
from (
  select id, case tipo
    when 'cafeteria'   then 'coffee,cafe'
    when 'restaurante' then 'grill,steak,food'
    when 'barberia'    then 'barbershop,barber'
    when 'gimnasio'    then 'gym,fitness'
    else 'shop,store'
  end as k
  from negocio
) m
where m.id = n.id;

-- Foto por producto (keyword según el nombre; fallback al tipo del negocio).
update catalogo_item ci set
  foto_url = 'https://loremflickr.com/400/400/' || m.kw || '?lock=' || abs(hashtext('prod' || ci.id::text))
from (
  select c.id,
    case
      when c.nombre ~* 'taco'                                                     then 'tacos,mexican'
      when c.nombre ~* 'caf|espresso|latte|capuch|americano|moka'                 then 'coffee'
      when c.nombre ~* 'cheesecake|croissant|pastel|postre|galleta|pan'           then 'pastry,dessert'
      when c.nombre ~* 'arrachera|bistec|alambre|carne|parrilla|asado|costilla'   then 'steak,grill,meat'
      when c.nombre ~* 'agua|refresco|bebida|jugo|soda'                           then 'drink,beverage'
      when c.nombre ~* 'barba|afeit|corte|fade|shampoo|cera|perfilad|dise|clasic|niñ' then 'barbershop,haircut'
      when c.nombre ~* 'spinning|funcional|mensualidad|visita|clase|pesas|cardio' then 'gym,fitness,workout'
      else nk.k
    end as kw
  from catalogo_item c
  join (
    select id, case tipo
      when 'cafeteria'   then 'coffee'
      when 'restaurante' then 'food'
      when 'barberia'    then 'barbershop'
      when 'gimnasio'    then 'fitness'
      else 'product'
    end as k
    from negocio
  ) nk on nk.id = c.negocio_id
) m
where m.id = ci.id;
