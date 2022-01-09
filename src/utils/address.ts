export function shortenAddress(address: string, before: number = 4, after: number = 4): string {
  if (!address) return "";

  if (address.length <= before + after) return address;

  return `${address.substring(0, before)}...${address.substring(
    address.length - after,
    address.length
  )}`;
}
