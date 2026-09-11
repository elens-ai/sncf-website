import { getPavilionSettings } from '../cms/pavilionSettings';
import { safePavilionURL } from '../cms/pavilionDefaults';
import { resolveCMSAsset } from '../cms/runtime';

/** Shared CMS URLs keep all viewers on the same published model revision. */
export const pillarModelUrl = (id: string) => {
  const models = getPavilionSettings().models;
  const fallback = Object.prototype.hasOwnProperty.call(models, id)
    ? models[id as keyof typeof models]
    : `/models/${encodeURIComponent(id)}.glb`;
  return safePavilionURL(resolveCMSAsset(`pavilion.model.${id}`, fallback), fallback);
};
