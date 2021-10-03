import { useContext } from "preact/hooks";
import { ContractContext } from "../components/ContractContext";
import { CoreContractContext } from "../components/CoreContractContext";

export const useContract = () => {
  const contract = useContext(ContractContext)!
  const coreContract = useContext(CoreContractContext)!

  return {
    ...contract,
    ...coreContract
  }
}
