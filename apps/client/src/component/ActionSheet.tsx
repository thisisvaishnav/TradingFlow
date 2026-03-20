import { useState, useEffect } from "react";
import type { NodeKind, NodeMetadata } from "./CreateWorkflow";
import { Button } from "@/components/ui/button";
import { SUPPORTED_ASSETS } from "common/types";
import type { LighterTradingMetadata } from "common/types";
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TradingMetadata } from "@/nodes/action/Hyperliquid";

const SUPPORTED_ACTIONS = [
  { id: "Hyperliquid", title: "Hyperliquid", comingSoon: true },
  { id: "Backpack", title: "Backpack", comingSoon: true },
  { id: "Lighter", title: "Lighter", comingSoon: false },
];

const DEFAULT_LIGHTER_URL = "https://mainnet.zklighter.elliot.ai";

export function ActionSheet({
  open, onOpenChange, onSelect, initialAction, editMetadata,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (kind: NodeKind, metadata: NodeMetadata) => void;
  initialAction?: string;
  editMetadata?: NodeMetadata;
}) {
  const [selectedAction, setSelectedAction] = useState("");
  const [tradeType, setTradeType] = useState<"LONG" | "SHORT">("LONG");
  const [qty, setQty] = useState("");
  const [symbol, setSymbol] = useState("");

  const [lighterPrivateKey, setLighterPrivateKey] = useState("");
  const [lighterAccountIndex, setLighterAccountIndex] = useState("");
  const [lighterApiKeyIndex, setLighterApiKeyIndex] = useState("");
  const [lighterUrl, setLighterUrl] = useState(DEFAULT_LIGHTER_URL);

  // Pre-select action and populate metadata when sheet opens
  useEffect(() => {
    if (open) {
      if (editMetadata) {
        const meta = editMetadata as LighterTradingMetadata;
        setSelectedAction(initialAction || "");
        setTradeType(meta.type || "LONG");
        setQty(meta.qty?.toString() || "");
        setSymbol(meta.symbol || "");
        setLighterPrivateKey(meta.lighterPrivateKey || "");
        setLighterAccountIndex(meta.lighterAccountIndex?.toString() || "");
        setLighterApiKeyIndex(meta.lighterApiKeyIndex?.toString() || "");
        setLighterUrl(meta.lighterUrl || DEFAULT_LIGHTER_URL);
      } else {
        if (initialAction) {
          setSelectedAction(initialAction);
        } else {
          setSelectedAction("");
        }
        setTradeType("LONG");
        setQty("");
        setSymbol("");
        setLighterPrivateKey("");
        setLighterAccountIndex("");
        setLighterApiKeyIndex("");
        setLighterUrl(DEFAULT_LIGHTER_URL);
      }
    }
  }, [open, initialAction, editMetadata]);

  const isExchange = ["Hyperliquid", "Backpack", "Lighter"].includes(selectedAction);
  const isComingSoon = SUPPORTED_ACTIONS.find((a) => a.id === selectedAction)?.comingSoon ?? false;
  const isLighter = selectedAction === "Lighter";
  const isEditMode = !!editMetadata;
  const lighterKeysComplete = lighterPrivateKey.length > 0 && lighterAccountIndex.length > 0 && lighterApiKeyIndex.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-heading">{isEditMode ? "Edit Action" : "Select Action"}</SheetTitle>
          <SheetDescription>{isEditMode ? "Modify action settings." : "Choose an exchange and configure your trade."}</SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-5 py-3 sm:px-6">
          <div className="space-y-1.5">
            <Label>Exchange</Label>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select exchange" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SUPPORTED_ACTIONS.map(({ id, title, comingSoon }) => (
                    <SelectItem key={id} value={id} disabled={comingSoon}>
                      <span className="flex items-center gap-2">
                        {title}
                        {comingSoon && (
                          <span className="ml-auto text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
                            Soon
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {isExchange && isComingSoon && (
            <div className="space-y-3 p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: "3px solid var(--text-muted)", textAlign: "center" }}>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Coming Soon
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
                {selectedAction} integration is under development. Use <strong>Lighter</strong> for live trading.
              </p>
            </div>
          )}

          {isExchange && !isComingSoon && (
            <div className="space-y-3 p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: "3px solid var(--border-strong)" }}>
              <div className="space-y-1.5">
                <Label>Trade Type</Label>
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => setTradeType("LONG")}
                    data-active={tradeType === "LONG" ? "true" : "false"}
                    className="trade-btn trade-btn--long flex-1 font-data"
                  >
                    LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeType("SHORT")}
                    data-active={tradeType === "SHORT" ? "true" : "false"}
                    className="trade-btn trade-btn--short flex-1 font-data"
                    style={{ marginLeft: "-1px" }}
                  >
                    SHORT
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" placeholder="0.00" className="font-data" value={qty} onChange={(e) => setQty(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Symbol</Label>
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select asset" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SUPPORTED_ASSETS.map((asset) => <SelectItem key={asset} value={asset}><span className="font-data">{asset}</span></SelectItem>)}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {isLighter && (
                <div className="space-y-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    Lighter API Keys
                  </div>

                  <div className="space-y-1.5">
                    <Label>Private Key</Label>
                    <Input
                      type="password"
                      placeholder="API key private key"
                      className="font-data text-xs"
                      value={lighterPrivateKey}
                      onChange={(e) => setLighterPrivateKey(e.target.value)}
                      autoComplete="off"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="space-y-1.5 flex-1">
                      <Label>Account Index</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        className="font-data text-xs"
                        value={lighterAccountIndex}
                        onChange={(e) => setLighterAccountIndex(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <Label>API Key Index</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        className="font-data text-xs"
                        value={lighterApiKeyIndex}
                        onChange={(e) => setLighterApiKeyIndex(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>API URL</Label>
                    <Input
                      type="url"
                      placeholder={DEFAULT_LIGHTER_URL}
                      className="font-data text-xs"
                      value={lighterUrl}
                      onChange={(e) => setLighterUrl(e.target.value)}
                    />
                  </div>

                  <p className="text-[10px]" style={{ color: "var(--text-muted)", lineHeight: 1.4 }}>
                    Get your keys at{" "}
                    <a
                      href="https://app.lighter.xyz/apikeys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                      tabIndex={0}
                      aria-label="Open Lighter API keys page"
                    >
                      app.lighter.xyz/apikeys
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button
            disabled={isComingSoon || !selectedAction || !qty || !symbol || (isLighter && !lighterKeysComplete)}
            onClick={() => {
              if (isComingSoon) return;
              if (!selectedAction || !qty || !symbol) return;

              if (isLighter) {
                if (!lighterKeysComplete) return;
                const metadata: LighterTradingMetadata = {
                  type: tradeType,
                  qty: Number(qty),
                  symbol: symbol as TradingMetadata["symbol"],
                  lighterPrivateKey,
                  lighterAccountIndex: Number(lighterAccountIndex),
                  lighterApiKeyIndex: Number(lighterApiKeyIndex),
                  lighterUrl: lighterUrl || DEFAULT_LIGHTER_URL,
                };
                onSelect(selectedAction as NodeKind, metadata);
              } else {
                const metadata: TradingMetadata = { type: tradeType, qty: Number(qty), symbol: symbol as TradingMetadata["symbol"] };
                onSelect(selectedAction as NodeKind, metadata);
              }

              onOpenChange(false);
            }}
            type="submit"
          >
            {isComingSoon ? "Coming Soon" : isEditMode ? "Update Action" : "Create Action"}
          </Button>
          <SheetClose asChild><Button variant="outline">Close</Button></SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}