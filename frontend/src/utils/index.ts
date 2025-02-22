import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
const client = new SuiClient({ url: getFullnodeUrl("testnet") });

export const getObject = (objId: string) => {
  return client.getObject({
    id: objId,
    options: {
      showContent: true,
      showOwner: true,
    },
  });
};

export const getDynamicFields = (id: string) => {
  return client.getDynamicFields({
    parentId: id,
  });
};
// multiGetObjects
export const getObjects = (ids: string[]) => {
  return client.multiGetObjects({
    ids,
    options: {
      showContent: true,
      showOwner: true,
    },
  });
};
