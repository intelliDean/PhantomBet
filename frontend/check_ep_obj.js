
import { getEntryPoint } from "@zerodev/sdk/constants";

const ep = getEntryPoint("0.7");
console.log("EntryPoint Object:", ep);
console.log("EntryPoint Address:", ep.address);
console.log("EntryPoint Version:", ep.version);
