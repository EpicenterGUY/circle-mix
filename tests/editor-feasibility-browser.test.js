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
async function writeDiagnostics(page,error){
  const dir=process.env.BROWSER_ARTIFACTS_DIR||'artifacts/browser-regression';
  fs.mkdirSync(dir,{recursive:true});
  let state=null;
  try{
    state=await page.evaluate(async()=>{
      const id=document.getElementById('songId')?.value||'custom-song';
      const db=await new Promise(resolve=>{const request=indexedDB.open('circle-mix-editor',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);});
      let project=null;
      if(db){project=await new Promise(resolve=>{const request=db.transaction('projects').objectStore('projects').get(id);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>resolve(null);});db.close();}
      return {project,rows:[...document.querySelectorAll('.noteRow')].map(row=>({className:row.className,text:row.textContent})),validation:document.getElementById('validation')?.innerHTML||'',result:window.CircleMixEditorFeasibilityUI?.result||null};
    });
    await page.screenshot({path:path.join(dir,'editor-feasibility-failure.png'),fullPage:true});
  }catch(diagnosticError){state={diagnosticError:diagnosticError.stack};}
  fs.writeFileSync(path.join(dir,'editor-feasibility-failure.json'),JSON.stringify({error:error.stack,state},null,2));
}

(async()=>{
  const server=await startServer(process.cwd());
  const port=server.address().port;
  let browser,context,page;
  try{
    browser=await chromium.launch({headless:true});
    context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
    page=await context.newPage();
    const pageErrors=[];
    page.on('pageerror',error=>pageErrors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/editor.html`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.CircleMixChartFeasibility&&window.CircleMixEditorFeasibilityUI,{timeout:10000});
    await page.locator('#preview').click({position:{x:280,y:40}});
    await page.locator('#preview').click({position:{x:280,y:520}});
    await page.waitForFunction(()=>document.querySelectorAll('.noteRow').length===2,{timeout:5000});
    await page.waitForFunction(async()=>{
      const id=document.getElementById('songId')?.value||'custom-song';
      const db=await new Promise(resolve=>{const request=indexedDB.open('circle-mix-editor',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);});
      if(!db)return false;
      const project=await new Promise(resolve=>{const request=db.transaction('projects').objectStore('projects').get(id);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>resolve(null);});
      db.close();
      return Array.isArray(project?.notes)&&project.notes.length===2;
    },null,{timeout:15000});
    await page.locator('#physicalCheckBtn').click();
    const redIssue=page.locator('.feasibilityIssue.severity-red').first();
    await redIssue.waitFor({state:'visible',timeout:15000});
    assert.match(await redIssue.textContent(),/동시에 2개의 서로 다른 에임 위치/);
    assert.equal(await page.locator('.feasibilitySummary .severity-red').textContent(),'RED 1');
    assert.equal(await page.locator('.noteRow.severity-red').count(),2);
    assert.equal(await page.locator('.feasibilityTimelineMarker.severity-red').count(),2);
    await redIssue.click();
    assert.equal(await page.locator('.noteRow.on').count(),1,'clicking a warning must select the first affected note');
    assert.deepEqual(pageErrors,[],'editor physical-check page errors');
    console.log('editor feasibility browser test passed');
  }catch(error){
    if(page)await writeDiagnostics(page,error);
    throw error;
  }finally{
    if(context)await context.close().catch(()=>{});
    if(browser)await browser.close().catch(()=>{});
    server.closeAllConnections?.();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
