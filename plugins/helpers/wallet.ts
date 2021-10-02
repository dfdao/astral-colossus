import { ethers, Wallet } from 'ethers';

export function getMyBalance() {
  // @ts-expect-error
  return df.getMyBalanceEth();
}

export function getWallet() {
  // @ts-expect-error
  const provider = df.ethConnection.provider;
  // @ts-expect-error
  return new ethers.Wallet(df.getPrivateKey(), provider);
}

// This contains a terrible hack around bad APIs
// getMyBalance$() emitter emits BigNumbers instead of the same type as returned by getMyBalance()
export function subscribeToMyBalance(cb: any) {
  // @ts-expect-error
  return df.getMyBalance$().subscribe(() => cb(getMyBalance()));
}
