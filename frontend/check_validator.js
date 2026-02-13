
import { createPublicClient, http } from 'viem';
import { monadTestnet } from './src/chains.ts';

const client = createPublicClient({
    chain: monadTestnet,
    transport: http('https://testnet-rpc.monad.xyz/')
});

const validatorAddress = '0x845ADb2C711129d4f3966735eD98a9F09fC4cE57';

async function check() {
    console.log(`Checking Validator ${validatorAddress}...`);
    try {
        const code = await client.getBytecode({ address: validatorAddress });
        if (code && code.length > 2) {
            console.log('Validator IS deployed.');
        } else {
            console.log('Validator is NOT deployed.');
        }
    } catch (e) {
        console.error('Error reading validator:', e.message);
    }
}

check();
