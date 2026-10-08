import { getCMSCopy } from '../cms/runtime';
import React from 'react';
import { Droplets, Building2, Map, Users, HeartHandshake, MapPin, Landmark, School, GraduationCap, Trees, Home, Stethoscope, Scissors, Sprout, TreePine } from 'lucide-react';
import type { Activity } from '../data/activities';
import { insightsFor } from '../data/insights';
import { slug } from '../utils/slug';
import { ChartBand, Card, Bars, Pictogram, Ring, Tiles, Figure, InsightRibbon } from './ValueAnalytics';

/**
 * THE FIGURES OF ONE FLAGSHIP PROJECT, DRAWN OUT — the Core Values chart
 * kit under each project chapter. Same rules as there: every value is read
 * from the project's own data points, each card carries the reporting
 * date, a ring says what it is a share of, a pictogram's legend says what a
 * symbol stands for, and the "one area, three measures" bars are the same
 * reported quantity in the three units the report gives it in.
 */
export const ProjectAnalytics: React.FC<{ project: Activity }> = ({ project }) => {
  const v = (label: string) => project.dataPoints.find(point => point.label === label)?.value ?? '';
  const period = project.period;
  /* the project's own photograph on its cards */
  const photo = project.images?.[0]?.src;
  let cards: React.ReactNode = null;
  switch (project.id) {
    case 'project-amrit':
      cards = <>
        <Card title={getCMSCopy("copy.ProjectAnalytics.amrit1", "Amrit across the country")} period={period} span={4} photo={photo}>
          <Tiles items={[{ icon: Droplets, value: v('Water bodies'), label: 'Water bodies' }, { icon: Building2, value: v('Cities'), label: 'Cities' }, { icon: Map, value: v('States / UTs'), label: 'States / UTs' }]} />
          <Pictogram total={v('Water bodies')} unit={250} icon={Droplets} legend={getCMSCopy("copy.ProjectAnalytics.waterLegend", "Each drop stands for 250 water bodies")} />
        </Card>
        <Card title={getCMSCopy("copy.ProjectAnalytics.amrit2", "Hands in the water")} period={period} span={2} photo={project.images?.[1]?.src ?? photo}>
          <div className="va-money"><Figure value={v('Volunteers participated')} size="lg" /><span className="va-money-line">{getCMSCopy("copy.ProjectAnalytics.volunteers", "volunteers participated")}</span></div>
          <Pictogram total={v('Volunteers participated')} unit={250000} icon={Users} legend={getCMSCopy("copy.ProjectAnalytics.volunteerLegend", "Each figure stands for 250,000 volunteers")} />
          <div className="va-aside"><HeartHandshake size={16} strokeWidth={1.6} aria-hidden="true" /><Figure value={v('Manhours')} size="sm" /> {getCMSCopy("copy.ProjectAnalytics.manhours", "manhours")}</div>
        </Card>
      </>;
      break;
    case 'oneness-vann':
      cards = <>
        <Card title={getCMSCopy("copy.ProjectAnalytics.vann1", "Forests, plant by plant")} period={period} span={3} photo={photo}>
          <div className="va-money"><Figure value={v('Plants')} size="xl" /><span className="va-money-line">{getCMSCopy("copy.ProjectAnalytics.plantsAcross", "plants, across")} <Figure value={v('Sites')} size="md" /> {getCMSCopy("copy.ProjectAnalytics.sites", "sites")}</span></div>
          <Pictogram total={v('Plants')} unit={25000} icon={Trees} legend={getCMSCopy("copy.ProjectAnalytics.plantLegend", "Each tree stands for 25,000 plants")} />
        </Card>
        <Card title={getCMSCopy("copy.ProjectAnalytics.vann2", "One area, three measures")} note={getCMSCopy("copy.ProjectAnalytics.vann2note", "The same forest area, as the report gives it in each unit.")} period={period} span={3}>
          <Bars equal items={[{ label: 'Square feet', value: v('Area') }, { label: 'Acres', value: v('Acres') }, { label: 'Hectares', value: v('Hectares') }]} />
        </Card>
      </>;
      break;
    case 'watershed':
      cards = (
        <Card title={getCMSCopy("copy.ProjectAnalytics.watershed1", "Every hamlet, one by one")} period={period} span={6}>
          <Tiles items={[{ icon: Users, value: v('People benefitted'), label: 'People benefitted' }, { icon: Landmark, value: v('Gram panchayats'), label: 'Gram panchayats' }, { icon: MapPin, value: v('Hamlets'), label: 'Hamlets' }]} />
          <Pictogram total={v('Hamlets')} unit={1} legend={getCMSCopy("copy.ProjectAnalytics.hamletLegend", "Each square is one hamlet")} />
        </Card>
      );
      break;
    case 'adopted-villages':
      cards = <>
        <Card title={getCMSCopy("copy.ProjectAnalytics.villages1", "Direct beneficiaries, of the villages' people")} period={period} span={3} photo={photo}>
          <Ring part={{ value: v('Direct beneficiaries'), label: getCMSCopy("copy.ProjectAnalytics.direct", "direct beneficiaries") }} whole={{ value: v('Total village population'), label: getCMSCopy("copy.ProjectAnalytics.villagers", "people in the villages") }} />
          <div className="va-aside"><Home size={16} strokeWidth={1.6} aria-hidden="true" /><Figure value={v('Villages')} size="sm" /> {getCMSCopy("copy.ProjectAnalytics.adopted", "villages, adopted whole")}</div>
        </Card>
        <Card title={getCMSCopy("copy.ProjectAnalytics.villages2", "Schools in the villages")} period={period} span={3} photo={project.images?.[1]?.src ?? photo}>
          <Tiles items={[{ icon: School, value: v('Schools'), label: 'Schools' }, { icon: GraduationCap, value: v('School children'), label: 'School children' }, { icon: Users, value: v('Impacted population'), label: 'Impacted population' }]} />
        </Card>
        {/* everything else the villages report, by what it is for: care, skills and green cover */}
        <Card title={getCMSCopy("copy.ProjectAnalytics.villages3", "Care, skills and green cover")} period={period} span={6}>
          <Tiles items={[
            { icon: Stethoscope, value: v('Health & eye camps'), label: 'Health & eye camps' },
            { icon: Users, value: v('Patients treated'), label: 'Patients treated' },
            { icon: GraduationCap, value: v('Students benefitting'), label: 'Students benefitting' },
            { icon: Scissors, value: v('Sewing centres'), label: 'Sewing centres' },
            { icon: TreePine, value: v('Saplings planted'), label: 'Saplings planted' },
            { icon: Sprout, value: v('Green cover'), label: 'Green cover' },
          ].filter(item => item.value)} />
          <Pictogram total={v('Saplings planted')} unit={5000} icon={TreePine} legend={getCMSCopy("copy.ProjectAnalytics.saplingLegend", "Each tree stands for 5,000 saplings planted")} />
        </Card>
      </>;
      break;
  }
  if (!cards) return null;
  /* the project's figures read together, each opening its Reports */
  const entries = insightsFor(project).map(insight => ({ key: insight.label, insight, href: `#${slug(project.title)}-reports` }));
  return <ChartBand id={`${project.id}-analytics`} className="project-analytics" lead={<InsightRibbon entries={entries} />}>{cards}</ChartBand>;
};
