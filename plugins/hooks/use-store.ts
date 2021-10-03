import { useContext } from "preact/hooks";
import { StoreContext } from "../components/StoreContext";

export const useStore = () => {
  return useContext(StoreContext)!
}
