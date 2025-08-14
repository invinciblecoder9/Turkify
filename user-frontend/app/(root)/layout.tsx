"use client"
import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    WalletModalProvider
} from '@solana/wallet-adapter-react-ui';;

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

// eslint-disable-next-line @typescript-eslint/no-unused-vars
 const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint.
    const endpoint = "https://solana-devnet.g.alchemy.com/v2/vY6QqmImyweRBYMpQ2PU0";
    const wallets = useMemo(
        () => [],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    );

  return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                       {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
  );
}
