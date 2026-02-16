import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, type Chain, type Hex } from "viem";
import { monadTestnet } from '../chains';

interface AAContextType {
    address: Hex | null;
    smartAccountAddress: Hex | null; // For compatibility
    isAAInitialized: boolean;
    kernelClient: any | null; // For compatibility
    sessionClient: any | null; // For compatibility
    isSessionActive: boolean;
    isCreatingSession: boolean;
    createSession: () => Promise<void>;
    clearSession: () => void;
}

const AAContext = createContext<AAContextType>({
    address: null,
    smartAccountAddress: null,
    isAAInitialized: false,
    kernelClient: null,
    sessionClient: null,
    isSessionActive: false,
    isCreatingSession: false,
    createSession: async () => { },
    clearSession: () => { },
});

export const useAA = () => useContext(AAContext);

export const AAProvider = ({ children }: { children: ReactNode }) => {
    const { authenticated } = usePrivy();
    const { wallets } = useWallets();
    const [address, setAddress] = useState<Hex | null>(null);
    const [walletClient, setWalletClient] = useState<any | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const initWeb3 = async () => {
            if (!authenticated || !wallets.length) {
                setAddress(null);
                setWalletClient(null);
                setIsReady(false);
                return;
            }

            try {
                const privyWallet = wallets[0];
                await privyWallet.switchChain(monadTestnet.id);
                const provider = await privyWallet.getEthereumProvider();

                const client = createWalletClient({
                    account: privyWallet.address as Hex,
                    chain: monadTestnet as Chain,
                    transport: custom(provider)
                });

                setAddress(privyWallet.address as Hex);
                setWalletClient(client);
                setIsReady(true);
                console.log("Web3 Ready (EOA):", privyWallet.address);
            } catch (error) {
                console.error("Failed to initialize Web3:", error);
            }
        };

        initWeb3();
    }, [authenticated, wallets]);

    // Mocking session logic to prevent breaking components immediately
    const createSession = async () => {
        console.log("Sessions are disabled in EOA mode.");
    };

    const clearSession = () => { };

    return (
        <AAContext.Provider value={{
            address,
            smartAccountAddress: address, // Map to address for compatibility
            isAAInitialized: isReady,
            kernelClient: walletClient, // Map to walletClient for compatibility
            sessionClient: null,
            isSessionActive: false,
            isCreatingSession: false,
            createSession,
            clearSession
        }}>
            {children}
        </AAContext.Provider>
    );
};
