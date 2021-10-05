import { BigInt } from "@graphprotocol/graph-ts"
import {
  AstralColossus,
  Contribution
} from "../generated/AstralColossus/AstralColossus"
import { Contributor, PointContribution } from "../generated/schema"

export function handleContribution(event: Contribution): void {
  
  let player = Contributor.load(event.params.player.toHexString())
  if (!player) {
    player = new Contributor(event.params.player.toHexString())
    player.points = event.params.points
    player.numContributions = BigInt.fromI32(1)
  }
  else{
    player.points = player.points.plus(event.params.points)
    player.numContributions = player.numContributions.plus(BigInt.fromI32(1))
  }
  let contribution = new PointContribution(event.params.player.toHexString() + '# ' + player.numContributions.toString())

  contribution.player = player.id
  contribution.points = event.params.points
  contribution.timestamp = event.block.timestamp
  contribution.save()
  player.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.ARTIFACT_POINT_VALUES(...)
  // - contract.contributions(...)
  // - contract.coreContract(...)
  // - contract.initializePlayer(...)
  // - contract.owner(...)
  // - contract.planetOwners(...)
  // - contract.playerCounter(...)
  // - contract.players(...)
  // - contract.tokensContract(...)
}
