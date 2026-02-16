import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Privy & Wagmi Integration
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { monadTestnet } from './chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { http } from 'viem';

import { AAProvider } from './components/AAProvider';

const queryClient = new QueryClient();

const MONAD_RPC = import.meta.env.VITE_MONAD_RPC || 'https://testnet-rpc.monad.xyz/';

// Wagmi config for Privy
const wagmiConfig = createConfig({
    chains: [monadTestnet],
    transports: {
        [monadTestnet.id]: http(MONAD_RPC),
    },
});

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cllyhpv7m0151l0089f36fxxx';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <PrivyProvider
            appId={PRIVY_APP_ID}
            config={{
                appearance: {
                    theme: 'dark',
                    accentColor: '#00f5ff',
                    showWalletLoginFirst: true,
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets',
                    },
                },
                defaultChain: monadTestnet,
                supportedChains: [monadTestnet],
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={wagmiConfig}>
                    <AAProvider>
                        <App />
                    </AAProvider>
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    </React.StrictMode>,
);
