// All numbers use European (Western) numerals in both locales

// Format phone number - always European numerals
export function formatPhoneForLocale(phone: string, _locale: string): string {
  return phone;
}

// Format vehicle plate - always European numerals
export function formatPlateForLocale(plate: string, _locale: string): string {
  return plate;
}

// Format currency - always European numerals
export function formatCurrencyForLocale(amount: number, _locale: string): string {
  return `$${amount.toLocaleString()}`;
}

// Format number - always European numerals
export function formatNumberForLocale(num: number, _locale: string): string {
  return num.toString();
}
