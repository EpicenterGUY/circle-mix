'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
function startServer(root){
  const base=path.resolve(root);
  const server=http.createServer((req,res)=>{
    try{
      const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
      const relative=pathname==='/'?'editor.html':pathname.replace(/^\/+/, '');
      const file=path.resolve(base,relative);
      if(file!==base&&!file.startsWith(base+path.sep)){res.writeHead(403);res.end('forbidden');return;}
      fs.stat(file,(error,stat)=>{
        if(error||!stat.isFile()){res.writeHead(404);res.end('not found');return;}
        res.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
        fs.createReadStream(file).pipe(res);
      });
    }catch(error){res.writeHead(500);res.end(error.message);}
  });
  return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server));});
}

(async()=>{
  const server=await startServer(process.cwd());
  const port=server.address().port;
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
    const page=await context.newPage();
    const pageErrors=[];
    page.on('pageerror',error=>pageErrors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/editor.html`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.CircleMixChartFeasibility&&window.CircleMixEditorFeasibilityUI,{timeout:10000});
    await page.locator('#preview').click({position:{x:280,y:40}});
    await page.locator('#preview').click({position:{x:280,y:520}});
    await page.waitForFunction(()=>document.querySelectorAll('.noteRow').length===2,{timeout:3000});
    await page.locator('#physicalCheckBtn').click();
    const redIssue=page.locator('.feasibilityIssue.severity-red').first();
    await redIssue.waitFor({state:'visible',timeout:5000});
    assert.match(await redIssue.textContent(),/동시에 2개의 서로 다른 에임 위치/);
    assert.equal(await page.locator('.feasibilitySummary .severity-red').textContent(),'RED 1');
    assert.equal(await page.locator('.noteRow.severity-red').count(),2);
    assert.equal(await page.locator('.feasibilityTimelineMarker.severity-red').count(),2);
    await redIssue.click();
    assert.equal(await page.locator('.noteRow.on').count(),1,'clicking a warning must select the first affected note');
    assert.deepEqual(pageErrors,[],'editor physical-check page errors');
    console.log('editor feasibility browser test passed');
    await context.close();
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
