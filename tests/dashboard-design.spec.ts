import { test, expect } from '@playwright/test';
test('dashboard summaries, filters, report export and responsive design', async({page})=>{
 await page.goto('/auth/login');
 await page.getByLabel('Email address').fill('admin@demo.plp.test');
 await page.getByLabel('Password',{exact:true}).fill('PlpDemo2026!');
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page).toHaveURL(/\/hub$/);
 await expect(page.locator('.plp-dashboard')).toBeVisible();
 await page.screenshot({path:'/tmp/plp-dashboard-overview.png'});
 await page.goto('/certificate-centre');
 await expect(page.getByRole('heading',{name:'Certificate requests & approvals'})).toBeVisible();
 await page.getByRole('button',{name:/^Approved/}).click();
 await expect(page.getByLabel('Certificate status')).toHaveValue('Approved');
 await page.getByRole('button',{name:/^All/}).click();
 await page.screenshot({path:'/tmp/plp-dashboard-certificates.png'});
 await page.goto('/clubs');
 await expect(page.getByLabel('Activity title',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Activity archive'}).click();
 await expect(page.getByLabel('Activity period')).toHaveValue('Past');
 await page.screenshot({path:'/tmp/plp-dashboard-activities.png'});
 await page.goto('/hub-analytics');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download report'}).click();
 expect((await download).suggestedFilename()).toBe('plp-activity-report.csv');
 await page.screenshot({path:'/tmp/plp-dashboard-reports.png'});
 await page.setViewportSize({width:390,height:844});
 for(const route of ['/hub','/clubs','/certificate-centre','/learning-materials','/studio','/hub-analytics']){
  await page.goto(route);await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await page.screenshot({path:'/tmp/plp-dashboard-mobile.png'});
});
