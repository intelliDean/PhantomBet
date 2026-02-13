
import { toFunctionSelector } from 'viem';
import { KernelFactoryAbi } from '/mnt/data/Projects/Solidity/PhantomBet/frontend/node_modules/@zerodev/sdk/_cjs/accounts/kernel/abi/KernelFactoryAbi.js';

console.log("Checking KernelFactoryAbi selectors...");
KernelFactoryAbi.forEach(item => {
    if (item.type === 'function') {
        const selector = toFunctionSelector(item);
        console.log(`${item.name} -> ${selector}`);
        if (selector.startsWith('0xc5265d5d')) {
            console.log(`MATCH FOUND: ${item.name}`);
        }
    }
});
