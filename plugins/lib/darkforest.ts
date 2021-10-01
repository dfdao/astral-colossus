import { useState, useEffect } from "preact/hooks";
import type { LocationId, Planet } from "@darkforest_eth/types";
import { CORE_CONTRACT_ADDRESS } from "@darkforest_eth/contracts";
import type { DarkForestCore } from "@darkforest_eth/contracts/typechain";
import CORE_CONTRACT_ABI from "@darkforest_eth/contracts/abis/DarkForestCore.json";
import { DaoContractPlayer } from "../../typechain";
// import * as snarks from "@darkforest_eth/snarks";
import * as  hashing from '@darkforest_eth/hashing';
import * as serde from "@darkforest_eth/serde";
import * as CONSTANTS from '@darkforest_eth/constants';

// @ts-expect-error
const pg = df.getProcgenUtils();

const getRandomActionId = () => {
  const hex = '0123456789abcdef';

  let ret = '';
  for (let i = 0; i < 10; i += 1) {
    ret += hex[Math.floor(hex.length * Math.random())];
  }
  return ret;
};

export function getPlanetName(locationId: LocationId): string {
  // @ts-expect-error
  const planet = df.getPlanetWithId(locationId);
  return pg.getPlanetName(planet);
}

export async function getCoreContract(): Promise<DarkForestCore> {
  // @ts-expect-error
  return df.contractsAPI.coreContract as Promise<DarkForestCore>;
}

export async function getDaoContract(DAO_ADDRESS: string, DAO_ABI: any): Promise<DaoContractPlayer> {
  // @ts-expect-error
  return df.loadContract(DAO_ADDRESS, DAO_ABI) as Promise<DaoContractPlayer>;
}

export function useCoreContract(): DarkForestCore | undefined {
  const [contract, setContract] = useState<DarkForestCore | undefined>(undefined);
  useEffect(() => {
    getCoreContract().then((c) => {
      console.log("got contract", c);
      setContract(c);
    });
  }, []);
  return contract;
}



export function useSelectedPlanet(): LocationId | undefined {
  const [selected, setSelected] = useState<LocationId | undefined>(undefined);
  useEffect(() => {
    // @ts-expect-error
    const { unsubscribe } = ui.selectedPlanetId$.subscribe(setSelected);
    return () => {
      unsubscribe();
    };
  });
  return selected;
}

export function usePlanet(locationId: LocationId | undefined): Planet | undefined {
  const [planet, setPlanet] = useState<Planet | undefined>(undefined);
  useEffect(() => {
    if (locationId) {
      // @ts-expect-error
      const planet_ = df.getPlanetWithId(locationId);
      return setPlanet(planet_);
    }
    return setPlanet(undefined);
  }, [locationId]);
  return planet;
}

export function usePlanetName(locationId: LocationId | undefined): string | undefined {
  const planet = usePlanet(locationId);
  const [name, setName] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (planet) {
      const name_ = pg.getPlanetName(planet);
      return setName(name_);
    }
    return setName(undefined);
  }, [planet]);
  return name;
}

export async function move(from, to, forces, silver, artifactId, darkForestCore: DarkForestCore): void {
  // we need to know the zksnark constants to do a move

  const oldX = from.location.coords.x;
  const oldY = from.location.coords.y;
  const newX = to.location.coords.x;
  const newY = to.location.coords.y;
  const xDiff = newX - oldX;
  const yDiff = newY - oldY;

  const distMax = Math.ceil(Math.sqrt(xDiff ** 2 + yDiff ** 2));
  
  const worldRadius = (await darkForestCore.worldRadius()).toNumber();
  
  // @ts-expect-error
  df.snarkHelper
    .getMoveArgs(oldX, oldY, newX, newY, worldRadius, distMax)
    .then(async (callArgs) => { 
      console.log(`somegoddam callArgs`, callArgs);
  
      const proofA = callArgs[0];
      const proofB = callArgs[1];
      const proofC = callArgs[2];
      const input = [
        ...callArgs[3],
        (forces * CONSTANTS.CONTRACT_PRECISION).toString(),
        (silver * CONSTANTS.CONTRACT_PRECISION).toString(),
        '0' // will need to update for artifacts later.
      ];      
 
      const tx = await darkForestCore.populateTransaction.move(proofA, proofB, proofC, input);
      // const moveReceipt = await df.contractsAPI.move(actionId, callArgs, forces, silver, artifactId);
      console.log(`MoveReceipt`, tx)
    });
}
