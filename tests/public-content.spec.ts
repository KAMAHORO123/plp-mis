import {test,expect,type Page} from '@playwright/test';
async function login(page:Page,role:string){await page.goto('/auth/login');await page.getByLabel('Email address').fill(`${role}@demo.plp.test`);await page.getByLabel('Password',{exact:true}).fill('PlpDemo2026!');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/hub$/);}
test('public sections, gallery filters, lightbox and mobile layout',async({page})=>{
 await page.goto('/');await expect(page.locator('.plp-side-left img')).toHaveAttribute('src','/images/plp/icyeza-home-hd.png');await expect(page.getByRole('complementary',{name:'Upcoming event'})).not.toContainText('Sample');
 await page.getByRole('button',{name:'Next testimonial'}).click();await expect(page.getByText('Eric Ndayisaba',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Next quote'}).click();await expect(page.locator('.plp-quote-card blockquote')).toHaveText('Forgiveness is all I have to give.');
 await expect(page.locator('#plp-album')).toHaveCount(0);await expect(page.locator('.plp-footer-wordmark')).toHaveCount(0);await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'PLP album',exact:true}).click();await expect(page).toHaveURL(/\/album$/);await page.getByRole('button',{name:'Camp diaries',exact:true}).click();await expect(page.locator('.plp-album-grid article')).toHaveCount(1);
 await page.getByRole('button',{name:'Enlarge Camp diaries photo 1',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.getByRole('button',{name:'All moments',exact:true}).click();await expect(page.locator('.plp-album-grid article')).toHaveCount(4);
 for(const image of await page.locator('.plp-album-pair img').all()) await image.scrollIntoViewIfNeeded();await expect.poll(()=>page.locator('.plp-album-pair img').evaluateAll(imgs=>imgs.every(i=>(i as HTMLImageElement).complete&&(i as HTMLImageElement).naturalWidth>0))).toBe(true);
 await page.screenshot({path:'/tmp/plp-public-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:'/tmp/plp-public-mobile.png',fullPage:true});
 await page.goto('/plp-hub');await expect(page.getByRole('heading',{name:'A place to learn. A community to grow with.'})).toBeVisible();await page.goto('/programmes');await expect(page.getByText('Sober Campaign',{exact:true})).toBeVisible();
});
test('administrator updates banner, rejects unsafe link, and hides it',async({page})=>{
 await login(page,'admin');await page.getByRole('link',{name:'Website banner',exact:true}).click();
 await page.getByLabel('Event title',{exact:true}).fill('PLP community day');await page.getByLabel('Event date',{exact:true}).fill('2099-11-14');await page.getByLabel('Hide on the live website (test event)').uncheck();
 await page.getByLabel('Event link',{exact:true}).fill('javascript:alert(1)');await page.getByRole('button',{name:'Save announcement'}).click();await expect(page.getByText('Enter a title, link label, and a local path or HTTPS link.')).toBeVisible();
 await page.getByLabel('Event link',{exact:true}).fill('/programmes#wellness');await page.getByRole('button',{name:'Save announcement'}).click();await expect(page.getByText('Website announcement saved')).toBeVisible();
 await page.goto('/');await page.reload();const banner=page.getByRole('complementary',{name:'Upcoming event'});await expect(banner).toContainText('PLP community day');await expect(banner).toContainText('14 Nov 2099');await expect(banner).not.toContainText('Sample ·');
 await page.goto('/studio?tab=Website%20banner');await page.getByLabel('Show announcement').uncheck();await page.getByRole('button',{name:'Save announcement'}).click();await page.goto('/');await expect(banner).toHaveCount(0);
 await page.goto('/hub');await page.getByRole('button',{name:'Sign out',exact:true}).filter({visible:true}).click();await login(page,'trainer');await page.goto('/studio?tab=Website%20banner');await expect(page.getByRole('button',{name:'Save announcement'})).toHaveCount(0);
});
test('expired announcements are not shown',async({page})=>{
 await login(page,'admin');await page.goto('/studio?tab=Website%20banner');await page.getByLabel('Show announcement').uncheck();await page.getByLabel('Event date',{exact:true}).fill('2020-01-01');await page.getByRole('button',{name:'Save announcement'}).click();
 await page.getByLabel('Show announcement').check();await page.getByRole('button',{name:'Save announcement'}).click();await expect(page.getByText('Choose today or a future date for an active banner.')).toBeVisible();
 await page.goto('/');await expect(page.getByRole('complementary',{name:'Upcoming event'})).toHaveCount(0);
});
test('sliding announcement pauses and respects reduced motion',async({page})=>{
 await page.goto('/');const banner=page.getByRole('complementary',{name:'Upcoming event'});
 await banner.getByRole('button',{name:'Pause announcement'}).click();
 await expect(banner.locator('.plp-announcement-track')).toHaveCSS('animation-play-state','paused');
 await banner.screenshot({path:'/tmp/plp-imigongo-desktop.png'});
 await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await banner.screenshot({path:'/tmp/plp-imigongo-mobile.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await expect(banner.locator('.plp-announcement-track')).toHaveCSS('animation-name','none');
 await expect(banner.getByRole('link')).toBeVisible();
});
test('Canada uses all five supplied photos with an accessible gallery',async({page})=>{
 await page.goto('/plp-canada');
 await expect(page.locator('.plp-canada-lead img')).toBeVisible();
 await page.locator('.plp-canada-gallery').scrollIntoViewIfNeeded();
 await expect(page.locator('.plp-canada-gallery img')).toHaveCount(4);
 await expect.poll(()=>page.locator('.plp-canada-gallery img,.plp-canada-feature img').evaluateAll(imgs=>imgs.every(i=>(i as HTMLImageElement).complete&&(i as HTMLImageElement).naturalWidth>900))).toBe(true);
 await page.getByRole('button',{name:'Enlarge Peace, love & friendship'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('button',{name:'Next Canada photo'}).click();
 await expect(page.getByRole('dialog').locator('img')).toHaveAttribute('src',/welcome-desk/);
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.screenshot({path:'/tmp/plp-canada-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:'/tmp/plp-canada-mobile.png',fullPage:true});
});

test('homepage portrait is loaded and uncropped on desktop and mobile',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');const photo=page.locator('.plp-side-left img');
 await expect.poll(()=>photo.evaluate(i=>(i as HTMLImageElement).naturalHeight)).toBeGreaterThan(1080);
 await expect(photo).toHaveCSS('object-fit','contain');
 await photo.scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/plp-home-photo-desktop.png'});
 await page.setViewportSize({width:390,height:844});await photo.scrollIntoViewIfNeeded();
 await expect(photo).toHaveCSS('object-fit','contain');
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:'/tmp/plp-home-photo-mobile.png'});
});
test('restored photo reel links to album and creative Hub fits mobile',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.poster-0 img')).toHaveAttribute('src','/images/plp/plp-walk.webp');
 await expect(page.locator('.plp-side-right img')).toHaveAttribute('src','/images/plp/plp-remembrance.webp');
 await page.getByRole('button',{name:'Pause photo reel'}).click();
 await expect(page.locator('.plp-reel-track')).toHaveCSS('animation-play-state','paused');
 await page.locator('#pathways').screenshot({path:'/tmp/plp-pathways-creative.png'});
 await page.getByRole('link',{name:'Explore the PLP album',exact:true}).click();await expect(page).toHaveURL(/\/album$/);
 await page.goto('/plp-hub');await page.screenshot({path:'/tmp/plp-hub-creative-desktop.png',fullPage:true});
 await expect(page.locator('.plp-hub-overview article')).toHaveCount(4);
 await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:'/tmp/plp-hub-creative-mobile.png',fullPage:true});
 await page.getByRole('link',{name:'Explore learning',exact:true}).click();await expect(page).toHaveURL(/\/courses$/);
});
test('album viewing stays on the website with keyboard and button navigation',async({page})=>{
 await page.goto('/album');
 await expect(page.locator('#plp-album a[href*="drive.google.com"]')).toHaveCount(0);
 await page.getByRole('button',{name:'View PLP Academy 2024 photos'}).click();
 const dialog=page.getByRole('dialog',{name:'PLP album photo viewer'});
 await expect(dialog).toBeVisible();await expect(dialog.locator('img')).toHaveAttribute('src',/academy-2/);
 await page.getByRole('button',{name:'Next album photo'}).click();await expect(dialog.locator('img')).toHaveAttribute('src',/academy-1/);
 await page.keyboard.press('ArrowLeft');await expect(dialog.locator('img')).toHaveAttribute('src',/academy-2/);
 await page.getByRole('button',{name:'Close photo'}).click();await expect(dialog).not.toBeVisible();await expect(page).toHaveURL(/\/album$/);
});

test('trivia scores once, reveals explanations, completes and resets',async({page})=>{
 await page.goto('/');const corner=page.locator('#fun-corner');
 for(const [index,label] of ['Listen to both people without interrupting','1 July 1962','1994','7 April','It can fuel discrimination and contribute to atrocities','A dialogue where everyone can share respectfully','21 September','By recognising warning signs and rejecting dehumanisation'].entries()){
  await corner.getByRole('button',{name:new RegExp(label)}).click();
  await expect(corner.getByText('That’s correct.',{exact:true})).toBeVisible();
  for(const option of await corner.locator('.plp-trivia-options button').all()) await expect(option).toBeDisabled();
  await corner.getByRole('button',{name:index===7?'See my score':'Next question',exact:true}).click();
 }
 await expect(corner.getByRole('heading',{name:'You scored 8 / 8!'})).toBeVisible();
 await corner.getByRole('button',{name:'Review again'}).click();
 await corner.getByRole('button',{name:/Choose a side immediately/}).click();await expect(corner.getByText('Let’s learn more.',{exact:true})).toBeVisible();
 await expect(corner.locator('.is-correct')).toContainText('Listen to both people without interrupting');
 await page.setViewportSize({width:320,height:640});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await corner.screenshot({path:'/tmp/plp-trivia-mobile.png'});
});
test('each album has ten distinct working local photographs',async({page})=>{
 await page.goto('/album');const images=page.locator('.plp-album-pair img');await expect(images).toHaveCount(40);
 const sources=await images.evaluateAll(items=>items.map(i=>i.getAttribute('src')));expect(new Set(sources).size).toBe(40);
 for(const src of sources){const response=await page.request.get(src!);expect(response.ok()).toBeTruthy();expect(response.headers()['content-type']).toContain('image/jpeg');}
 for(const article of await page.locator('.plp-album-grid article').all())await expect(article.locator('img')).toHaveCount(10);
 await page.getByRole('button',{name:'Enlarge Camp diaries photo 10',exact:true}).click();await expect(page.getByRole('dialog').locator('img')).toHaveAttribute('src','/images/plp/albums/camp-10.jpg');
});
