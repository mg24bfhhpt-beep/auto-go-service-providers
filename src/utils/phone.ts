// AutoGo Partners - Phone formatting
export function formatEgyptPhone(input: string): string {
  const cleaned = input.replace(/\D/g, '');

  if (cleaned.startsWith('20') && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+20${cleaned.slice(1)}`;
  }

  if (cleaned.length === 10) {
    return `+20${cleaned}`;
  }

  if (input.startsWith('+20')) {
    return input.replace(/\s/g, '');
  }

  return `+20${cleaned}`;
}

export function isValidEgyptPhone(input: string): boolean {
  return /^\+201[0125][0-9]{8}$/.test(formatEgyptPhone(input));
}
