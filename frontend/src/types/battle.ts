export interface Battle {
  battleId: string;
  battleName: string;
  status: number; // 0: waiting, 1: in progress, 2: finished
  players: string[];
  creator: string;
}

export interface BattleTableProps {
  data: Battle[];
  onJoin: (battleId: string) => void;
}

export interface Card {
  id: string;
  name: string;
  type: string;
  attack: number;
  health: number;
  image?: string;
}

export interface Player {
  address: string;
  health: number;
  avatar?: string;
}

export interface HealthBarProps {
  value: number;
  className?: string;
}

export interface BattleCardProps {
  name: string;
  type: string;
  attack: number;
  health: number;
} 