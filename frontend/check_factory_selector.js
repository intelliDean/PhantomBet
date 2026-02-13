
import { toFunctionSelector } from 'viem';

// Candidates for factory functions
const candidates = [
    "createAccount(address,bytes,uint256)",
    "createAccount(bytes,bytes32)",
    "deployAccount(address,bytes,uint256)",
    "getAccountAddress(bytes,uint256)",
    "createAccount(address,bytes,bytes32)"
];

import { keccak256, toBytes } from 'viem';

candidates.forEach(sig => {
    const selector = keccak256(toBytes(sig)).slice(0, 10);
    console.log(`${sig} -> ${selector}`);
});
