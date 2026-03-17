export type TradingMetadata = {
    type: "LONG" | "SHORT",
    qty: number,
    symbol: (typeof SUPPORTED_ASSETS)[number]
}


export const SUPPORTED_ASSETS = ["SOL", "BTC", "ETH"];
export type TimerNodeMetadata = {
    time: number;

};
export type PriceTriggerMetadata = {
    asset: string;
    price: number; 
};  
