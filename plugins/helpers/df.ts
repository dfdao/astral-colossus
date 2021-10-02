import { COLOSSUS_ABI } from "../generated/abi";
import { COLOSSUS_ADDRESS } from "../generated/contract";
import { DaoContractPlayer } from "../types";
import { Planet, PlanetType } from "@darkforest_eth/types";

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

export const energy = (planet: Planet) => {
  return Math.floor(planet.energy / planet.energyCap * 100);
}

export const isFoundry = (planet:Planet) => {
  return planet.planetType == PlanetType.RUINS;
}

export const canHaveArtifact = (planet: Planet) => {
  return isFoundry(planet) && !planet.hasTriedFindingArtifact
}

export const enoughEnergyToProspect = (planet:Planet) => {
  return energy(planet) >= 96;
};

export const print = (msg: string) => {
  // @ts-expect-error
  df.terminal.current.println(msg);
}

/* reads on-chain data to confirm */
export const isFindable = (planetDetails: any, currentBlockNumber: number) => {
    const pName = getPlanetName(planetDetails[0][0]);
    print(`examining ${pName}`);
    const prospectedBlockNumber = planetDetails[1][10];
    const hasTriedFindingArtifact = planetDetails[1][9];
    print(`prospected # ${prospectedBlockNumber}\nalready tried to find? ${hasTriedFindingArtifact}`)
    return (
      prospectedBlockNumber !== 0 &&
      !hasTriedFindingArtifact
      // !planet.unconfirmedFindArtifact
      // !prospectExpired(currentBlockNumber, planet.prospectedBlockNumber)
    );
  }
  
export const isProspectable = (planet: Planet) => {
  return isFoundry(planet) && enoughEnergyToProspect(planet) && planet.prospectedBlockNumber === undefined && !planet.unconfirmedProspectPlanet;
}

export const getProspectablePlanets = async (planets: Planet[]) => {
  let prospectablePlanets = planets.filter(isProspectable);  
  return prospectablePlanets;
}

export const bulkUiRefresh = async (planets: Planet[]) => {
  const locationIds = planets.map((p) => p.locationId)
  // @ts-expect-error
  await df.bulkHardRefreshPlanets(locationIds);
}
