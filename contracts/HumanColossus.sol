// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;
pragma experimental ABIEncoderV2;

interface IDarkForestCore {
    enum PlanetType {PLANET, SILVER_MINE, RUINS, TRADING_POST, SILVER_BANK}

    struct Planet {
        address owner;
        uint256 range;
        uint256 speed;
        
        uint256 defense;
        uint256 population;
        uint256 populationCap;
        uint256 populationGrowth;
        uint256 silverCap;
        uint256 silverGrowth;
        uint256 silver;
        uint256 planetLevel;
        PlanetType planetType;
        bool isHomePlanet;
    }

    function planets(uint256 key) external view returns (Planet memory);
    
    function refreshPlanet(uint256 location) external;
    
    function initializePlayer(
        uint256[2] memory _a,
        uint256[2][2] memory _b,
        uint256[2] memory _c,
        uint256[8] memory _input
    ) external returns (uint256);
    
    function findArtifact(
        uint256[2] memory _a,
        uint256[2][2] memory _b,
        uint256[2] memory _c,
        uint256[7] memory _input
    ) external;

    function planetArtifacts(uint256 key) external view returns (uint256[] memory);
    
    function transferOwnership(uint256 _location, address _player) external;
    
    function withdrawSilver(uint256 locationId, uint256 amount) external;
}

interface IDarkForestTokens {
  enum ArtifactRarity {Unknown, Common, Rare, Epic, Legendary, Mythic}
  enum Biome {
      Unknown,
      Ocean,
      Forest,
      Grassland,
      Tundra,
      Swamp,
      Desert,
      Ice,
      Wasteland,
      Lava,
      Corrupted
  }
  enum ArtifactType {
      Unknown,
      Monolith,
      Colossus,
      Spaceship,
      Pyramid,
      Wormhole,
      PlanetaryShield,
      PhotoidCannon,
      BloomFilter,
      BlackDomain
  }
  struct Artifact {
      bool isInitialized;
      uint256 id;
      uint256 planetDiscoveredOn;
      ArtifactRarity rarity;
      Biome planetBiome;
      uint256 mintedAtTimestamp;
      address discoverer;
      ArtifactType artifactType;
      uint256 lastActivated;
      uint256 lastDeactivated;
      uint256 wormholeTo;
  }
  function getArtifact(uint256 tokenId) external view returns (Artifact memory);
}


contract HumanColossus {
    event Contribution(address indexed player, uint256 indexed points);

    struct FoundryData {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[7] input;
    }
    
    uint256 public playerCounter;

    mapping(uint256 => address) public players;

    bytes32 constant artifactOwnerRevertReason = keccak256(bytes("you can only find artifacts on planets you own"));
    
    address public owner;
    IDarkForestCore immutable public coreContract;
    IDarkForestTokens immutable public tokensContract;
    
    mapping(uint256 => address) public planetOwners;

    mapping(address => uint256) public contributions;

    uint256[] public ARTIFACT_POINT_VALUES = [0, 2000, 10000, 200000, 3000000, 20000000];

    modifier onlyOwner() {
        require(msg.sender == owner, "caller not owner");
        _;
    }
    
    constructor(address _owner, IDarkForestCore _coreContract, IDarkForestTokens _tokensContract) {
        owner = _owner;
        coreContract = _coreContract;
        tokensContract = _tokensContract;
    }
    
    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }
    
    function initializePlayer(
        uint256[2] memory _a,
        uint256[2][2] memory _b,
        uint256[2] memory _c,
        uint256[8] memory _input
    ) external onlyOwner returns (uint256) {
        return coreContract.initializePlayer(_a, _b, _c, _input);
    }
    
    function getRefreshedPlanet(uint256 _planetId) internal returns (IDarkForestCore.Planet memory) {
        coreContract.refreshPlanet(_planetId);
        return coreContract.planets(_planetId);
    }
    
    function updatePlanetOwners(uint256[] calldata _planetIds) external {
        for (uint256 i = 0; i < _planetIds.length; i++) {
            uint256 planetId = _planetIds[i];
            planetOwners[planetId] = getRefreshedPlanet(planetId).owner;
        }
    }
    
    function returnPlanet(uint256 _planetId) internal {
        address planetOwner = planetOwners[_planetId];
        /* backup if register ownership didn't happen */
        if (planetOwner == address(0)) planetOwner = msg.sender;
        coreContract.transferOwnership(_planetId, planetOwner);
    }
    
    function processAndReturnPlanets(
        uint256[] calldata _spacetimeRipIds,
        FoundryData[] calldata _foundriesData
    ) external {
        uint256 currContribution;
        for (uint256 i = 0; i < _spacetimeRipIds.length; i++) {
            uint256 planetId = _spacetimeRipIds[i];
            IDarkForestCore.Planet memory planet = getRefreshedPlanet(planetId);
            if (planet.owner != address(this)) continue;
            if (planet.silver > 100) {
                // add new players to the mapping
                if(contributions[msg.sender] == 0) {
                  players[playerCounter] = msg.sender;
                  playerCounter++;
                }
                coreContract.withdrawSilver(planetId, planet.silver);
                contributions[msg.sender] += planet.silver;

                currContribution += planet.silver;
            }
            returnPlanet(planetId);
        }
        
        for (uint256 i = 0; i < _foundriesData.length; i++) {
            FoundryData calldata foundryData = _foundriesData[i];
            try coreContract.findArtifact(foundryData.a, foundryData.b, foundryData.c, foundryData.input) {
              // add new players to the mapping
              if(contributions[msg.sender] == 0) {
                players[playerCounter] = msg.sender;
                playerCounter++;
              }
              // most recent artifact will be at the end of the array
              uint256 planetId = foundryData.input[0];
              uint256[] memory artifacts = coreContract.planetArtifacts(planetId);
              uint256 foundArtifactId = artifacts[artifacts.length - 1];
              IDarkForestTokens.Artifact memory foundArtifact = tokensContract.getArtifact(foundArtifactId);
              contributions[msg.sender] += ARTIFACT_POINT_VALUES[uint256(foundArtifact.rarity)];
              currContribution += ARTIFACT_POINT_VALUES[uint256(foundArtifact.rarity)];
            }
            catch (bytes memory reason) {
                /* return the planet in all cases except if when player doesn't own artifact */
                if (keccak256(reason) == artifactOwnerRevertReason) continue;
            }
            returnPlanet(foundryData.input[0]);
        }
        emit Contribution(msg.sender, currContribution);


    }
    receive() external payable {}
}