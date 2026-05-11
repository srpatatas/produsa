export function getFlagUrl(countryCode: string, width: number = 80): string {
  return `https://flagcdn.com/w${width}/${countryCode.toLowerCase()}.png`;
}

export function getFlagUrl2x(countryCode: string, width: number = 80): string {
  return `https://flagcdn.com/w${width * 2}/${countryCode.toLowerCase()}.png`;
}
