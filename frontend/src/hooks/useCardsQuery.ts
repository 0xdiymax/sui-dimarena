import { useSuiClientQuery } from '@mysten/dapp-kit';
import { TESTNET_CARD_PACKAGE_ID } from '../config/constants';
import { UseQueryResult } from '@tanstack/react-query';

export type Card = {
  data: {
    objectId: string;
    content: {
      fields: {
        url: string;
        name: string;
        description: string;
        attack: number;
        defense: number;
      }
    }
  }
};

export type UseCardsQueryResult = UseQueryResult<Card[], Error>;

export function useCardsQuery(address: string | undefined): UseCardsQueryResult {
  return useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: address,
      options: {
        showContent: true,
        showOwner: true,
      },
      filter: {
        MatchAll: [
          {
            StructType: `${TESTNET_CARD_PACKAGE_ID}::game::Card`,
          },
        ],
      },
    },
    {
      enabled: !!address,
      // 5秒自动刷新一次
      refetchInterval: 5000,
      select: (response) => response.data || [],
    }
  );
} 