-- otorgar_beneficio no lleva verificación de permisos (otorga sin más), así que
-- NO debe ser invocable por clientes. Solo triggers (security definer) y la edge
-- function (service_role) la usan.
revoke execute on function otorgar_beneficio(uuid, uuid, text) from public, anon, authenticated;
grant execute on function otorgar_beneficio(uuid, uuid, text) to service_role;
