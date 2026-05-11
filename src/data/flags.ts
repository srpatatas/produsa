const VALID_WIDTHS = [20, 40, 80, 160, 320];

export function getFlagUrl(countryCode: string, width: number = 80): string {
  const cdnWidth = VALID_WIDTHS.find((w) => w >= width) ?? 80;
  return `https://flagcdn.com/w${cdnWidth}/${countryCode.toLowerCase()}.png`;
}
