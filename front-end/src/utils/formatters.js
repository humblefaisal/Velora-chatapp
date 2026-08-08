export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).format(d);
};
