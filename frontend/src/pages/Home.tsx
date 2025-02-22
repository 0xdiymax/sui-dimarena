import { motion } from "motion/react"
import homeBg from "@/assets/home_bg.jpg";
import homeBg2 from "@/assets/home_bg2.jpg";
import cardBg from "@/assets/card_bg.png";
import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { CARD_RECORD, TESTNET_CARD_PACKAGE_ID, NFT_TEMPLATES } from "../config/constants";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useCardsQuery } from '@/hooks/useCardsQuery';
import { useExecutor } from '@/hooks/useExecutor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { GlareCard } from "@/components/ui/glare-card"
import { Loader2 } from "lucide-react"

export function Home() {
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const account = useCurrentAccount();
  
  // 使用自定义hook查询卡牌
  const cardsQuery = useCardsQuery(account?.address);
  
  // 使用useExecutor处理交易
  const executor = useExecutor();

  // 修改状态声明
  const [showNftDialog, setShowNftDialog] = useState(false);
  const [mintedCard, setMintedCard] = useState<any>(null);
  const [isMinting, setIsMinting] = useState(false);

  // Mint NFT函数
  const mintCard = async (index: number) => {
    if (isMinting) return; // 防止重复点击
    
    try {
      setIsMinting(true);
      const tx = new Transaction();
      tx.moveCall({
        arguments: [
          tx.object(CARD_RECORD),
          tx.object(NFT_TEMPLATES),
          tx.object("0x6")
        ],
        target: `${TESTNET_CARD_PACKAGE_ID}::game::create_card`,
      });

      executor.mutate(
        { tx },
        async () => {
          // 翻转卡片
          if (flippedCards.includes(index)) {
            setFlippedCards(flippedCards.filter(i => i !== index));
          } else {
            setFlippedCards([...flippedCards, index]);
          }
          
          // 刷新卡牌列表并获取最新铸造的卡牌
          const latestCards = await cardsQuery.refetch();
          const newCard = latestCards.data?.[latestCards.data.length - 1];
          
          if (newCard) {
            setMintedCard(newCard);
            setShowNftDialog(true);
          }
        }
      );
    } catch (error) {
      console.error("Mint失败:", error);
    } finally {
      setIsMinting(false);
    }
  };

  // 卡片点击处理函数
  const handleCardClick = (index: number) => {
    if (!flippedCards.includes(index)) {
      mintCard(index);
    }
  };

  return (
    <div className="w-full min-h-[200vh]">
      {/* 第一屏 - 背景大图 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="h-screen w-full relative"
        style={{
          backgroundImage: `url(${homeBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/30" /> {/* 添加暗色遮罩 */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative z-10 h-full flex flex-col items-center justify-center text-white"
        >
          <h1 className="text-6xl font-bold mb-6">Sui次元竞技场</h1>
          <p className="text-xl mb-8">开启你的卡牌之旅</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            开始抽卡
          </motion.button>
        </motion.div>
      </motion.div>

      {/* 第二屏 - 抽卡区域 */}
      <div 
        className="min-h-screen w-full bg-black flex flex-col items-center py-20 relative overflow-hidden"
        style={{
          backgroundImage: `url(${homeBg2})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* 添加一个更深的遮罩层以确保内容可见性 */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* 其他内容保持不变，但需要确保在遮罩层之上 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[100px]" />
        
        {/* 确保所有内容都在遮罩层上方 */}
        <div className="relative z-10 w-full flex flex-col items-center">
          <h1 className="mb-16 mt-12 text-3xl text-white font-bold text-center relative z-2 font-sans">
            点击卡牌抽取NFT
          </h1>
          
          {/* 抽卡区域 - 更新样式 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 relative z-10">
            {[0, 1, 2].map((index) => (
              <div 
                key={index} 
                className="cursor-pointer transform transition-transform hover:scale-105"
              >
                <GlareCard 
                  className="flex flex-col items-center justify-center backdrop-blur-sm bg-white/5"
                  aspectRatio="124/179"
                  onClick={() => handleCardClick(index)}
                >
                  <img
                    className="h-full w-full absolute inset-0 object-cover scale-[1.1]"
                    src={cardBg}
                    alt={`Card ${index + 1}`}
                  />
                  {isMinting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm text-white rounded-3xl">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}
                  {flippedCards.includes(index) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-3xl">
                      <img 
                        src={mintedCard?.data.content.fields.url} 
                        alt="Minted Card"
                        className="w-full h-full object-cover rounded-3xl"
                      />
                    </div>
                  )}
                </GlareCard>
              </div>
            ))}
          </div>

          {/* 按钮区域 - 更新样式 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex gap-6 mb-20 relative z-10"
          >
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="default" 
                  size="lg"
                  className="px-8 py-6 text-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white"
                >
                  查看卡牌
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[1200px] h-[700px] overflow-hidden bg-black/95 border border-white/10 p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-medium mb-6 text-white">我的卡牌收藏</DialogTitle>
                </DialogHeader>
                
                <div className="h-[calc(100%-80px)] overflow-y-auto pr-4 custom-scrollbar">
                  {cardsQuery.isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span>加载中...</span>
                    </div>
                  ) : cardsQuery.isError ? (
                    <div className="flex items-center justify-center h-full text-red-400">
                      <span>加载失败: {cardsQuery.error.message}</span>
                    </div>
                  ) : cardsQuery.data?.length ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-5 gap-4 pb-4"
                    >
                      {cardsQuery.data.map((card, index) => (
                        <motion.div
                          key={card.data.objectId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="group relative bg-white/5 backdrop-blur-md rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
                        >
                          {/* 卡牌图片容器 */}
                          <div className="aspect-[3/4] overflow-hidden rounded-t-lg">
                            <img 
                              src={card.data.content.fields.url} 
                              alt={card.data.content.fields.name}
                              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          
                          {/* 卡牌信息 - 进一步缩小内边距和字体大小 */}
                          <div className="p-2">
                            <h4 className="text-sm font-medium mb-0.5 text-white line-clamp-1">
                              {card.data.content.fields.name}
                            </h4>
                            <p className="text-[10px] text-gray-400 mb-1.5 line-clamp-2 h-[24px]">
                              {card.data.content.fields.description}
                            </p>
                            <div className="flex gap-1">
                              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-[9px]">
                                攻击:{card.data.content.fields.attack}
                              </span>
                              <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded-full text-[9px]">
                                防御:{card.data.content.fields.defense}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-100">还没有卡牌</h3>
                      <p className="mt-1 text-sm text-gray-500">开始你的卡牌收集之旅吧!</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-6 text-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white"
              onClick={() => window.location.href = '/battle'}
            >
              开始对战
            </Button>
          </motion.div>
        </div>
      </div>

      {/* 抽卡成功后弹窗 */}
      <Dialog open={showNftDialog} onOpenChange={setShowNftDialog}>
        <DialogContent className="bg-black/95 border border-white/10 max-w-[360px] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-white text-center mb-4">
              获得新卡牌
            </DialogTitle>
          </DialogHeader>
          
          {mintedCard && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotateY: -180 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="flex flex-col items-center"
            >
              <motion.div 
                className="relative w-full aspect-[3/4] mb-4"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <img
                  src={mintedCard.data.content.fields.url}
                  alt={mintedCard.data.content.fields.name}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg" />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center w-full"
              >
                <h3 className="text-lg font-medium text-white mb-1.5">
                  {mintedCard.data.content.fields.name}
                </h3>
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {mintedCard.data.content.fields.description}
                </p>
                <div className="flex justify-center gap-3">
                  <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium">
                    攻击: {mintedCard.data.content.fields.attack}
                  </span>
                  <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 rounded-full text-xs font-medium">
                    防御: {mintedCard.data.content.fields.defense}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 