# Sui Dimensional Arena

[English](README.md) | [中文](README_CN.md)

Sui Dimensional Arena is a card battle game built on the Sui blockchain. Players can collect unique anime character cards and battle with other players in the arena.

## Key Features

- **Card Minting**: Players can mint unique anime character NFT cards
- **Card Attributes**: Each card has attack and defense attributes
- **Battle System**: Players can create or join battles and engage in turn-based combat
- **Victory Rewards**: Winners' cards receive attribute boosts

## Gameplay
![Image 0](https://img.maxdiy10.com/2025-02/README-1740233564905.png)  
![Image 1](https://img.maxdiy10.com/2025-02/README-1740233682001.png)  

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- @mysten/dapp-kit
- Tailwind CSS
- Framer Motion

### Smart Contracts
- Move Language
- Sui Blockchain

## Development Setup

1. Install dependencies:

```bash
# Frontend
cd frontend
pnpm install

# Contracts
cd contracts
sui move build
```

2. Run development server:

```bash
# Frontend
cd frontend
pnpm dev
```
