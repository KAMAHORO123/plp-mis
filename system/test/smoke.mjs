if(!process.env.TEST_DATABASE_URL||!new URL(process.env.TEST_DATABASE_URL).pathname.endsWith('_test'))throw Error('TEST_DATABASE_URL must point to a dedicated _test database');
process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {chromium} from '@playwright/test';
import {createServer} from '../../services/platform/src/server.mjs';
import {connectDatabase} from '../../services/platform/src/db.mjs';
import {hashPassword} from '../../services/platform/src/auth.mjs';
const db=connectDatabase(),origin='http://127.0.0.1:5176';
const api=createServer({db,origin,secure:false,credentialUrl:'http://127.0.0.1:8083'});
await new Promise(r=>api.listen(8084,'127.0.0.1',r));
const vite=spawn(process.execPath,['system/node_modules/vite/bin/vite.js','--config','system/vite.config.ts','--host','127.0.0.1','--port','5176','system'],{env:{...process.env,PLATFORM_DEV_URL:'http://127.0.0.1:8084'},stdio:'ignore'});
let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const id=randomUUID(),email=`browser-${id}@example.test`,password='Browser-test-password-42';
 await db.query("INSERT INTO users(id,email,name,password_hash,role,status) VALUES($1,$2,'Browser Test',$3,'admin','approved')",[id,email,await hashPassword(password)]);
 browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{}),headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin);await page.getByLabel('Email address').fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('heading',{name:'Overview',exact:true}).waitFor();await page.getByRole('button',{name:'Toggle menu'}).click();await page.getByRole('button',{name:'Events',exact:true}).click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.getByRole('button',{name:'Create record'}).click();await page.getByLabel('Title',{exact:true}).fill('Community peace workshop '+id);await page.getByLabel('Description').fill('A browser test event');await page.getByLabel('Date',{exact:true}).fill('2026-12-20');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('heading',{name:'Community peace workshop '+id}).waitFor();
 await page.getByRole('button',{name:'Edit Community peace workshop '+id}).click();await page.getByLabel('Title',{exact:true}).fill('Updated peace workshop '+id);await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('heading',{name:'Updated peace workshop '+id}).waitFor();
 await page.getByRole('button',{name:'Toggle menu'}).click();await page.getByRole('button',{name:'Website banner',exact:true}).click();await page.getByLabel('title',{exact:true}).fill('Community dialogue');await page.getByLabel('date',{exact:true}).fill('2026-12-20');await page.getByLabel('location',{exact:true}).fill('Kigali');await page.getByLabel('href',{exact:true}).fill('https://example.org/event');await page.getByLabel('linkLabel',{exact:true}).fill('Explore event');await page.getByLabel('Show banner').check();await page.getByRole('button',{name:'Save announcement'}).click();await page.getByRole('status').filter({hasText:'Announcement saved.'}).waitFor();
 const announcement=await (await fetch('http://127.0.0.1:8084/public/announcement')).json();assert.equal(announcement.title,'Community dialogue');
 await page.getByRole('button',{name:'Toggle menu'}).click();await page.getByRole('button',{name:'Certificates',exact:true}).click();await page.locator('select[name=member]').selectOption(id);await page.getByLabel('Programme',{exact:true}).fill('Browser verified programme '+id);await page.getByRole('button',{name:'Issue certificate',exact:true}).click();await page.getByRole('heading',{name:'Browser verified programme '+id}).waitFor();
 const card=page.locator('article').filter({has:page.getByRole('heading',{name:'Browser verified programme '+id})});const download=page.waitForEvent('download');await card.getByRole('link',{name:'Download PDF'}).click();assert.equal(await (await download).failure(),null);
 const verify=await card.getByRole('link',{name:'View verification'}).getAttribute('href');const anonymous=await browser.newContext();const publicPage=await anonymous.newPage();await publicPage.goto(origin+verify);await publicPage.getByRole('heading',{name:'Certificate verified',exact:true}).waitFor();
 await page.screenshot({path:'/tmp/plp-system-mobile.png',fullPage:true});assert.deepEqual(errors,[]);console.log('PASS: mobile sign-in, create/update, announcement, certificate download, anonymous verification');
}finally{await browser?.close();vite.kill('SIGTERM');api.closeAllConnections();await new Promise(r=>api.close(r));await db.end();}
