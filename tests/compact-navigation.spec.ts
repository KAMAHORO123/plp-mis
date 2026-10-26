import {test,expect} from '@playwright/test';
test('navigation collapses while banner remains pinned',async({page})=>{
 for(const width of [1440,390]){
 await page.setViewportSize({width,height:900});await page.goto('/');
 const shell=page.locator('.plp-sticky-navigation');await expect(shell).not.toHaveClass(/is-compact/);
 await page.evaluate(()=>window.scrollTo(0,700));await expect(shell).toHaveClass(/is-compact/);
 await expect.poll(()=>page.locator('.plp-sticky-navigation>.hub-header').evaluate(el=>Math.round(el.getBoundingClientRect().width))).toBe(width);
 await expect.poll(()=>page.evaluate(()=>{const nav=document.querySelector('.plp-sticky-navigation>.hub-header')!.getBoundingClientRect();const banner=document.querySelector('.plp-announcement')!.getBoundingClientRect();return Math.round(nav.top-banner.bottom);})).toBe(0);
 await expect.poll(()=>page.getByRole('complementary',{name:'Upcoming event'}).evaluate(el=>Math.round(el.getBoundingClientRect().top))).toBe(0);
 await page.getByRole('button',{name:'Open navigation',exact:true}).click();await expect(page.getByRole('navigation',{name:'Mobile navigation'})).toBeVisible();
 await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'PLP Canada',exact:true}).click();await expect(page).toHaveURL(/plp-canada/);await expect(shell).not.toHaveClass(/is-compact/);
 }
});
