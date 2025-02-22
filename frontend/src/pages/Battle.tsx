import { motion } from "motion/react";
import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { BATTLE_RECORD, TESTNET_CARD_PACKAGE_ID } from "../config/constants";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useCardsQuery } from '@/hooks/useCardsQuery';
import { useExecutor } from '@/hooks/useExecutor';
import { useBattlesQuery } from '@/hooks/useBattlesQuery';
import { Button } from "@/components/ui/button";
import { BattleTable } from "@/components/BattleTable";
import { useNavigate } from "react-router";
import { toast } from "sonner";


// 添加新的类型定义
interface CreateBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  hasCards: boolean;
}

// 创建对战模态框组件
function CreateBattleModal({ isOpen, onClose, onSubmit, hasCards }: CreateBattleModalProps) {
  const [battleName, setBattleName] = useState("");

  const handleSubmit = () => {
    onSubmit(battleName);
    setBattleName("");
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 rounded-3xl p-8 max-w-md w-full border border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-6">创建对战房间</h2>
        
        {!hasCards ? (
          <div className="text-red-400 mb-6">
            您还没有卡牌，请先获得卡牌后再创建对战房间！
          </div>
        ) : (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">房间名称</label>
            <input
              type="text"
              value={battleName}
              onChange={(e) => setBattleName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-xl border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="输入房间名称"
            />
          </div>
        )}
        
        <div className="flex justify-end space-x-4">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!hasCards || !battleName}
          >
            创建
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Battle() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const account = useCurrentAccount();
  const cardsQuery = useCardsQuery(account?.address);
  const battlesQuery = useBattlesQuery();
  const executor = useExecutor();
  const navigate = useNavigate();
  console.log({battlesQuery});

  const handleCreateBattle = async (battleName: string) => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        arguments: [
          tx.object(BATTLE_RECORD),
          tx.pure.string(battleName),
          tx.object(cardsQuery.data![0].data.objectId), // 暂时默认拿第一个卡牌
        ],
        target: `${TESTNET_CARD_PACKAGE_ID}::game::create_battle`,
      });

      await executor.mutate(
        { tx },
        async () => {
          setIsCreateModalOpen(false);
          await battlesQuery.refetch();
          // navigate(`/battle-arena/${battlesQuery.data?.[0].battleId}`);
        }
      );
    } catch (error) {
      console.error("创建房间失败:", error);
      alert("创建房间失败，请重试");
    }
  };

  const handleJoinBattle = async (battleId: string) => {
    console.log("cardsQuery.data 卡牌数据: ", cardsQuery);
    if (!cardsQuery.data?.length) {
        alert("请先获得卡牌后再加入对战！");
        toast.error("请先获得卡牌后再加入对战！");
        return;
    }

    try {
        // 从 battlesQuery 中找到对应的战斗数据
        const battle = battlesQuery.data?.find(battle => battle.battleId === battleId);
        
        if (!battle) {
            throw new Error("未找到对战房间");
        }

        // 如果是自己创建的对局或已经在对局中，直接跳转到对战页面
        if (battle.players.some((player: string) => player === account?.address)) {
            navigate(`/battle-arena/${battleId}`);
            return;
        }

        // 如果不是自己的对局，则尝试加入
        const tx = new Transaction();
        tx.moveCall({
            arguments: [
                tx.object(cardsQuery.data[0].data.objectId),
                tx.object(battleId)
            ],
            target: `${TESTNET_CARD_PACKAGE_ID}::game::join_battle`,
        });

        await executor.mutate(
            { 
                tx,
                options: {
                    showEffects: true,
                    showEvents: true,
                }
            },
            async () => {
                await battlesQuery.refetch();
                toast.success("加入对战成功！");
                navigate(`/battle-arena/${battleId}`);
            }
        );
    } catch (error) {
        console.error("加入对战失败:", error);
        alert("加入对战失败，请检查是否已经在对战中或房间已满");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-12"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Sui次元对战场
          </h1>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-10 py-6 text-xl"
          >
            创建房间
          </Button>
        </div>
      </motion.div>

      {/* Battle Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-7xl mx-auto"
      >
        {battlesQuery.isLoading ? (
          <div className="text-center py-20">
            <div className="text-xl text-gray-400">加载中...</div>
          </div>
        ) : battlesQuery.data?.length ? (
          <BattleTable
            data={battlesQuery.data?.map(battle => ({
              id: battle.battleId,
              name: battle.name,
              players: battle.players,
              status: battle.status
            }))}
            onJoin={handleJoinBattle}
          />
        ) : (
          <div className="text-center py-20">
            <div className="text-xl text-gray-400">暂无对战房间</div>
          </div>
        )}
      </motion.div>

      {/* Create Battle Modal */}
      <CreateBattleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateBattle}
        hasCards={!!cardsQuery.data?.length}
      />
    </div>
  );
}
