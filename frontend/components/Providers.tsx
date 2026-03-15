'use client';

import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

// Fix wallet extension conflicts (Rabby vs MetaMask fighting over window.ethereum)
if (typeof window !== 'undefined') {
  try {
    const desc = Object.getOwnPropertyDescriptor(window, 'ethereum');
    if (desc && !desc.configurable && desc.get) {
      // Rabby made window.ethereum read-only — force it to be configurable
      Object.defineProperty(window, 'ethereum', {
        get: desc.get,
        set(val) { /* allow wagmi/rainbowkit to set it */ },
        configurable: true,
      });
    }
  } catch {}
}

const queryClient = new QueryClient();

const customTheme = {
  ...darkTheme({
    accentColor: '#C9A84C',
    accentColorForeground: '#08080A',
    borderRadius: 'small' as const,
    overlayBlur: 'small' as const,
  }),
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
