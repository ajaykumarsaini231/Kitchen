export function formatINR(n) {
  const num = Number(n) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}
