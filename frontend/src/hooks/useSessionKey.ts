import { useState, useCallback } from 'react';
import { useAA } from '../components/AAProvider';
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
    createKernelAccount,
    createKernelAccountClient,
} from "@zerodev/sdk";
import {
    toPermissionValidator,
} from "@zerodev/permissions";
import { toCallPolicy, CallPolicyVersion } from "@zerodev/permissions/policies";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { KERNEL_V3_1, getEntryPoint } from "@zerodev/sdk/constants";
import { http, createPublicClient, type Chain, type Hex } from "viem";
import { monadTestnet } from '../chains';

const PREDICTION_MARKET_ADDRESS = "0xb716Ab97D06ea416849322D3d48ABa20a0Cd938b";
const ZERODEV_PROJECT_ID = import.meta.env.VITE_ZERODEV_PROJECT_ID;
const BUNDLER_URL = `https://rpc.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}/chain/${monadTestnet.id}`;

export const useSessionKey = () => {
    const { kernelClient, isAAInitialized } = useAA();
    const [sessionClient, setSessionClient] = useState<any | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const createSession = useCallback(async () => {
        if (!kernelClient || !isAAInitialized) return;

        setIsCreating(true);
        try {
            const publicClient = createPublicClient({
                chain: monadTestnet as Chain,
                transport: http()
            });

            // 1. Generate an ephemeral session key
            const sessionPrivateKey = generatePrivateKey();
            const sessionKeyAccount = privateKeyToAccount(sessionPrivateKey);

            // 1b. Create ECDSA Signer for the session key
            const sessionSigner = await toECDSASigner({
                signer: sessionKeyAccount,
            });

            // 2. Create Permission Validator
            // This authorizes the session key to call ONLY the prediction market
            const permissionValidator = await toPermissionValidator(publicClient, {
                signer: sessionSigner,
                entryPoint: getEntryPoint("0.7"),
                policies: [
                    await toCallPolicy({
                        policyVersion: CallPolicyVersion.V0_0_2, // Use modular policy version
                        permissions: [
                            {
                                target: PREDICTION_MARKET_ADDRESS as Hex,
                                // allow any value/function for now, or refine later
                            }
                        ]
                    }),
                ],
                kernelVersion: KERNEL_V3_1,
            });

            // 3. Create a specialized account that uses this permission
            const sessionAccount = await createKernelAccount(publicClient, {
                plugins: {
                    sudo: kernelClient.account.plugins.sudo, // Carry over sudo for management
                    regular: permissionValidator,
                },
                entryPoint: getEntryPoint("0.7"),
                kernelVersion: KERNEL_V3_1,
            });

            // 4. Create the client
            const paymasterClient = createZeroDevPaymasterClient({
                chain: monadTestnet as Chain,
                transport: http(BUNDLER_URL),
            });

            const client = createKernelAccountClient({
                account: sessionAccount,
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

            // 5. Serialize and store (optional, for persistence)
            // For now just keep in memory for simplicity in this demo

            setSessionClient(client as any);
            setIsActive(true);
            console.log("Session Key Activated:", sessionKeyAccount.address);
        } catch (error) {
            console.error("Failed to create session:", error);
        } finally {
            setIsCreating(false);
        }
    }, [kernelClient, isAAInitialized]);

    const clearSession = () => {
        setSessionClient(null);
        setIsActive(false);
    };

    return {
        sessionClient,
        isActive,
        isCreating,
        createSession,
        clearSession
    };
};
