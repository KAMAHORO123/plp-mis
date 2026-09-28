import { test, expect, type Page } from '@playwright/test';
async function login(page:Page, role:string) {
 await page.goto('/sign-in');
 await page.getByLabel('Email address').fill(`${role}@demo.plp.test`);
 await page.getByLabel('Password',{exact:true}).fill('PlpDemo2026!');
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page).toHaveURL(/\/hub$/);
}
async function logout(page:Page){await page.getByRole('button',{name:'Sign out',exact:true}).filter({visible:true}).click();}
test('all role demo credentials open dedicated dashboards',async({page})=>{
 const cases=[['member','My learning journey'],['coordinator','School club overview'],['trainer','Teaching overview'],['admin','Platform overview']];
 for(const [role,title] of cases){await login(page,role);await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();await page.screenshot({path:`/tmp/plp-${role}-dashboard.png`,fullPage:true});await logout(page);}
});
test('signup never grants staff access and school scope is enforced',async({page})=>{
 await page.goto('/join');await page.getByLabel('Full name').fill('Staff Applicant');await page.getByLabel('Email address').fill('staff@example.test');await page.getByLabel('Password',{exact:true}).fill('Testing123!');await page.getByLabel('Confirm password',{exact:true}).fill('Testing123!');await page.getByLabel('Account type').selectOption('School coordinator');await page.getByLabel('School (if applicable)').fill('Huye Secondary School (demo)');await page.getByRole('button',{name:'Create account',exact:true}).click();await expect(page).toHaveURL(/\/hub$/);await expect(page.getByText('You requested School coordinator access.',{exact:false})).toBeVisible();await page.goto('/school-members');await expect(page.getByRole('heading',{name:'This workspace isn’t part of your role.'})).toBeVisible();await logout(page);
 await login(page,'coordinator');await page.goto('/hub-analytics');await expect(page.getByRole('heading',{name:'This workspace isn’t part of your role.'})).toBeVisible();await page.goto('/school-members');await expect(page.getByRole('heading',{name:'Kigali Secondary School (demo)'})).toBeVisible();await expect(page.getByLabel('School',{exact:true})).toHaveCount(0);
});
test('help chat and mobile dashboards work without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await login(page,'coordinator');for(const path of ['/hub','/school-members','/certificate-centre']){await page.goto(path);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();}await page.goto('/');await page.getByRole('button',{name:'Need a hand?'}).click();await page.getByRole('button',{name:'How do I get a certificate?'}).click();await expect(page.getByRole('log')).toContainText('Academy course certificates are awarded automatically');await page.getByLabel('Ask PLP help').fill('weather tomorrow');await page.getByRole('button',{name:'Send question'}).click();await expect(page.getByRole('log')).toContainText('For other questions');await page.screenshot({path:'/tmp/plp-school-mobile.png',fullPage:true});
});
