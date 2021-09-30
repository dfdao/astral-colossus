# Goal:

Interface for users to gift rips and foundries to the dao:

```javascript
  // for rips
  await playerCore.refreshPlanet(planet.id)
  let planetDetails = await playerCore.planets(planet.id);
  let silver = planetDetails.silver.toNumber()
  console.log('planet silver: ', silver);

  await daoPlayer.updatePlanetOwners([planet.id]);
  await playerCore.transferOwnership(planet.id, daoPlayer.address);
  await daoPlayer.processAndReturnPlanets([planet.id],[]);

  // for foundries
  await playerCore.prospectPlanet(ARTIFACT_PLANET_1.id);
  await daoPlayer.updatePlanetOwners([planet.id]);
  await playerCore.transferOwnership(planet.id, daoPlayer.address);
  // will come from df.snarkHelper.getFindArtifactArgs(x,y);
  const findArgs = makeFindArtifactArgs(planet);
  // @ts-expect-error
  await daoPlayer.processAndReturnPlanets([],[findArgs]);
```

