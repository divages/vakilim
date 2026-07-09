export function formatAzn(qepik: number): string {
  const azn = qepik / 100;
  const text = Number.isInteger(azn) ? azn.toString() : azn.toFixed(2);
  return `${text} ₼`;
}
