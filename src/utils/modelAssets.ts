/** Shared URLs keep every 3D viewer on the same model revision. */
export const pillarModelUrl = (id: string) =>
  `/models/${id}.glb${id === 'enrich' ? '?v=d4b28fa0be42' : ''}`;
