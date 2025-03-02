# Sui Dimensional Arena

[English](README.md) | [中文](README_CN.md)

Sui Dimensional Arena 是一个基于 Sui 区块链的卡牌对战游戏。玩家可以收集独特的动漫角色卡牌,并在竞技场中与其他玩家进行战斗。

## 主要功能

- **卡牌铸造**: 玩家可以铸造独特的动漫角色 NFT 卡牌
- **卡牌属性**: 每张卡牌具有攻击和防御属性
- **对战系统**: 玩家可以创建或加入战斗,通过回合制的方式进行对战
- **胜利奖励**: 获胜者的卡牌将得到属性提升

## 玩法
![图 0](https://img.maxdiy10.com/2025-02/README-1740233564905.png)  
![图 1](https://img.maxdiy10.com/2025-02/README-1740233682001.png)  

## 技术栈

### 前端
- React + TypeScript
- Vite
- @mysten/dapp-kit
- Tailwind CSS
- Framer Motion

### 智能合约
- Move 语言
- Sui 区块链

## 开发环境设置

1. 安装依赖:

```bash
# 前端
cd frontend
pnpm install

# 合约
cd contracts
sui move build
```

2. 运行开发服务器:

```bash
# 前端
cd frontend
pnpm dev
``` 