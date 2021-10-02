import { version, homepage, bugs } from "../../package.json";
import { COLOSSUS_ADDRESS } from "../generated/contract";

export const POLL_INTERVAL = 5000;
export const WEBSITE_URL = homepage;
export const TWITTER_URL = "https://twitter.com/d_fdao";
export const GITHUB_URL = "https://github.com/dfdao/charity";
export const CONTRACT_URL = `https://blockscout.com/xdai/mainnet/address/${COLOSSUS_ADDRESS}`;
export const BUGS_URL = bugs.url;
export const VERSION = version;
