import { Droplets, HandHeart, HeartPulse, Leaf, Mountain, School, Sprout, Stethoscope, Trees, Users, Waves, type LucideIcon } from 'lucide-react';
import { getCMSCopy } from '../cms/runtime';
import { getCMSLink } from '../cms/links';

const c = (key: string, fallback: string) => getCMSCopy(`copy.ProjectStories.${key}`, fallback);

export interface ProjectStory {
  title: string;
  paragraphs: string[];
  pillars: { icon: LucideIcon; title: string; text: string }[];
  impactTitle: string;
  impactNote: string;
  groups: { title: string; points: number[] }[];
  source: string;
}

/** Editorial background from the linked project pages; numerical results stay in Activities. */
export function projectStory(id: string): ProjectStory | undefined {
  const stories: Record<string, ProjectStory> = {
    'project-amrit': {
      title: c('amrit-title', 'A cleaner shore. A shared responsibility.'),
      paragraphs: [
        c('amrit-story', 'Water connects our homes, our communities and the natural world. Project Amrit brings volunteers to rivers, lakes, ponds and shorelines to remove litter and care for these shared spaces.'),
        c('amrit-context', 'Launched in 2023, “Swachh Jal, Swachh Mann” connects hands-on service with public awareness. Clean-up drives, youth participation and conversations about plastic waste encourage people to make water conservation part of everyday life.'),
      ],
      pillars: [
        { icon: Waves, title: c('amrit-work-1', 'Care for our water'), text: c('amrit-detail-1', 'Volunteers clear plastic, discarded materials and debris from water bodies and their surrounding banks.') },
        { icon: Users, title: c('amrit-work-2', 'Bring people together'), text: c('amrit-detail-2', 'Local communities and young volunteers contribute their time to a common purpose.') },
        { icon: Droplets, title: c('amrit-work-3', 'Keep the message flowing'), text: c('amrit-detail-3', 'Awareness activities encourage water conservation and less dependence on single-use plastics.') },
      ],
      impactTitle: c('amrit-impact', 'Many hands. One shared purpose.'),
      impactNote: c('amrit-note', 'From the places reached to the time volunteered, these figures show the scale of the reported effort.'),
      groups: [ { title: c('amrit-reach', 'Across our water bodies'), points: [0, 1, 2] }, { title: c('amrit-effort', 'The people behind the work'), points: [3, 4] } ],
      source: getCMSLink('copy.Link.ProjectStories.amrit', 'https://nirankarifoundation.org/project-amrit/'),
    },
    'oneness-vann': {
      title: c('oneness-title', 'Plant a sapling. Nurture a forest.'),
      paragraphs: [
        c('oneness-story', 'A forest begins with planting, but grows through care. Oneness Vann creates micro and mini forests, bringing clusters of trees into spaces that can support a greener future.'),
        c('oneness-context', 'Introduced in August 2021, the programme pairs planting with a commitment to nurture sites for three to five years. These small forests are intended to support biodiversity and restore our relationship with the living world.'),
      ],
      pillars: [
        { icon: Sprout, title: c('oneness-work-1', 'Plant with purpose'), text: c('oneness-detail-1', 'Clusters of trees create the foundations of micro forests across participating sites.') },
        { icon: HandHeart, title: c('oneness-work-2', 'Stay for the growing years'), text: c('oneness-detail-2', 'A three-to-five-year care commitment gives young saplings attention beyond planting day.') },
        { icon: Trees, title: c('oneness-work-3', 'Make room for nature'), text: c('oneness-detail-3', 'Growing forests aim to support biodiversity, environmental balance and greener shared spaces.') },
      ],
      impactTitle: c('oneness-impact', 'A growing commitment to the Earth.'),
      impactNote: c('oneness-note', 'Planting and reach are shown alongside land area. Square feet, acres and hectares describe the same footprint in different units.'),
      groups: [ { title: c('oneness-network', 'The growing network'), points: [0, 1, 5] }, { title: c('oneness-footprint', 'The land, in three measures'), points: [2, 3, 4] } ],
      source: getCMSLink('copy.Link.ProjectStories.oneness', 'https://nirankarifoundation.org/oneness-vann/'),
    },
    watershed: {
      title: c('watershed-title', 'When water stays, possibility grows.'),
      paragraphs: [
        c('watershed-story', 'In water-stressed communities in Maharashtra, reliable water shapes daily life and the farming year. The Watershed Programme connects water conservation with practical support for rural livelihoods.'),
        c('watershed-context', 'Work includes water-retaining structures, well repair and cleaning, and solar water pumps. Alongside this, saplings, training and marketing support help communities explore horticulture and floriculture as sources of income.'),
      ],
      pillars: [
        { icon: Mountain, title: c('watershed-work-1', 'Retain the rain'), text: c('watershed-detail-1', 'Water-retaining structures support groundwater recharge and the landscape around village water sources.') },
        { icon: Droplets, title: c('watershed-work-2', 'Strengthen local access'), text: c('watershed-detail-2', 'Well maintenance and water infrastructure address the practical needs of rural communities.') },
        { icon: Sprout, title: c('watershed-work-3', 'Support the growing season'), text: c('watershed-detail-3', 'Planting material, training and livelihood support connect water conservation with local agriculture.') },
      ],
      impactTitle: c('watershed-impact', 'Water that serves whole communities.'),
      impactNote: c('watershed-note', 'The reported reach brings together people, hamlets and gram panchayats. Each measure describes a different part of the programme.'),
      groups: [{ title: c('watershed-reach', 'Community reach'), points: [0, 1, 2] }],
      source: getCMSLink('copy.Link.ProjectStories.watershed', 'https://nirankarifoundation.org/watershed-program/'),
    },
    'adopted-villages': {
      title: c('villages-title', 'Care that becomes part of village life.'),
      paragraphs: [
        c('villages-story', 'Strong communities need opportunities to learn, access to care and a healthy place to live. The adopted-villages programme brings these needs together through sustained local service.'),
        c('villages-context', 'This report covers Patti Kalyana, Bhodwal Majri, Panchi Gujran and Mandaura in Haryana. School support, health and eye camps, sewing centres and environmental work address different stages of family and community life.'),
      ],
      pillars: [
        { icon: School, title: c('villages-work-1', 'Learning and livelihoods'), text: c('villages-detail-1', 'Support for schools and skill development places education and practical opportunity close to home.') },
        { icon: Stethoscope, title: c('villages-work-2', 'Care within reach'), text: c('villages-detail-2', 'Health and eye camps bring attention to the wellbeing of village residents.') },
        { icon: Leaf, title: c('villages-work-3', 'A healthier shared home'), text: c('villages-detail-3', 'Planting, sanitation and environmental care support the places where families live and children grow.') },
      ],
      impactTitle: c('villages-impact', 'One community. Many ways to care.'),
      impactNote: c('villages-note', 'Overview reach and village-level figures have different scopes. Population, beneficiaries and student measures are shown separately and should not be added together.'),
      groups: [
        { title: c('villages-reach', 'People and places'), points: [0, 1, 4, 5] },
        { title: c('villages-learning', 'Education and skills'), points: [2, 3, 8, 9] },
        { title: c('villages-health', 'Health and wellbeing'), points: [6, 7] },
        { title: c('villages-green', 'A greener neighbourhood'), points: [10, 11] },
      ],
      source: getCMSLink('copy.Link.ProjectStories.villages', 'https://nirankarifoundation.org/adopted-villages/'),
    },
    'health-city': {
      title: c('health-title', 'Medical expertise. A human connection.'),
      paragraphs: [
        c('health-story', 'Sant Nirankari Health City in North Delhi is being developed to bring preventive and curative healthcare together, with affordability and holistic wellbeing at the heart of its vision.'),
        c('health-context', 'OPD services have started as an early milestone. The wider campus brings a multi-specialty vision to care, while the hospital’s own website provides current information about departments, appointments and services.'),
      ],
      pillars: [
        { icon: Stethoscope, title: c('health-work-1', 'Begin with a consultation'), text: c('health-detail-1', 'Outpatient services offer an entry point to the hospital and its clinical teams.') },
        { icon: HeartPulse, title: c('health-work-2', 'Care across specialties'), text: c('health-detail-2', 'The hospital lists departments including cardiology, ophthalmology, paediatrics and orthopaedics.') },
        { icon: HandHeart, title: c('health-work-3', 'Keep people at the centre'), text: c('health-detail-3', 'The campus vision combines medical infrastructure with spaces and services designed around patients and families.') },
      ],
      impactTitle: c('health-impact', 'Building capacity for compassionate care.'),
      impactNote: c('health-note', 'These are the hospital’s published campus, phase and staffing figures. They describe scale and capacity, rather than patient activity or currently available beds.'),
      groups: [{ title: c('health-capacity', 'The campus at a glance'), points: [0, 1, 2, 3] }],
      source: getCMSLink('copy.Link.ProjectStories.health', 'https://nirankarihealthcity.org/'),
    },
  };
  return stories[id];
}
