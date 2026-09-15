import { useNavigate } from 'react-router-dom';
import { ContributionDialog } from '../components/ContributionDialog';
import { PageShell } from '../components/PageShell';

export default function ContributionPage() {
  const navigate = useNavigate();
  return <PageShell accentPillarId="heal" title="Contribute" eyebrow="Service with humility" standfirst="A gesture of generosity. A world of difference."><ContributionDialog onClose={() => navigate('/donate', { replace: true })}/></PageShell>;
}
