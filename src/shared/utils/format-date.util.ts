export function formatDate(date: Date, locale: string = 'es-ES'): string {
   return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
   }).format(date);
}

export function formatDateShort(date: Date, locale: string = 'es-ES'): string {
   return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
   }).format(date);
}