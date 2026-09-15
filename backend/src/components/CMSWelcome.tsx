import React from 'react'
export function CMSWelcome(){return <section className="sncf-studio-welcome">
  <p className="sncf-studio-welcome__eyebrow">SANT NIRANKARI CHARITABLE FOUNDATION</p>
  <h1>Content Studio</h1>
  <p>Edit the story, shape the pavilion, and keep every figure current.</p>
  <div className="sncf-studio-welcome__links">
    <a href="/admin/collections/activities">Activities & figures <span>→</span></a>
    <a href="/admin/collections/media">Media library <span>→</span></a>
    <a href="/admin/globals/pavilion-settings">Pavilion design <span>→</span></a>
    <a href="/admin/collections/content-slots">Website text <span>→</span></a>
  </div>
  <p className="sncf-studio-welcome__note">Save a draft while you work. Editors publish approved changes; the website picks them up automatically. Existing content stays available if the CMS is offline.</p>
</section>}
