/**
 * Anchor ids from titles — ONE definition, so the section ids the Projects
 * page renders and the deep links that point at them can never drift apart.
 */
export const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
