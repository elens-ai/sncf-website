import React from 'react'

const TASKS = [
  { href: '/admin/collections/activities', title: 'Programme figures & photos', body: 'Update a programme’s numbers, hover photos, icon or Core Values card.' },
  { href: '/admin/collections/content-slots?where[page][equals]=home', title: 'Text on a page', body: 'Headings, sentences and buttons. Filter by page or search for the words.' },
  { href: '/admin/collections/gallery-items', title: 'Gallery & pillar photos', body: 'The five photos of each pillar, and the photo galleries on each page.' },
  { href: '/admin/collections/asset-slots', title: 'Logos & design images', body: 'Portraits, logos and artwork built into the page design.' },
  { href: '/admin/globals/site-settings', title: 'Menu, footer & contact', body: 'Main menu, footer links, social links, contact details and logo.' },
  { href: '/admin/collections/media', title: 'Upload to the library', body: 'Add photos, films and 3D models, then choose them anywhere.' },
  { href: '/admin/collections/events', title: 'Events', body: 'Annual observances and ongoing programmes.' },
  { href: '/admin/collections/component-settings', title: 'Show or hide sections', body: 'Turn whole sections on or off, and order the home page.' },
]

/** Task-first start page: editors arrive wanting to change something specific. */
export function CMSWelcome() {
  return <section className="sncf-studio-welcome">
    <p className="sncf-studio-welcome__eyebrow">SANT NIRANKARI CHARITABLE FOUNDATION</p>
    <h1>Content Studio</h1>
    <p>What would you like to change?</p>
    <div className="sncf-studio-welcome__links">
      {TASKS.map(task => <a key={task.href} href={task.href}><strong>{task.title} <span aria-hidden="true">→</span></strong><small>{task.body}</small></a>)}
    </div>
    <p className="sncf-studio-welcome__note">Changes save as a draft while you work. Use <strong>Live preview</strong> to see them on the page, then <strong>Publish</strong> (editors) — the website updates within a minute. If the studio is ever offline, the website keeps showing what was last published.</p>
  </section>
}
