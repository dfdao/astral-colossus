import { Planet, PlanetType } from "@darkforest_eth/types";
import { ethers, ContractReceipt } from "ethers";
import { useState } from "preact/hooks";
import { useContract, usePlayer, useSelectedPlanet, useColossus, useGasPrice } from '.'
import { getPlanetName } from "../lib/darkforest";

export const useContribute = () => {
  const { colossus, coreContract } = useContract()
  const { processAndReturnPlanets, handleFind, updatePlanetOwners } = useColossus()
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const player = usePlayer()
  const selectedPlanet = useSelectedPlanet();

  const print = (msg: string) => {
    // @ts-expect-error
    df.terminal.current.println(msg);
    setStatus(msg)
  };

  const bulkUiRefresh = async (planets: Planet[]) => {
    const locationIds = planets.map((p) => p.locationId);
    // @ts-expect-error
    await df.bulkHardRefreshPlanets(locationIds);
  };

  const getRandomActionId = () => {
    const hex = "0123456789abcdef";

    let ret = "";
    for (let i = 0; i < 10; i += 1) {
      ret += hex[Math.floor(hex.length * Math.random())];
    }
    return ret;
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
      setError(`error mining transfer calls: ${JSON.stringify(error)}`)
    }

    await bulkUiRefresh(planets);
    print(`transferred ${numTransferred} planets to dao`);
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

  const handleRips = async (rips: Planet[]) => {
    /* TODO: filter this more */
    let planetsToGift = rips;
    planetsToGift = rips.filter((p) => p.silver > 100);

    /* TODO remove -> this for testing purposes*/
    planetsToGift = planetsToGift.slice(0, 5);
    print(`found ${planetsToGift.length} rips to gift`);
    if (!planetsToGift.length) {
      print(`no rips, moving on...`);
      return;
    }
    await bulkUiRefresh(planetsToGift);

    // will call refreshPlanet in contract
    print("updating owners... (block needs to be mined)");
    await updatePlanetOwners(planetsToGift);
    const confirmedRegistered = await confirmedRegisteredPlanets(planetsToGift);
    print(`registered ${confirmedRegistered.length} owners`);
    print(`transferring ${confirmedRegistered.length} planets to dao`);
    await transferPlanets(confirmedRegistered);
    const confirmedOwned = await confirmedDaoOwners(confirmedRegistered);
    print(`transferred ${confirmedOwned.length} planets to dao`);
    print(`processing and returning ${confirmedOwned.length} planets...`);
    await processAndReturnPlanets(confirmedOwned, []);
    const returned = confirmedPlayerOwners(confirmedOwned);
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

  const handleFoundries = async (foundries: Planet[]) => {
    let planetsToGift = await getProspectablePlanets(foundries);
    /* TODO remove -> this for testing purposes*/
    planetsToGift = planetsToGift.slice(0, 2);
    print(`found ${planetsToGift.length} foundries to gift`);
    if (!planetsToGift.length) {
      print(`no foundries, moving on...`);
      return;
    }

    // will call refreshPlanet in contract
    await updatePlanetOwners(planetsToGift);
    const confirmedRegistered = await confirmedRegisteredPlanets(planetsToGift);
    print(`registered ${confirmedRegistered.length} owners`);
    print(`transferring ${confirmedRegistered.length} planets to dao`);

    for (let p of planetsToGift) {
      const pBigNumber = ethers.BigNumber.from(`0x${p.locationId}`);

      const pName = getPlanetName(p.locationId);

      // also slow af. waits for each prospect to be mined
      let prospectStatus: number = 0;
      let planetDetails = await coreContract.getRefreshedPlanet(
        pBigNumber,
        Date.now()
      );
      console.log("details before prospect", planetDetails);
      try {
        print(`attempting to prospect ${pName}`);
        const actionId = getRandomActionId();
        // @ts-expect-error
        const prospectReceipt = (await df.contractsAPI.prospectPlanet(
          p.locationId,
          actionId
        )) as ContractReceipt;
        print(`prospected block number ${prospectReceipt.blockNumber}`);
        print(`prospected succeeded: ${prospectReceipt.status}`);
        prospectStatus = prospectReceipt.status || 0;
        // @ts-expect-error
        await df.hardRefreshPlanet(p.locationId);
      } catch (error) {
        console.log(error);
        print(`prospecting ${pName} failed. Trying next planet`);
        setError(JSON.stringify(error))
        continue;
      }

      // sanity check but should only get here if prospect succeeds
      if (prospectStatus) {
        await coreContract.refreshPlanet(pBigNumber);
        let planetDetails = await coreContract.getRefreshedPlanet(
          pBigNumber,
          Date.now()
        );
        console.log("prospect details", planetDetails);

        if (isFindable(planetDetails, Date.now())) {
          print(`${pName} is findable. transferring...`);
          // transfer ownership
          // await handleFind(p, confirmedRegistered);
          await transferPlanets([p]);
          const confirmedOwned = await confirmedDaoOwners(confirmedRegistered);
          print(`transferred ${confirmedOwned.length} planets to dao`);
          await handleFind(p);
        } else {
          print(
            `planet is not findable. Stopping here so you don't gift the planet.`
          );
          continue;
        }
      }
    }
  };

  const giftPlanets = async (planets: Planet[]) => {
    print(`examinining ${planets.length} planets`);

    const rips = planets.filter((p) => p.planetType == PlanetType.TRADING_POST);
    const foundries = planets.filter((p) => p.planetType == PlanetType.RUINS);

    print(`gifting planets`);
    // await returnPlanets(planets);
    await handleRips(rips);
    await handleFoundries(foundries);
    print(`finished gifting`);
    setLoading(false)
    setSuccess(true)
    // await handleRips(rips);
  };

  const contribute = async () => {
    setLoading(true)
    // @ts-expect-error
    const planet = await df.getPlanetWithId(selectedPlanet);
    console.log(`sending planet to gift: `, planet);

    // @ts-expect-error
    let planets = await df.getMyPlanets();

    // run on selected planet if exists
    if (planet) {
      planets = [planet];
    }
    // planets = [planet];
    // @ts-expect-error
    df.terminal.current.println(
      `sending ${planets.length} candidates to giftPlanets`
    );
    await giftPlanets(planets);
  };

  return {
    contribute,
    status,
    loading,
    error,
    success
  }
}
