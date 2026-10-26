import {test,expect} from '@playwright/test';
test.use({hasTouch:true,isMobile:true});
test('public pages fit phones and landscape, navigation and gallery are usable',async({page})=>{
 test.setTimeout(90000);
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const [width,height] of [[320,568],[390,844],[430,932],[844,390]]){
  await page.setViewportSize({width,height});
  for(const route of ['/','/plp-hub','/plp-canada','/album','/programmes','/about','/stories']){
   await page.goto(route);
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),{message:`${route} at ${width}px`}).toBe(true);
  }
 }
 await page.setViewportSize({width:320,height:568});await page.goto('/');
 await page.getByRole('button',{name:/Open navigation|Toggle navigation|Open menu/}).click();
 await page.getByRole('navigation',{name:'Mobile navigation',exact:true}).getByRole('link',{name:'PLP Canada',exact:true}).click();
 await expect(page).toHaveURL(/plp-canada$/);
 await page.getByRole('button',{name:'Enlarge PLP Canada community photo'}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 const box=await dialog.boundingBox();expect(box!.width).toBeLessThanOrEqual(320);expect(box!.height).toBeLessThanOrEqual(568);
 await page.getByRole('button',{name:'Next Canada photo'}).click();
 await expect(dialog.locator('img')).toHaveAttribute('src',/peace-signs-hd/);
 await page.getByRole('button',{name:'Close photo'}).click();await expect(dialog).not.toBeVisible();
 await page.goto('/');await expect(page.locator('.plp-reel')).toHaveCSS('overflow-x','auto');
 await page.locator('.plp-reel').evaluate(e=>{e.scrollLeft=240;});
 await expect.poll(()=>page.locator('.plp-reel').evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
 await page.goto('/plp-hub');await page.screenshot({path:'/tmp/plp-phone-hub.png',fullPage:true});
});
