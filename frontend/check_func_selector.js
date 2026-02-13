
import { toFunctionSelector } from 'viem';

const signatures = [
    "execute(bytes32,bytes)",
    "executeUserOp(tuple,bytes32)",
    "validateUserOp(tuple,bytes32,uint256)",
    "initialize(bytes21,address,bytes,bytes,bytes[])",
    "upgradeTo(address)",
    "installModule(uint256,address,bytes)",
    "uninstallModule(uint256,address,bytes)"
];

signatures.forEach(sig => {
    // Manually compute since we had import issues before, or try viem again if fixed
    // actually, let's just use keccak256 again to be safe
});

import { keccak256, toBytes } from 'viem';

signatures.forEach(sig => {
    const selector = keccak256(toBytes(sig)).slice(0, 10);
    console.log(`${sig} -> ${selector}`);
});
