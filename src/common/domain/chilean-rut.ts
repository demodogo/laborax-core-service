export class ChileanRut {
  static normalize(value: string) {
    const cleanValue = value.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
    const body = cleanValue.slice(0, -1);
    const verifier = cleanValue.slice(-1);

    if (!/^\d+$/.test(body) || !/^[0-9K]$/.test(verifier)) {
      throw new Error('Invalid RUT format');
    }

    return `${Number(body)}-${verifier}`;
  }

  static isValid(value: string) {
    try {
      const normalized = ChileanRut.normalize(value);
      const [body, verifier] = normalized.split('-');
      return ChileanRut.calculateVerifier(body) === verifier;
    } catch {
      return false;
    }
  }

  private static calculateVerifier(body: string) {
    let sum = 0;
    let multiplier = 2;

    for (let index = body.length - 1; index >= 0; index -= 1) {
      sum += Number(body[index]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const value = 11 - (sum % 11);
    if (value === 11) return '0';
    if (value === 10) return 'K';
    return String(value);
  }
}
