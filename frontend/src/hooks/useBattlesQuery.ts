import { useSuiClientQueries, useSuiClientQuery } from '@mysten/dapp-kit';
import { BATTLE_RECORD } from '../config/constants';
import { useQueryClient } from '@tanstack/react-query';

export function useBattlesQuery() {
  const queryClient = useQueryClient();

  // 首先获取 battle record
  const battleRecordQuery = useSuiClientQuery('getObject', {
    id: BATTLE_RECORD,
    options: {
      showContent: true,
      showOwner: true,
    }
  });

  // 然后使用 useSuiClientQueries 获取所有对战的详细信息
  const battlesQueries = useSuiClientQueries({
    queries: battleRecordQuery.data ? 
      (battleRecordQuery.data as any)?.data?.content?.fields?.battles?.map((battleId: string) => ({
        method: 'getObject',
        params: {
          id: battleId,
          options: {
            showContent: true,
            showOwner: true,
          }
        }
      })) : [],
    combine: (results) => ({
      // 处理并组合查询结果
      data: results
        .map((res) => {
          if (!res.data) return null;
          const battle = (res.data as any)?.data;
          return {
            battleId: battle.objectId,
            name: battle.content.fields.name,
            players: battle.content.fields.players,
            status: battle.content.fields.status,
          };
        })
        .filter(battle => battle !== null),
      isSuccess: results.every(res => res.isSuccess),
      isPending: results.some(res => res.isPending),
      isError: results.some(res => res.isError),
    })
  });

  return {
    ...battlesQueries,
    isLoading: battleRecordQuery.isPending || battlesQueries.isPending,
    refetch: async () => {
      // 刷新 battle record 查询
      await battleRecordQuery.refetch();
      
      // 如果有 battle record 数据，手动使所有相关查询失效
      if (battleRecordQuery.data) {
        const battles = (battleRecordQuery.data as any)?.data?.content?.fields?.battles || [];
        
        // 使每个战斗对象的查询失效，这将触发重新获取
        for (const battleId of battles) {
          await queryClient.invalidateQueries({
            queryKey: ['getObject', { id: battleId }]
          });
        }
      }
    }
  };
} 