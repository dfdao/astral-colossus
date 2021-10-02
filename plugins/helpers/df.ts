import { COLOSSUS_ABI } from "../generated/abi";
import { COLOSSUS_ADDRESS } from "../generated/contract";
import { DaoContractPlayer } from "../types";
import { Planet } from "@darkforest_eth/types";

// @ts-expect-error
const { getPlanetName, getPlayerColor } = df.getProcgenUtils();
// @ts-expect-error
export const twitter = (address) => df.getTwitter(address);
export const playerColor = getPlayerColor;

export function planetName(locationId: Planet) {
  return getPlanetName({ locationId });
}

export function getAccount() {
  // @ts-expect-error
  return df.account;
}

export async function getContract() {
  return {
    // @ts-expect-error
    colossus: await df.loadContract(COLOSSUS_ADDRESS, COLOSSUS_ABI) as DaoContractPlayer,
    colossusAddress: COLOSSUS_ADDRESS,
    colossusABI: COLOSSUS_ABI,
  };
}

export function getMyBalance() {
  // @ts-expect-error
  return df.getMyBalanceEth();
}

// This contains a terrible hack around bad APIs
// getMyBalance$() emitter emits BigNumbers instead of the same type as returned by getMyBalance()
export function subscribeToMyBalance(cb: any) {
  // @ts-expect-error
  return df.getMyBalance$().subscribe(() => cb(getMyBalance()));
}

export function subscribeToBlockNumber(cb: any) {
  // @ts-expect-error
  return df.ethConnection.blockNumber$.subscribe(cb);
}

export function getPlanetByLocationId(locationId: Planet) {
  // @ts-expect-error
  return df.getPlanetWithId(locationId);
}

export function getBlockNumber() {
  // @ts-expect-error
  return df.ethConnection.blockNumber;
}
