import React from "react";
import ReactDOM from "react-dom/client";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";
import "./index.css";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router";
import { networkConfig } from "./config/networkConfig";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Battle } from "./pages/Battle";
import { BattleArena } from "./pages/BattleArena";
import { Toaster } from "sonner";
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <HashRouter>
            <Toaster position="top-center" richColors />
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/battle" element={<Battle />} />
                <Route path="/battle-arena/:battleId" element={<BattleArena />} />
              </Route>
            </Routes>
          </HashRouter>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
