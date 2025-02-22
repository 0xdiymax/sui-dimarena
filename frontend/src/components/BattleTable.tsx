import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface BattleTableProps {
  data: {
    id: string;
    name: string;
    players: string[];
    status: string;
  }[];
  onJoin: (battleId: string) => void;
}

export function BattleTable({ data, onJoin }: BattleTableProps) {
  const formatAddress = (address: string) => 
    `${address.substring(0, 6)}...${address.slice(-4)}`

  const getStatusText = (status: string) => {
    switch(status) {
      case "0": return "等待加入"
      case "1": return "对战中"
      case "2": return "已结束"
      default: return "未知状态"
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>房间名称</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>玩家</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((battle) => (
          <TableRow key={battle.id}>
            <TableCell>{formatAddress(battle.id)}</TableCell>
            <TableCell>{battle.name}</TableCell>
            <TableCell>{getStatusText(battle.status)}</TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span>{formatAddress(battle.players[0])}</span>
                {battle.players[1] && (
                  <span>{formatAddress(battle.players[1])}</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                className="bg-blue-500"
                onClick={() => onJoin(battle.id)}
                // disabled={battle.status !== "0"}
              >
                加入
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}