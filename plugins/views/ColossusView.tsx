import { h, JSX } from "preact";
import { useEffect, useState, useLayoutEffect, useReducer, useCallback } from "preact/hooks";
import { LocatablePlanet, LocationId, Planet, PlanetType } from "@darkforest_eth/types";
import { ethers, Transaction, ContractTransaction, ContractReceipt  } from 'ethers';
import { useWallet } from "../lib/flashbots";
import { getPlanetName, useSelectedPlanet, useCoreContract } from "../lib/darkforest";
import DAO_ABI from "../abis/DaoAbi.json";
import { DaoContractPlayer } from '../types';

export function ColossusView(): JSX.Element {
  const url = 'http://165.227.93.253:8545';
  const provider = new ethers.providers.JsonRpcProvider(url);
  console.log('provider', provider);

  // @ts-expect-error
  const wallet = new ethers.Wallet(df.getPrivateKey(), provider);
  console.log('wallet', wallet);

  const coreContract = useCoreContract();

  const selectedPlanet = useSelectedPlanet();

  const deployedAddy = '0xc71F6a0d1cB0949804d3cd8700CF9F4CAD2490EB'

  const daoPlayer = new ethers.Contract(deployedAddy, DAO_ABI, wallet) as DaoContractPlayer;

  console.log('daoPlayer', daoPlayer);

  const getRandomActionId = () => {
    const hex = '0123456789abcdef';
  
    let ret = '';
    for (let i = 0; i < 10; i += 1) {
      ret += hex[Math.floor(hex.length * Math.random())];
    }
    return ret;
  };

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

  const checkDaoOwnership = async () => {
    // dao recognizes player as owner
    const pName = getPlanetName(selectedPlanet);
    const pBigNumber = ethers.BigNumber.from(`0x${selectedPlanet}`);
    // const updateTx = await daoPlayer.updatePlanetOwners([pBigNumber]);
    // await updateTx.wait();
    // const result = daoPlayer.interface.decodeFunctionData("updatePlanetOwners", updateTx.data);
    const owner = await daoPlayer.planetOwners(pBigNumber);
    print(`dao says ${pName} is owned by ${owner}`);
    // console.log("tx result", result);
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
    let refreshTxArray: Array<ContractTransaction> = [];
    let numRefreshed = 0;
    for (let p of planets) {
      const id = ethers.BigNumber.from(`0x${p.locationId}`)
      const refreshTx = await coreContract.refreshPlanet(id);
      refreshTxArray.push(refreshTx);
    }

    try {
      let results = await Promise.all(refreshTxArray.map((tx) => {
        tx.wait();
      }));
      numRefreshed = results.length;
      print(`refresh Txs are mined!`);
      console.log(`refreshResults`, results);
    } catch (error) {
      console.log(`error mining refresh calls`, error);
    }

  }

  const updatePlanetOwners = async (planets: Planet[]) => {
    // dao recognizes player as owner
    const locationIds = planets.map((p) => ethers.BigNumber.from(`0x${p.locationId}`));
    try {
      const updateTx = await daoPlayer.updatePlanetOwners(locationIds);
      console.log(`updateTx`, updateTx);
      const updateTxResponse = await updateTx.wait();
      console.log(`minedUpdate`, updateTxResponse);
    } catch (error) {
      console.log(`error updating owners`, error);
    }

    print(`registered ${locationIds.length} planets with dao`);
  }
  
  /* similar to gift empire */
  const transferPlanets = async (planets: Planet[]) => {
    print(`transferring ${planets.length} planets to the dao...`)
    const numPlanets = planets.length;
    let numTransferred = 0;

    // let transferTxArray = [];
    // for(let p of planets) {
    //   const id = ethers.BigNumber.from(`0x${p.locationId}`);
    //   const pName = getPlanetName(p.locationId);
    //   try {
    //     const transferTx = await coreContract.transferOwnership(id, daoPlayer.address);
    //     print(`sent transfer ${pName} tx`);
    //     transferTxArray.push(transferTx);
    //   } catch (error) { 
    //     console.log(`couldn't send transferTx`, error);
    //   }
    // }

    // try {
    //   let results = await Promise.all(transferTxArray.map((transferTx) => {
    //     return transferTx.wait();
    //   }));
    //   numTransferred = results.length;
    //   print(`transferOwnership mined ${numTransferred} txs are mined!`);
    // } catch (error) {
    //   console.log(`error mining transfer calls`, error);
    // }

    try {
      let results = await Promise.all(planets.map((p) => {
        const actionId = getRandomActionId();
        // @ts-expect-error
        return df.contractsAPI.transferOwnership(p.locationId, daoPlayer.address, actionId);
      }));
      numTransferred = results.length;
      print(`transferOwnership txs are mined!`);
    } catch (error) {
      console.log(`error mining transfer calls`, error);
    }

    await bulkUiRefresh(planets);
    print(`transferred ${numTransferred} planets to dao`);
  }

  // TODO: import findMoveArgs type
  const processAndReturnPlanets = async (rips: Planet[], findArgsList: any[]) => {
    const prevScore = (await daoPlayer.contributions(wallet.address)).toNumber();
    let currScore = prevScore;

    print(`received ${rips.length} rips and ${findArgsList.length} foundries for processing`);
    const gasLimit1Planet = 200000;
    const locationIds = rips.map((p) => ethers.BigNumber.from(`0x${p.locationId}`));

    const gasLimit = gasLimit1Planet * (rips.length + 1) * (findArgsList.length + 1);

    let numReturned = 0;
    try {
      const processTx  = await daoPlayer.processAndReturnPlanets(locationIds, findArgsList, {gasLimit: 200000 * rips.length});
      console.log(`processTx`, processTx);
      console.log(`gasLimit: ${processTx.gasLimit.toString()}, gasPrice: ${processTx.gasPrice.toString()}`)
      await processTx.wait();
      numReturned += rips.length + findArgsList.length;
      currScore = (await daoPlayer.contributions(wallet.address)).toNumber()

    } catch (error) {
      console.log(`error processing and returning`, error);
    }
    const increase = currScore - prevScore;
    if(increase > 0) {
      print(`your score has increased ${increase} points for a total of ${currScore}!`);

    }
    else {
      print(`score has not increased :(`);
    }
    print(`processed and returned ${numReturned} planets to player`);
  }

  const confirmedRegisteredPlanets = async (planets: Planet[]) => {
    let confirmedPlanets: Array<Planet>= [];
    for(let p of planets) {
      const pName = getPlanetName(p.locationId);
      const id = ethers.BigNumber.from(`0x${p.locationId}`)
      const registrar = await daoPlayer.planetOwners(id);
      if (registrar == wallet.address) {
        confirmedPlanets.push(p);
        print(`dao recognizes ${pName} is owned by player`);
      }
      else {
        print(`dao DOESNT recognize ${pName} is owned by player`);
      }
    }
    return confirmedPlanets;
  }
  const confirmedDaoOwners = async(planets: Planet[]) => {
    // await bulkPlanetRefresh(planets);
    let confirmedPlanets = [];
    for(let p of planets) {
      console.log(`confirmed check`, p);
      const pName = getPlanetName(p.locationId);
      const id = ethers.BigNumber.from(`0x${p.locationId}`)
      const planet = await coreContract.planets(id);
      if (planet.owner == daoPlayer.address) {
        confirmedPlanets.push(p);
        print(`${pName} is owned by dao`);
      }
      else {
        print(`${pName} is not owned by dao`);
      }
    }
    return confirmedPlanets;
    
  }
  const confirmedPlayerOwners = async(planets: Planet[]) => {
    // await bulkPlanetRefresh(planets);
    let confirmedPlanets = [];
    for(let p of planets) {
      console.log(`confirmed check`, p);
      const pName = getPlanetName(p.locationId);
      const id = ethers.BigNumber.from(`0x${p.locationId}`)
      const planet = await coreContract.planets(id);
      if (planet.owner == wallet.address) {
        confirmedPlanets.push(p);
        print(`${pName} is owned by player`);
      }
      else {
        print(`${pName} is not owned by player`);
      }
    }
    return confirmedPlanets;
    
  }

  const handleRips = async(rips: Planet[]) => {
    /* TODO: filter this more */
    let planetsToGift = rips
    planetsToGift = rips.filter((p) => p.silver > 100);

    /* TODO remove -> this for testing purposes*/ 
    planetsToGift = planetsToGift.slice(0,5);
    print(`found ${planetsToGift.length} rips to gift`);
    if (!planetsToGift.length) {
      print(`terminating...`)
      return;
    }
    await bulkUiRefresh(planetsToGift);

    // will call refreshPlanet in contract
    print('updating owners... (block needs to be mined)');
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
  }

  const handleFoundries = async (foundries: Planet[]) => {
    let planetsToGift = await getProspectablePlanets(foundries);
    /* TODO remove -> this for testing purposes*/ 
    planetsToGift = planetsToGift.slice(0,2);
    print(`found ${planetsToGift.length} foundries to gift`);
    if (!planetsToGift.length) {
      print(`terminating...`)
      return;
    }
    
    // will call refreshPlanet in contract
    await updatePlanetOwners(planetsToGift);
    const confirmedRegistered = await confirmedRegisteredPlanets(planetsToGift);
    print(`registered ${confirmedRegistered.length} owners`);
    print(`transferring ${confirmedRegistered.length} planets to dao`);

    for(let p of planetsToGift) {
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
        const actionId = getRandomActionId();
        // @ts-expect-error
        const prospectReceipt = (await df.contractsAPI.prospectPlanet(p.locationId, actionId)) as ContractReceipt;        
        print(`prospected block number ${prospectReceipt.blockNumber}`);
        print(`prospected succeeded: ${prospectReceipt.status}`);
        prospectStatus = prospectTxReceipt.status;
        await bulkUiRefresh(planetsToGift);
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
          const confirmedOwned = await confirmedDaoOwners(confirmedRegistered);
          print(`transferred ${confirmedOwned.length} planets to dao`);
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
    }

  }
  const giftPlanets = async (planets: Planet[]) => {

    print(`examinining ${planets.length} planets`);

    const rips = planets.filter((p) => p.planetType == PlanetType.TRADING_POST);
    const foundries = planets.filter((p) => p.planetType == PlanetType.RUINS);

    print(`gifting planets`);
    // await returnPlanets(planets);
    await handleRips(planets);
    await handleFoundries(foundries);
    print(`finished gifting...`);
    // await handleRips(rips);

  }

  const returnSelected = async () => {
    // @ts-expect-error
    const planet = await df.getPlanetWithId(selectedPlanet)
    // await updatePlanetOwners([planet]);
    await processAndReturnPlanets([planet], []);
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
          <button onClick={returnSelected}>Return Selected</button>
          <button onClick={checkDaoOwnership}>checkDaoOwnership</button>
        </div>
      </div>
    );
  return content;
}
