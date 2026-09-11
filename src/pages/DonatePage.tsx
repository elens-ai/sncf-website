import React from 'react';
import { PageShell } from '../components/PageShell';
import { DonationExperience } from '../components/DonationExperience';

export default function DonatePage() {
  return <PageShell accentPillarId="heal" eyebrow="Contribute" title="Make a difference" standfirst="Service with humility."
    cover={<div className="donation-page"><DonationExperience page /></div>}>{null}</PageShell>;
}
