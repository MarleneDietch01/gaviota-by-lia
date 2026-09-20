import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const dir='artifacts/design-audit-2026-09-20';
const browser=await chromium.launch();
const results=[];
for(const [name,width,height,route] of [['home-desktop',1440,900,'/es'],['home-tablet',768,1024,'/es'],['shop-mobile',390,844,'/es/shop'],['product-mobile',390,844,'/es/products/aceite-anti-estrias'],['product-desktop',1440,900,'/es/products/aceite-anti-estrias']]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:3000'+route,{waitUntil:'domcontentloaded'});
 await page.addStyleTag({content:'html {scroll-behavior:auto!important} nextjs-portal {display:none!important}'});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(1800); if(await page.locator('dialog[open]').count()) await page.getByRole('button',{name:'Cerrar la oferta'}).click();
 await page.screenshot({path:dir+'/'+name+'-fold.jpg',quality:85});
 const data=await page.evaluate(()=>({height:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth-innerWidth,headings:[...document.querySelectorAll('main h1,main h2')].map(x=>({text:x.textContent,y:Math.round(x.getBoundingClientRect().top+scrollY)})),cards:[...document.querySelectorAll('#collection li')].map(x=>({y:Math.round(x.getBoundingClientRect().y),width:Math.round(x.getBoundingClientRect().width)})),sections:[...document.querySelectorAll('main section')].map(x=>({heading:x.querySelector('h2,h1')?.textContent,y:Math.round(x.getBoundingClientRect().top+scrollY),height:Math.round(x.getBoundingClientRect().height)}))}));
 results.push({name,...data});
 for(let y=0;y<data.height;y+=height){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(70);}
 await page.waitForTimeout(1200);
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:dir+'/'+name+'-full.jpg',fullPage:true,quality:75,timeout:15000});
 console.log(name,JSON.stringify(data));
 if(name==='product-mobile'){
  console.log('buttons',await page.getByRole('button').allTextContents());
  const add=page.getByRole('button',{name:/Añadir.*bolsa/i}).first();
  if(await add.count()) {await add.click();await page.goto('http://127.0.0.1:3000/es/cart',{waitUntil:'domcontentloaded'});await page.waitForTimeout(1200);await page.screenshot({path:dir+'/cart-mobile.jpg',fullPage:true,quality:85});console.log('cart',await page.locator('main').innerText());}
 }
 await page.close();
}
await writeFile(dir+'/measurements.json',JSON.stringify(results,null,2));
await browser.close();

