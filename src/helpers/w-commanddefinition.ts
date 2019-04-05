export interface WCommandDefinition {
  symbol: String
  description: String;
  execute: () => void;
}
