
import { keccak256, toBytes } from 'viem';

const sig = "OwnableUnauthorizedAccount(address)";
const selector = keccak256(toBytes(sig)).slice(0, 10);
console.log(`${sig} -> ${selector}`);
