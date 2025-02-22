import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card } from "@/components/ui/card";
import arenaBg from "@/assets/arena_bg.jpg";
import defenseIcon from "@/assets/defense.png";
import attackIcon from "@/assets/attack.png";
import { useSuiClientQuery, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { TESTNET_CARD_PACKAGE_ID } from "@/config/constants";
import { getDynamicFields, getObjects } from "../utils";
import playerAvatar from "@/assets/player_avatar.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle } from "lucide-react";


interface BattleCardProps {
  name: string;
  type: string;
  attack: number;
  defense: number;
  url: string;
}

const BattleCard = ({ name, type, attack, defense, url }: BattleCardProps) => {
  return (
    <Card className="w-[280px] bg-slate-950/95 border-slate-800 p-4">
      <div className="space-y-2">
        <div className="w-full h-[200px] rounded-lg overflow-hidden">
          <img src={url} alt={name} className="w-full h-full object-cover"/>
        </div>
        <h3 className="text-lg font-bold tracking-wider text-slate-200">{name}</h3>
        <p className="text-sm text-slate-400">{type}</p>
        {/* 攻击和防御数值 */}
        <div className="flex justify-between mt-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-slate-400">攻击</span>
            <span className="text-base font-semibold text-amber-500">{attack}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-slate-400">防御</span>
            <span className="text-base font-semibold text-red-500">{defense}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// 添加新的工具函数
const healthLevel = (points: number) => {
  if (points >= 75) return "bg-green-500";
  if (points >= 35) return "bg-orange-500";
  return "bg-red-500";
};

const formatAddress = (address: string) => {
  if (!address) return "未知地址";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

interface PlayerInfoProps {
  avatarSrc: string;
  health: number;
  address: string;
  isOpponent?: boolean;
}

const PlayerInfo = ({ avatarSrc, health, address, isOpponent }: PlayerInfoProps) => {
  // 将初始血量10转换为100%
  const healthPercentage = (health / 10) * 100;
  
  return (
    <div className={`flex items-center gap-4 p-6 ${isOpponent ? 'bg-slate-900/50' : 'bg-slate-800/50'}`}>
      <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden">
        <img 
          src={avatarSrc} 
          alt={isOpponent ? "Opponent" : "Player"} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-300">
            {formatAddress(address)}
          </span>
          <span className="text-sm font-medium text-slate-300">
            HP: {health}
          </span>
        </div>
        
        {/* 修改血条显示逻辑 */}
        <div className="h-3 bg-slate-950/70 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${healthLevel(healthPercentage)}`}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

interface PlayerStatus {
  health: number;
  account: string;
}

interface CardInfo {
  id: string;
  attack: number;
  defense: number;
  owner: string;
  name: string;
  url: string;
}

export function BattleArena() {
  const { battleId } = useParams();
  const [battleData, setBattleData] = useState<any>({});
  const [playerStatusTableId, setPlayerStatusTableId] = useState("");
  const [playersStatuId, setPlayersStatuId] = useState<string[]>([]);
  const [playerStatuses, setPlayerStatuses] = useState<PlayerStatus[]>([]);
  const [cardsTableId, setCardsTableId] = useState("");
  const [cardsInfoId, setCardsInfoId] = useState<string[]>([]);
  const [cardsInfo, setCardsInfo] = useState<CardInfo[]>([]);
  const myAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const navigate = useNavigate();

  // 添加一个新的状态来控制对话框的显示
  const [showResult, setShowResult] = useState(false);

  // 获取对局信息
  const { data: battleInfo } = useSuiClientQuery(
    "getObject",
    {
      id: battleId || "",
      options: {
        showContent: true,
        showOwner: true,
      },
    },
    {
        enabled: !!battleId,
        // 5秒自动刷新一次
        refetchInterval: 5000,
    }
  );

  useEffect(() => {
    if (!battleInfo?.data) return;
    const fields = (battleInfo.data as any)?.content?.fields;
    console.log("战斗信息fields: ", fields);
    setBattleData(fields);
    
    // 只有当winner字段存在且不为null时才显示对话框
    setShowResult(fields?.winer !== undefined && fields?.winer !== null);
    
    // 设置玩家状态表和卡牌表的ID
    setPlayerStatusTableId(fields?.player_status?.fields?.id?.id);
    setCardsTableId(fields?.cards?.fields?.id?.id);
  }, [battleInfo]);

  // 添加获取玩家状态ID的useEffect
  useEffect(() => {
    const getPlayers = async () => {
      if (!playerStatusTableId) return;
      const { data } = await getDynamicFields(playerStatusTableId);
      setPlayersStatuId(data.map((val) => val.objectId));
    };

    getPlayers();
  }, [playerStatusTableId]);

  // 添加获取卡牌ID的useEffect
  useEffect(() => {
    const getCards = async () => {
      if (!cardsTableId) return;
      const { data } = await getDynamicFields(cardsTableId);
      setCardsInfoId(data.map((val) => val.objectId));
    };
    getCards();
  }, [cardsTableId]);

  // 添加获取玩家状态的useEffect
  useEffect(() => {
    const getStatus = async () => {
      const res = await getObjects(playersStatuId);
      if (res.length === 0) return;
      
      const temp = res.map((v) => ({
        health: (v as any).data?.content.fields.value.fields.health,
        account: (v as any).data?.content.fields.name,
      }));
      setPlayerStatuses(temp);
    };

    getStatus();
  }, [playersStatuId]);

  // 添加获取卡牌信息的useEffect
  useEffect(() => {
    const getCards = async () => {
      const res = await getObjects(cardsInfoId);
      console.log("res", res);
      if (res.length === 0) return;
      
      const temp = res.map((v) => ({
        attack: Number((v as any).data?.content.fields.value.fields.attack),
        defense: Number((v as any).data?.content.fields.value.fields.defense),
        id: (v as any).data?.content.fields.value.fields.id.id,
        owner: (v as any).data?.content.fields.name,
        name: (v as any).data?.content.fields.value.fields.name,
        url: (v as any).data?.content.fields.value.fields.url
      }));
      setCardsInfo(temp);
    };
    getCards();
  }, [cardsInfoId]);

  // 处理攻击或防御动作
  const handleAction = (actionType: 'attack' | 'defense') => {
    const tx = new Transaction();
    const moveChoice = actionType === 'attack' ? 1 : 2;

    tx.moveCall({
      arguments: [
        tx.pure.u64(moveChoice),
        tx.object(battleId || ""),
      ],
      target: `${TESTNET_CARD_PACKAGE_ID}::game::move_choice`,
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (tx) => {
          console.log("动作执行成功:", tx);
          // 刷新用户状态
          // 这里可以添加成功提示或动画效果
        },
        onError: (err) => {
          console.error("动作执行失败:", err);
          // 这里可以添加错误提示
        },
      },
    );
  };

  // 添加处理导航的函数
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col relative">
        {/* 添加背景图片层 */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 pointer-events-none" 
          style={{ backgroundImage: `url(${arenaBg})` }}
        />
        
        {/* 添加一个相对定位的容器来确保内容在背景之上 */}
        <div className="relative flex flex-col flex-1">
          {/* 对手信息 */}
          <PlayerInfo
            avatarSrc={playerAvatar}
            health={playerStatuses.length > 1 
              ? (playerStatuses[0]?.account === myAccount?.address 
                ? playerStatuses[1]?.health 
                : playerStatuses[0]?.health) 
              : 0}
            address={playerStatuses.length > 1 
              ? (playerStatuses[0]?.account === myAccount?.address 
                ? playerStatuses[1]?.account 
                : playerStatuses[0]?.account) 
              : "等待对手加入..."}
            isOpponent={true}
          />
          
          {/* 战场区域 */}
          <div className="flex-1 flex flex-col justify-between p-6 gap-8 relative">
            {/* 对手卡牌 */}
            <div className="flex justify-center">
              {cardsInfo.length > 1 && (
                <BattleCard
                  name={cardsInfo[0]?.owner === myAccount?.address ? cardsInfo[1].name : cardsInfo[0].name}
                  type="OPPONENT"
                  attack={cardsInfo[0]?.owner === myAccount?.address ? cardsInfo[1].attack : cardsInfo[0].attack}
                  defense={cardsInfo[0]?.owner === myAccount?.address ? cardsInfo[1].defense : cardsInfo[0].defense}
                  url={cardsInfo[0]?.owner === myAccount?.address ? cardsInfo[1].url : cardsInfo[0].url}
                />
              )}
            </div>
            
            {/* 玩家卡牌和操作按钮 */}
            <div className="flex items-center justify-center gap-6 relative">
              {cardsInfo.length > 0 && (
                <BattleCard
                  name={cardsInfo[0]?.owner === myAccount?.address ? cardsInfo[0].name : cardsInfo[1].name}
                  type="PLAYER"
                  attack={cardsInfo[0]?.owner === myAccount?.address ? cardsInfo[0].attack : cardsInfo[1].attack}
                  defense={cardsInfo[0]?.owner === myAccount?.address ? cardsInfo[0].defense : cardsInfo[1].defense}
                  url={cardsInfo[0]?.owner === myAccount?.address ? cardsInfo[0].url : cardsInfo[1].url}
                />
              )}
              
              {/* 攻击和防御操作 */}
              <div className="flex flex-col gap-4 ml-10 absolute bottom-10 right-[700px]">
                <button
                  className="group flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-b from-red-500/90 to-red-600/90 hover:from-red-400 hover:to-red-500 active:from-red-600 active:to-red-700 shadow-lg transition-all duration-200"
                  onClick={() => handleAction('attack')}
                >
                  <img 
                    src={attackIcon} 
                    alt="Attack" 
                    className="w-7 h-7 group-hover:scale-110 transition-transform"
                  />
                </button>
                <button
                  className="group flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-b from-blue-500/90 to-blue-600/90 hover:from-blue-400 hover:to-blue-500 active:from-blue-600 active:to-blue-700 shadow-lg transition-all duration-200"
                  onClick={() => handleAction('defense')}
                >
                  <img 
                    src={defenseIcon} 
                    alt="Defense" 
                    className="w-7 h-7 group-hover:scale-110 transition-transform"
                  />
                </button>
              </div>
            </div>
          </div>
          
          {/* 玩家信息 */}
          <PlayerInfo
            avatarSrc={playerAvatar}
            health={playerStatuses[0]?.health || 0}
            address={myAccount?.address || "未连接钱包"}
            isOpponent={false}
          />
        </div>
      </div>

      {/* 修改胜负结果对话框 */}
      <AlertDialog open={showResult}>
        <AlertDialogContent className="bg-slate-900 border border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              {battleData.winer === myAccount?.address ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <span className="text-green-500">恭喜获胜！</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span className="text-red-500">很遗憾，战斗失败</span>
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {battleData.winer === myAccount?.address
                ? "你在这场战斗中表现出色，成功击败了对手！"
                : "别灰心，失败是成功之母，再接再厉！"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogAction
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200"
              onClick={() => handleNavigate("/")}
            >
              返回首页
            </AlertDialogAction>
            <AlertDialogAction
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
              onClick={() => handleNavigate("/battle")}
            >
              对战大厅
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}