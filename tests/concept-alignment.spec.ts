import { test, expect, type Page } from '@playwright/test';
async function login(page:Page,role:string){await page.goto('/auth/login');await page.getByLabel('Email address').fill(`${role}@demo.plp.test`);await page.getByLabel('Password',{exact:true}).fill('PlpDemo2026!');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/hub$/);}
test('member navigation exposes the director modules and focuses on learning',async({page})=>{
 await login(page,'member');const nav=page.getByRole('navigation',{name:'Hub navigation',exact:true});
 for(const name of ['Learning academy','ALX learning zone','Opportunities','Mentorship','Clubs & communities','My achievements','PLP credits','Youth passport'])await expect(nav.getByRole('link',{name,exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'My learning journey'})).toBeVisible();await expect(page.getByRole('heading',{name:'School certificate requests'})).toHaveCount(0);
 await nav.getByRole('link',{name:'My achievements'}).click();await expect(page.getByText('Course achievements are awarded automatically',{exact:false})).toBeVisible();
});
test('trainers have teaching metrics and no certificate queue',async({page})=>{
 await login(page,'trainer');await expect(page.getByRole('heading',{name:'Teaching overview'})).toBeVisible();await expect(page.getByRole('heading',{name:'Your teaching portfolio'})).toBeVisible();await expect(page.getByRole('navigation',{name:'Hub navigation',exact:true}).getByRole('link',{name:/certificate/i})).toHaveCount(0);await page.getByRole('link',{name:/^Assignments Read work/}).click();await expect(page).toHaveURL(/tab=Assignments/);
});
test('student and university signup preserve member category without staff approval',async({page})=>{
 for(const [category,role] of [['High school','Student member'],['University','University member']]){
  await page.goto('/auth/signup');await page.getByLabel('Full name').fill(`${category} Learner`);await page.getByLabel('Email address').fill(`${category.replace(' ','')}@example.test`);await page.getByLabel('Password',{exact:true}).fill('Testing123!');await page.getByLabel('Confirm password',{exact:true}).fill('Testing123!');await page.getByLabel('Member category').selectOption(category);await page.getByRole('button',{name:'Create account',exact:true}).click();await expect(page).toHaveURL(/\/hub$/);await expect(page.getByText(`DISCOVER & DEVELOP · ${role}`,{exact:true})).toBeVisible();await page.getByRole('button',{name:'Sign out',exact:true}).filter({visible:true}).click();
 }
});

test('signup category appears only for members and back arrow opens the website', async ({page}) => {
 await page.goto('/auth/signup');
 await expect(page.getByLabel('Member category')).toBeVisible();
 for (const role of ['Trainer','Club leader']) {
  await page.getByLabel('Account type').selectOption(role);
  await expect(page.getByLabel('Member category')).toHaveCount(0);
 }
 await page.getByLabel('Account type').selectOption('Member');
 await expect(page.getByLabel('Member category')).toBeVisible();
 await page.getByRole('link',{name:'Back to website',exact:true}).click();
 await expect(page).toHaveURL(/\/$/);
});
