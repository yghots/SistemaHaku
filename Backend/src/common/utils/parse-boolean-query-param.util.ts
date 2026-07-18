// class-transformer's @Type(() => Boolean) hace Boolean(valor), y
// Boolean("false") es true en JS: rompia el filtro `?resuelto=false`
// (Fase 11, ListIncidentesQueryDto). Este parser explicito solo reconoce
// 'true'/'1' y 'false'/'0'; cualquier otro valor se deja intacto para
// que @IsBoolean lo rechace con 400 (Fase 12, Correccion 1). Extraido a
// utilidad compartida en la Fase 33 al necesitarse un segundo filtro
// booleano (`ListUsuariosQueryDto.activo`) — evita duplicar la funcion.
export function parseBooleanQueryParam(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  return value;
}
