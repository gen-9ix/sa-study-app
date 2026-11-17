const { chromium, devices } = await import(process.env.PW || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
// 1) export a backup from the Claude build
const p1 = await (await browser.newContext({ ...devices['iPhone 13'] })).newPage();
await p1.goto(process.env.SA_DIST); await p1.waitForTimeout(300);
await p1.fill('#pname','郡妤'); await p1.click('[data-act=profnew]'); await p1.waitForTimeout(300);
const code = await p1.evaluate(()=>{ grade('net.arp.0',2); grade('fs.umask.0',0); S.xp=777; S.set.pet='ghost'; S.set.t=Date.now(); save(); return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); });
// 2) standalone build over http (PWA)
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage(); const errs=[]; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
await page.goto(process.env.SA_URL); await page.waitForTimeout(800);
console.log('standalone first view:', await page.evaluate(()=>VIEW.name+' flag='+window.SA_STANDALONE));
console.log('manifest/sw:', await page.evaluate(async()=>{ const m=await (await fetch('manifest.webmanifest')).json(); const r=await navigator.serviceWorker.getRegistration(); return m.display+' sw='+!!r; }));
await page.screenshot({ path:'/tmp/sa_80_sa_who.png' });
await page.fill('#pname','郡妤'); await page.click('[data-act=profnew]'); await page.waitForTimeout(400);
await page.click('[data-act=hub]'); await page.click('[data-act=go][data-v=settings]'); await page.waitForTimeout(150);
await page.screenshot({ path:'/tmp/sa_81_sa_settings.png', fullPage:true });
await page.click('[data-act=importui]'); await page.fill('#imp', code); await page.click('[data-act=importgo]'); await page.waitForTimeout(200);
console.log('after import:', await page.evaluate(()=>`xp=${S.xp} q=${Object.keys(S.q).join(',')} pet=${curPet()}`));
await page.reload(); await page.waitForTimeout(800);
console.log('after reload:', await page.evaluate(()=>`view=${VIEW.name} cur=${curProf()?.name} xp=${S.xp}`));
// offline
await ctx.setOffline(true); await page.reload(); await page.waitForTimeout(800);
console.log('offline reload:', await page.evaluate(()=>`view=${VIEW.name} q=${QLIST.length}`));
console.log(errs.filter(e=>!/fonts|ERR_INTERNET_DISCONNECTED|status of 403/.test(e)).join('\n')||'NO ERRORS'); await browser.close();
