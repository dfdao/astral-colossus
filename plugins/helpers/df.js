import { CHARITY_ABI } from "../generated/abi";
import { CHARITY_ADDRESS } from "../generated/contract";

const { getPlanetName, getPlayerColor } = df.getProcgenUtils();
export const twitter = (address) => df.getTwitter(address);
export const playerColor = getPlayerColor;

export function planetName(locationId) {
  return getPlanetName({ locationId });
}

export function getAccount() {
  return df.account;
}

export async function getContract() {
  return {
    charity: await df.loadContract(CHARITY_ADDRESS, CHARITY_ABI),
    charityAddress: CHARITY_ADDRESS,
    charityABI: CHARITY_ABI,
  };
}

export function getMyBalance() {
  return df.getMyBalanceEth();
}

// This contains a terrible hack around bad APIs
// getMyBalance$() emitter emits BigNumbers instead of the same type as returned by getMyBalance()
export function subscribeToMyBalance(cb) {
  return df.getMyBalance$().subscribe(() => cb(getMyBalance()));
}

export function subscribeToBlockNumber(cb) {
  return df.ethConnection.blockNumber$.subscribe(cb);
}

export function getPlanetByLocationId(locationId) {
  return df.getPlanetWithId(locationId);
}

export function getBlockNumber() {
  return df.ethConnection.blockNumber;
}
