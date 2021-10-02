import { h, JSX } from "preact";
import { useEffect, useState, useLayoutEffect, useReducer, useCallback } from "preact/hooks";
import { LocatablePlanet, LocationId, Planet, PlanetType } from "@darkforest_eth/types";
import * as ethers from 'ethers';
import { useWallet } from "../lib/flashbots";
import { getPlanetName, useSelectedPlanet, useCoreContract } from "../lib/darkforest";
import DAO_ABI from "../abis/DaoAbi.json";
import { DaoContractPlayer } from '../../typechain'

export function ColossusView(): JSX.Element {
  //const print ()
  // @ts-expect-erro
  // console.log('rendered here df ui', df, ui);
  const coreContract = useCoreContract();

  const selectedPlanet = useSelectedPlanet();
  const wallet = useWallet();

  
  const tempAddy = '0x9b25D251D785902e52ee79a328282217C02Bdc76'
  const deployedAddy = '0xc71F6a0d1cB0949804d3cd8700CF9F4CAD2490EB'

  const daoPlayer = new ethers.Contract(tempAddy, DAO_ABI, wallet) as DaoContractPlayer;
  
  // console.log(`connected to dao Player @ ${daoPlayer.address}`);

  const print = (msg: string) => {
    // @ts-expect-error
    df.terminal.current.println(msg);
  }

  const energy = (planet: Planet) => {
    return Math.floor(planet.energy / planet.energyCap * 100);
  }

  const isFoundry = (planet:Planet) => {
    return planet.planetType == PlanetType.RUINS;
  }

  const canHaveArtifact = (planet: Planet) => {
    return isFoundry(planet) && !planet.hasTriedFindingArtifact
  }
  
  const enoughEnergyToProspect = (planet:Planet) => {
    return energy(planet) >= 96;
  };

  const blocksLeftToProspectExpiration = (currentBlockNumber:number, prospectedBlockNumber:number) => {
    return (prospectedBlockNumber || 0) + 255 - currentBlockNumber;
  }
  const prospectExpired = (currentBlockNumber:number, prospectedBlockNumber:number) => {
    return blocksLeftToProspectExpiration(currentBlockNumber, prospectedBlockNumber) <= 0;
  }

  /* reads on-chain data to confirm */
  const isFindable = (planetDetails: any, currentBlockNumber: number) => {
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
  
  function isProspectable(planet) {
    return isFoundry(planet) && planet.prospectedBlockNumber === undefined && !planet.unconfirmedProspectPlanet;
  }

  const getProspectablePlanets = async (planets: Planet[]) => {
    let prospectablePlanets = planets
      .filter(canHaveArtifact)
      .filter(isProspectable)
      .filter(enoughEnergyToProspect);
    
    return prospectablePlanets;
  }


  const makeFindArtifactArgs = async (planets: Planet[]) => {
    let findArgsList = [];
    for(let p of planets) {
      const pName = getPlanetName(p.locationId);
      //@ts-expect-error
      const blockNumber = ui.getEthConnection().blockNumber
      //@ts-expect-error
      const findArgs = await df.snarkHelper.getFindArtifactArgs(p.location.coords.x, p.location.coords.y);
      console.log('findArgs', findArgs);
      findArgsList.push(findArgs);
    }

    return findArgsList;

  }

  const getContributions = async () => {
    console.log(`connected to dao Player @ ${daoPlayer.address}`);
    const balance = await wallet.provider.getBalance(daoPlayer.address)
    console.log('dao balance:', ethers.utils.formatEther(balance));
    const score = await daoPlayer.contributions(wallet.address);
    // @ts-expect-error
    df.terminal.current.println(`contributions[player]: ${score}`);
  };

  const contribute = async () => {

    // @ts-expect-error
    const planet = await df.getPlanetWithId(selectedPlanet)
    console.log(`sending planet to gift: `, planet);

    // @ts-expect-error
    let planets = await df.getMyPlanets();

    // run on selected planet if exists
    if(planet) {
      planets = [planet];
    }
    // planets = [planet];
    // @ts-expect-error
    df.terminal.current.println(`sending ${planets.length} candidates to giftPlanets`)
    await giftPlanets(planets);
  }

  const bulkUiRefresh = async (planets: Planet[]) => {
    const locationIds = planets.map((p) => p.locationId)
    // @ts-expect-error
    await df.bulkHardRefreshPlanets(locationIds);
  }
  
  // slow af but works. waits for each refresh to be mined.
  const bulkPlanetRefresh = async (planets: Planet[]) => {
    for (let p of planets) {
      // console.log('wallet tx count pre tx', await wallet.getTransactionCount());
      const id = ethers.BigNumber.from(`0x${p.locationId}`)
      const refreshTx = await coreContract.refreshPlanet(id);
      // console.log('tx nonce', refreshTx.nonce);
      // console.log('wallet tx count post tx', await wallet.getTransactionCount());
      await refreshTx.wait();
    }
  }


  const updatePlanetOwners = async (planets: Planet[]) => {
    // dao recognizes player as owner
    const locationIds = planets.map((p) => ethers.BigNumber.from(`0x${p.locationId}`));
    const updateTx = await daoPlayer.updatePlanetOwners(locationIds);
    await updateTx.wait();
    print(`registered ${locationIds.length} planets with dao`);
  }

  /* similar to gift empire */
  const transferPlanets = async (planets: Planet[]) => {
    print(`transferring ${planets.length} planets to the dao`)
    for (let p of planets) {
      const id = ethers.BigNumber.from(`0x${p.locationId}`)
      // transfer ownership
      await coreContract.transferOwnership(id, daoPlayer.address);
      const pName = getPlanetName(p.locationId);

      await coreContract.refreshPlanet(id);
      const planet = await coreContract.planets(id);
      console.log(`transferred planet details`, planet);
      print(`${pName}'s new owner ${planet.owner} is dao? ${tempAddy == planet.owner}`);
    }
    
    await bulkUiRefresh(planets);
    print(`transferred ${planets.length} planets to dao`);
  }

  const handleRips = async(rips: Planet[]) => {
    /* TODO: filter this more */
    let planetsToGift = rips.filter((p) => p.silver > 100);
    /* TODO remove -> this for testing purposes*/ 
    planetsToGift = planetsToGift.slice(0,2);
    print(`found ${planetsToGift.length} rips to gift`);
    if (!planetsToGift.length) {
      print(`terminating...`)
      return;
    }
    await bulkUiRefresh(planetsToGift);

    const prevScore = (await daoPlayer.contributions(wallet.address)).toNumber();

    // will call refreshPlanet in contract
    print('updating owners...');
    await updatePlanetOwners(planetsToGift);
    await transferPlanets(planetsToGift); 
    print('processing planets...');
    await processAndReturnPlanets(planetsToGift, []);

    const currScore = (await daoPlayer.contributions(wallet.address)).toNumber()
    const increase = currScore - prevScore;
    if(increase > 0) {
      print(`your score has increased ${increase} points for a total of ${currScore}!`);

    }
    else {
      print(`score has not increased :(`);
    }
  }

  const handleFoundries = async (foundries: Planet[]) => {
    let planetsToGift = await getProspectablePlanets(foundries);
    /* TODO remove -> this for testing purposes*/ 
    planetsToGift = planetsToGift.slice(0,2);
    print(`found ${planetsToGift.length} foudries to gift`);
    if (!planetsToGift.length) {
      print(`terminating...`)
      return;
    }
    await bulkUiRefresh(planetsToGift);

    // will call refreshPlanet in contract
    await updatePlanetOwners(planetsToGift);

    for(let p of planetsToGift) {
      const prevScore = (await daoPlayer.contributions(wallet.address)).toNumber();

      const pBigNumber = ethers.BigNumber.from(`0x${p.locationId}`)

      const pName = getPlanetName(p.locationId);
    
      // also slow af. waits for each prospect to be mined
      let prospectStatus: number = 0;
      let planetDetails = await coreContract.getRefreshedPlanet(pBigNumber, Date.now());
      console.log('details before prospect', planetDetails);
      try {
        print(`attempting to prospect ${pName}`);
        const prospectTx = await coreContract.prospectPlanet(pBigNumber);
        const prospectTxReceipt = await prospectTx.wait();
        print(`prospected block number ${prospectTxReceipt.blockNumber}`);
        print(`prospected succeeded: ${prospectTxReceipt.status}`);
        prospectStatus = prospectTxReceipt.status;
      } catch(error) {
        console.log(error); 
        print(`prospecting ${pName} failed. Trying next planet`)
        continue;
      }

      // sanity check but should only get here if prospect succeeds
      if(prospectStatus) {

        await coreContract.refreshPlanet(pBigNumber)
        let planetDetails = await coreContract.getRefreshedPlanet(pBigNumber, Date.now());
        console.log('prospect details', planetDetails);

        if (isFindable(planetDetails, Date.now())) {
          print(`${pName} is findable. transferring...`)
          // transfer ownership
          await transferPlanets([p]);
          // @ts-expect-error
          await df.hardRefreshPlanet(p.locationId);
          const findArgs = await makeFindArtifactArgs([p]);
          
          // process and return the planet
          const findTx = await daoPlayer.processAndReturnPlanets([], findArgs);
          const findTxReceipt = await findTx.wait()
          print(`found block number ${findTxReceipt.blockNumber}`);

          // @ts-expect-error
          await df.hardRefreshPlanet(p.locationId);
        }
        else {
          print(`planet is not findable. Stopping here so you don't gift the planet.`)
          continue;
        }
      }
      const currScore = (await daoPlayer.contributions(wallet.address)).toNumber()
      const increase = currScore - prevScore;
      if(increase > 0) {
        print(`your score has increased ${increase} points for a total of ${currScore}!`);
  
      }
      else {
        print(`score has not increased :(`);
      }
    }

  }
  // TODO: import findMoveArgs type
  const processAndReturnPlanets = async (rips: Planet[], findArgsList: any[]) => {
    const locationIds = rips.map((p) => ethers.BigNumber.from(`0x${p.locationId}`));
    const processTx  = await daoPlayer.processAndReturnPlanets(locationIds, findArgsList);
    await processTx.wait();
    print(`processed and returned ${locationIds.length} planets to player`);

  }
  const giftPlanets = async (planets: Planet[]) => {

    print(`examinining ${planets.length} planets`);

    const rips = planets.filter((p) => p.planetType == PlanetType.TRADING_POST);
    const foundries = planets.filter((p) => p.planetType == PlanetType.RUINS);

    await handleFoundries(foundries);
    await handleRips(rips);

  }
  
 
  let content;
    content = (
      <div>
        <div>
          <span>Colossus</span>
        </div>
        <div>
          <button onClick={getContributions}>check score</button>
          <button onClick={contribute}>contribute</button>
        </div>
      </div>
    );
  return content;
}
