import { DFAnimation, Planet, PlanetType } from "@darkforest_eth/types";
import { ethers } from "ethers";
import { getPlanetName } from "../lib/darkforest";
import { useState } from "preact/hooks";
import { useContract, usePlayer, useSelectedPlanet, useCoreContract, useGasPrice } from '.'

export function useColossus() {
  const { colossus, coreContract } = useContract()
  const player = usePlayer()
  const selectedPlanet = useSelectedPlanet();
  const gasPrice = useGasPrice();
  const [error, setError] = useState('')

  const print = (msg: string) => {
    // @ts-expect-error
    df.terminal.current.println(msg);
  };

  const getRandomActionId = () => {
    const hex = "0123456789abcdef";

    let ret = "";
    for (let i = 0; i < 10; i += 1) {
      ret += hex[Math.floor(hex.length * Math.random())];
    }
    return ret;
  };

  
  const confirmedRegisteredPlanets = async (planets: Planet[]) => {
    let confirmedPlanets: Array<Planet> = [];
    for (let p of planets) {
      const pName = getPlanetName(p.locationId);
      const id = ethers.BigNumber.from(`0x${p.locationId}`);
      const registrar = await colossus.planetOwners(id);

      if (registrar == player.address) {
        confirmedPlanets.push(p);
        print(`dao recognizes ${pName} is owned by player`);
      } else {
        print(`dao DOESNT recognize ${pName} is owned by player`);
      }
    }
    return confirmedPlanets;
  };
  
  const confirmedDaoOwners = async (planets: Planet[]) => {
    // await bulkPlanetRefresh(planets);
    let confirmedPlanets = [];
    for (let p of planets) {
      console.log(`confirmed check`, p);
      const pName = getPlanetName(p.locationId);
      const id = ethers.BigNumber.from(`0x${p.locationId}`);
      console.log('AA', coreContract, id)
      const planet = await coreContract.planets(id);
      if (planet.owner == colossus.address) {
        confirmedPlanets.push(p);
        print(`${pName} is owned by dao`);
      } else {
        print(`${pName} is not owned by dao`);
      }
    }
    return confirmedPlanets;
  };
  const confirmedPlayerOwners = async (planets: Planet[]) => {
    // await bulkPlanetRefresh(planets);
    let confirmedPlanets = [];
    for (let p of planets) {
      console.log(`confirmed check`, p);
      const pName = getPlanetName(p.locationId);
      const id = ethers.BigNumber.from(`0x${p.locationId}`);
      const planet = await coreContract.planets(id);
      if (planet.owner == player.address) {
        confirmedPlanets.push(p);
        print(`${pName} is owned by player`);
      } else {
        print(`${pName} is not owned by player`);
      }
    }
    return confirmedPlanets;
  };

  const energy = (planet: Planet) => {
    return Math.floor((planet.energy / planet.energyCap) * 100);
  };

  const isFoundry = (planet: Planet) => {
    return planet.planetType == PlanetType.RUINS;
  };

  const canHaveArtifact = (planet: Planet) => {
    return isFoundry(planet) && !planet.hasTriedFindingArtifact;
  };

  const enoughEnergyToProspect = (planet: Planet) => {
    return energy(planet) >= 96;
  };

  function isProspectable(planet: Planet) {
    return (
      isFoundry(planet) &&
      planet.prospectedBlockNumber === undefined &&
      !planet.unconfirmedProspectPlanet
    );
  }

  const getProspectablePlanets = async (planets: Planet[]) => {
    let prospectablePlanets = planets
      .filter(canHaveArtifact)
      .filter(isProspectable)
      .filter(enoughEnergyToProspect);

    return prospectablePlanets;
  };


  /* reads on-chain data to confirm */
  const isFindable = (planetDetails: any, currentBlockNumber: number) => {
    const pName = getPlanetName(planetDetails[0][0]);
    print(`examining ${pName}`);
    const prospectedBlockNumber = planetDetails[1][10];
    const hasTriedFindingArtifact = planetDetails[1][9];
    print(
      `prospected # ${prospectedBlockNumber}\nalready tried to find? ${hasTriedFindingArtifact}`
    );
    return prospectedBlockNumber !== 0 && !hasTriedFindingArtifact
  };

  const blocksLeftToProspectExpiration = (
    currentBlockNumber: number,
    prospectedBlockNumber: number
  ) => {
    return (prospectedBlockNumber || 0) + 255 - currentBlockNumber;
  };
  const prospectExpired = (
    currentBlockNumber: number,
    prospectedBlockNumber: number
  ) => {
    return (
      blocksLeftToProspectExpiration(
        currentBlockNumber,
        prospectedBlockNumber
      ) <= 0
    );
  };

  const checkDaoOwnership = async () => {
    if (!selectedPlanet) {
      print(`no planet selected to check`);
      return
    }
    // dao recognizes player as owner
    const pName = getPlanetName(selectedPlanet);
    const pBigNumber = ethers.BigNumber.from(`0x${selectedPlanet}`);
    const owner = await colossus.planetOwners(pBigNumber);
    print(`dao says ${pName} is owned by ${owner}`);
  };

  // TODO: import findMoveArgs type
  const processAndReturnPlanets = async (
    rips: Planet[],
    findArgsList: any[]
  ) => {
    const prevScore = (
      await colossus.contributions(player.address)
    ).toNumber();
    let currScore = prevScore;

    print(
      `received ${rips.length} rips and ${findArgsList.length} foundries for processing`
    );
    const locationIds = rips.map((p) =>
      ethers.BigNumber.from(`0x${p.locationId}`)
    );
 
    let numReturned = 0;
    console.log(`colossus in process`, colossus);
    try {
      const gasEstimate = await colossus.estimateGas.processAndReturnPlanets(
        locationIds,
        findArgsList,
      );
      print(`gas estimate for process and return ${ethers.utils.formatUnits(gasEstimate, "wei")}`);
      // using double gas
      const gasLimit = gasEstimate.mul(ethers.BigNumber.from(2));
      const processTx = await colossus.processAndReturnPlanets(
        locationIds,
        findArgsList,
        { gasPrice, gasLimit }
      );
      console.log(`processTx`, processTx);
      console.log(
        `gasLimit: ${processTx.gasLimit.toString()}, gasPrice: ${processTx.gasPrice?.toString()}`
      );
      const processReceipt = await processTx.wait();
      print(`processed block number ${processReceipt.blockNumber}`);

      numReturned += rips.length + findArgsList.length;
      currScore = (await colossus.contributions(player.address)).toNumber();
    } catch (error) {
      console.log(`error processing and returning`, error);
    }
    const increase = currScore - prevScore;
    if (increase > 0) {
      print(
        `your score has increased ${increase} points for a total of ${currScore}!`
      );
    } else {
      print(`score has not increased :(`);
    }
    print(`processed and returned ${numReturned} planets to player`);
  };

   /* similar to gift empire */
   const transferPlanets = async (planets: Planet[]) => {
    print(`transferring ${planets.length} planets to the dao...`);
    let numTransferred = 0;

    try {
      let results = await Promise.all(
        planets.map((p) => {
          const actionId = getRandomActionId();
          // @ts-expect-error
          return df.contractsAPI.transferOwnership(
            p.locationId,
            colossus.address,
            actionId
          );
        })
      );
      numTransferred = results.length;
      print(`transferOwnership txs are mined!`);
    } catch (error) {
      console.log(`error mining transfer calls`, error);
      // setError(`error mining transfer calls: ${JSON.stringify(error)}`)
    }

    print(`transferred ${numTransferred} planets to dao`);
  };
  

  const returnSelected = async () => {
    // @ts-expect-error
    const planet = await df.getPlanetWithId(selectedPlanet);
    if (planet.planetType == PlanetType.RUINS) {
      await processAndReturnPlanets([planet], []);
    } else if (planet.planetType == PlanetType.TRADING_POST) {
      await processAndReturnPlanets([planet], []);
    }
  };


  const makeFindArtifactArgs = async (planets: Planet[]) => {
    let findArgsList = [];
    for (let p of planets) {
      //@ts-expect-error
      const findArgs = await df.snarkHelper.getFindArtifactArgs(
      //@ts-expect-error
        p.location.coords.x,
      //@ts-expect-error
        p.location.coords.y
      );
      console.log("findArgs", findArgs);
      findArgsList.push(findArgs);
    }

    return findArgsList;
  };

  const handleFind = async (p: Planet) => {
    // await transferPlanets([p]);
    // await handleFind(p);
    const findArgs = await makeFindArtifactArgs([p]);
    console.log(`findArgs`, findArgs);
    // process and return the planet
    await processAndReturnPlanets([], findArgs);
    // @ts-expect-error
    await df.hardRefreshPlanet(p.locationId);
  };

  const updatePlanetOwners = async (planets: Planet[]) => {
    // ownedPlanets is a sanity check to avoid registering a planet no owned by player
    // @ts-expect-error
    const ownedPlanets = planets.filter((p)=> p.owner == df.getAccount())
    const locationIds = ownedPlanets.map((p) =>
      ethers.BigNumber.from(`0x${p.locationId}`)
    );

    console.log(`locIDs`, locationIds);
    if (locationIds.length == 0) {
      print(`no owned planets to register with dao`);
      return;
    }
    
    try {
      console.log(`gasPrice`, gasPrice, typeof(gasPrice));
      const updateTx = await colossus.updatePlanetOwners(locationIds, { gasPrice });
      console.log(`updateTx`, updateTx);
      const updateTxResponse = await updateTx.wait();
      console.log(`minedUpdate`, updateTxResponse);
    } catch (error) {
      // setError(JSON.stringify(error))
      console.log(`error updating owners`, error);
    }

    print(`registered ${locationIds.length} planets with dao`);
  };

  /* only call this if you dao owns planet and is registered with dao and has been prospected */
  const readyToFind = async () => {
    // @ts-expect-error
    const planet = await df.getPlanetWithId(selectedPlanet);
    await handleFind(planet);
    // await updatePlanetOwners([planet]);
  }
  const registerOwnership = async () => {
    // @ts-expect-error
    const planet = df.getPlanetWithId(selectedPlanet);
    const pName = getPlanetName(planet.locationId);
    print(`registering ${pName}`);
    await updatePlanetOwners([planet]);
  }

  return {
    transferPlanets,
    processAndReturnPlanets,
    updatePlanetOwners,
    returnSelected,
    checkDaoOwnership,
    readyToFind,
    handleFind,
    registerOwnership,
    getRandomActionId,
    getProspectablePlanets,
    isFindable,
    confirmedDaoOwners,
    confirmedPlayerOwners,
    confirmedRegisteredPlanets,
  }
}
