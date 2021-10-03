import { Planet, PlanetType } from "@darkforest_eth/types";
import { ethers, ContractReceipt } from "ethers";
import { useState } from "preact/hooks";
import { useContract, usePlayer, useSelectedPlanet, useColossus, useGasPrice } from '.'
import { getPlanetName } from "../lib/darkforest";

export const useContribute = () => {
  const { colossus, coreContract } = useContract()
  const { 
    processAndReturnPlanets, 
    handleFind, 
    updatePlanetOwners, 
    transferPlanets,
    getRandomActionId,
    getProspectablePlanets,
    isFindable,
    confirmedDaoOwners,
    confirmedPlayerOwners,
    confirmedRegisteredPlanets
  } = useColossus()
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
    await bulkUiRefresh(confirmedRegistered);
    const confirmedOwned = await confirmedDaoOwners(confirmedRegistered);
    print(`transferred ${confirmedOwned.length} planets to dao`);
    print(`processing and returning ${confirmedOwned.length} planets...`);
    await processAndReturnPlanets(confirmedOwned, []);
    const returned = confirmedPlayerOwners(confirmedOwned);
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
          await bulkUiRefresh([p]);
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
