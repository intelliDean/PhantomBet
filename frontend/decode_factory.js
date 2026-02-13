
import { decodeFunctionData, parseAbi } from 'viem';

const factoryData = "0xc5265d5d000000000000000000000000aac5d4240af87249b3f71bc8e4a2cae074a3e4190000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002243c3b752b01845ADb2C711129d4f3966735eD98a9F09fC4cE570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000014f2e7e2f51d7c9eea9b0313c2eca12f8e43bd18550000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

const abi = parseAbi([
    'function createAccount(address _implementation, bytes _data, uint256 _index)'
]);

try {
    const decoded = decodeFunctionData({
        abi,
        data: factoryData
    });
    console.log("Decoded Factory Call:", decoded);

    // Check internal data (initialize check)
    // The second argument is `_data`, which is likely the `initialize` call.
    if (decoded.args && decoded.args[1]) {
        console.log("Init Data:", decoded.args[1]);
        // Let's decode initialize if possible
        const initSelector = decoded.args[1].slice(0, 10);
        console.log("Init Selector:", initSelector);

        if (initSelector === '0x3c3b752b') { // initialize(...)
            const initAbi = parseAbi([
                'function initialize(bytes21 _rootValidator, address hook, bytes validatorData, bytes hookData, bytes[] initConfig)'
            ]);
            const initDecoded = decodeFunctionData({
                abi: initAbi,
                data: decoded.args[1]
            });
            console.log("Decoded Initialize:", initDecoded);
            console.log("Root Validator:", initDecoded.args[0]);
        }
    }

} catch (e) {
    console.error(e);
}
