import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from "@zerodev/sdk";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { KERNEL_V3_1, getEntryPoint } from "@zerodev/sdk/constants";
import { http, createPublicClient, type Chain, type Hex } from "viem";
import { monadTestnet } from '../chains';

const MONAD_RPC = import.meta.env.VITE_MONAD_RPC || 'https://testnet-rpc.monad.xyz/';
const ZERODEV_PROJECT_ID = import.meta.env.VITE_ZERODEV_PROJECT_ID;
const BUNDLER_URL = `https://rpc.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}/chain/${monadTestnet.id}`;

interface AAContextType {
    smartAccountAddress: Hex | null;
    isAAInitialized: boolean;
    kernelClient: any | null;
}

const AAContext = createContext<AAContextType>({
    smartAccountAddress: null,
    isAAInitialized: false,
    kernelClient: null,
});

export const useAA = () => useContext(AAContext);

export const AAProvider = ({ children }: { children: ReactNode }) => {
    const { authenticated } = usePrivy();
    const { wallets } = useWallets();
    const [smartAccountAddress, setSmartAccountAddress] = useState<Hex | null>(null);
    const [kernelClient, setKernelClient] = useState<any | null>(null);
    const [isAAInitialized, setIsAAInitialized] = useState(false);

    const publicClient = useMemo(() => createPublicClient({
        chain: monadTestnet as Chain,
        transport: http(MONAD_RPC)
    }), []);

    useEffect(() => {
        const initAA = async () => {
            if (!authenticated || !wallets.length) {
                setSmartAccountAddress(null);
                setKernelClient(null);
                setIsAAInitialized(false);
                return;
            }

            try {
                const privyWallet = wallets[0];
                await privyWallet.switchChain(monadTestnet.id);
                const provider = await privyWallet.getEthereumProvider();

                // 1. Create ECDSA Validator (Standard Owner Validator)
                const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
                    signer: provider as any,
                    entryPoint: getEntryPoint("0.7"),
                    kernelVersion: KERNEL_V3_1,
                });

                // 2. Create Kernel Account
                const account = await createKernelAccount(publicClient, {
                    plugins: {
                        sudo: ecdsaValidator,
                    },
                    entryPoint: getEntryPoint("0.7"),
                    kernelVersion: KERNEL_V3_1,
                    index: BigInt(Date.now()), // Force new account to avoid stuck state
                });

                // 4. Create Kernel Client
                const paymasterClient = createZeroDevPaymasterClient({
                    chain: monadTestnet as Chain,
                    transport: http(BUNDLER_URL),
                });

                const client = createKernelAccountClient({
                    account,
                    chain: monadTestnet as Chain,
                    bundlerTransport: http(BUNDLER_URL),
                    paymaster: paymasterClient,
                    userOperation: {
                        estimateFeesPerGas: async ({ bundlerClient }) => {
                            try {
                                return await bundlerClient.getUserOperationGasPrice();
                            } catch (error) {
                                console.warn("Bundler gas price failed, falling back to public client:", error);
                                const gasFees = await publicClient.estimateFeesPerGas();
                                return {
                                    maxFeePerGas: gasFees.maxFeePerGas || 0n,
                                    maxPriorityFeePerGas: gasFees.maxPriorityFeePerGas || 0n,
                                };
                            }
                        }
                    }
                });
                // Note: The above is a fallback if "SPONSOR" doesn't work directly with the types. 
                // Let's try the cleaner "SPONSOR" first as per docs, but wait, 
                // types might receive "SPONSOR" as a valid value? 
                // ZeroDev docs say `paymaster: "SPONSOR"`.

                setSmartAccountAddress(account.address);
                setKernelClient(client);
                setIsAAInitialized(true);
                console.log("AA Wallet Initialized:", account.address);
            } catch (error) {
                console.error("Failed to initialize AA:", error);
            }
        };

        initAA();
    }, [authenticated, wallets, publicClient]);

    return (
        <AAContext.Provider value={{ smartAccountAddress, isAAInitialized, kernelClient }}>
            {children}
        </AAContext.Provider>
    );
};


