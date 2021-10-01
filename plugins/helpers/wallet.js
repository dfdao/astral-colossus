export function getMyBalance() {
  return df.getMyBalanceEth();
}

// This contains a terrible hack around bad APIs
// getMyBalance$() emitter emits BigNumbers instead of the same type as returned by getMyBalance()
export function subscribeToMyBalance(cb) {
  return df.getMyBalance$().subscribe(() => cb(getMyBalance()));
}
