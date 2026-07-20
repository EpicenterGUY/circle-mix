(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  let generation = 0;
  let jacketUrl = null;
  let dragDepth = 0;

  const dev = () => new URLSearchParams(location.search).get('dev') === '1' ||
    localStorage.getItem('circleMixDevMode') === 'true';

  function revokeJacket(){
    if(!jacketUrl) return;
    URL.revokeObjectURL(jacketUrl);
    jacketUrl = null;
  }

  function clean(){
    generation++;
    dragDepth = 0;
    $('cmixDropOverlay').hidden = true;
    revokeJacket();
    $('cmixImportModal').hidden = true;
    $('cmixImportContent').replaceChildren();
  }

  function text(el, value){
    el.textContent = String(value ?? '');
  }

  function preparePicker(input){
    generation++;
    revokeJacket();
    $('cmixImportContent').replaceChildren();
    text($('cmixImportStatus'), 'SELECT .CMIX PACKAGE');
    $('cmixImportModal').hidden = false;
    input.click();
  }

  function show(file){
    const g = ++generation;
    const modal = $('cmixImportModal');
    const content = $('cmixImportContent');
    modal.hidden = false;
    content.replaceChildren();
    text($('cmixImportStatus'), 'READING PACKAGE');

    CircleMixCmixImporter.inspect(file, {
      onProgress: state => {
        if(g === generation) text($('cmixImportStatus'), state);
      }
    }).then(result => {
      if(g !== generation) return;
      content.replaceChildren();
      if(!result.ok){
        text($('cmixImportStatus'), 'PACKAGE CHECK FAILED');
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = 'ERROR DETAILS';
        details.append(summary);
        for(const error of result.errors){
          const paragraph = document.createElement('p');
          paragraph.textContent = `${error.code} · ${error.path}\n${error.message}`;
          details.append(paragraph);
        }
        content.append(details);
        return;
      }

      const manifest = result.package.manifest;
      const preview = document.createElement('pre');
      preview.textContent = `${manifest.title}\n${manifest.artist}\n\nPACKAGE: ${manifest.packageType.toUpperCase()}\nVERSION: ${manifest.packageVersion}\nBPM: ${manifest.bpm}\nCHARTS: ${manifest.charts.length}\nAUDIO: ${manifest.packageType === 'chart' ? 'LOCAL FILE REQUIRED' : 'INCLUDED'}\nSIZE: ${file.size} bytes\nSHA-256: ${result.package.packageHash || 'UNAVAILABLE'}\n\n${manifest.charts.map(chart => `${chart.name} ${chart.level}${chart.style ? ' · ' + chart.style : ''}`).join('\n')}\n\n패키지 검사가 완료되었습니다.\n영구 설치와 로컬 라이브러리는 다음 단계에서 연결됩니다.`;
      content.append(preview);

      if(result.package.jacketBlob){
        const image = document.createElement('img');
        jacketUrl = URL.createObjectURL(result.package.jacketBlob);
        image.src = jacketUrl;
        image.alt = 'Package jacket preview';
        image.style.cssText = 'max-width:180px;display:block';
        content.append(image);
      }
      text($('cmixImportStatus'), 'PACKAGE READY');
    }).catch(() => {
      if(g === generation) text($('cmixImportStatus'), 'PACKAGE CHECK FAILED');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = $('cmixImportBtn');
    const input = $('cmixImportInput');
    if(!dev()) return;

    btn.hidden = false;
    btn.onclick = () => preparePicker(input);
    input.onchange = () => {
      const files = [...input.files];
      input.value = '';
      if(files.length !== 1) return;
      show(files[0]);
    };
    $('cmixImportClose').onclick = clean;

    window.addEventListener('dragenter', event => {
      if(!dev() || !event.dataTransfer?.types.includes('Files')) return;
      dragDepth++;
      $('cmixDropOverlay').hidden = false;
    });
    window.addEventListener('dragleave', () => {
      if(--dragDepth <= 0){
        dragDepth = 0;
        $('cmixDropOverlay').hidden = true;
      }
    });
    window.addEventListener('dragover', event => {
      if(dev() && event.dataTransfer?.types.includes('Files')) event.preventDefault();
    });
    window.addEventListener('drop', event => {
      if(!dev() || !event.dataTransfer?.files) return;
      event.preventDefault();
      dragDepth = 0;
      $('cmixDropOverlay').hidden = true;
      const files = [...event.dataTransfer.files];
      if(files.length !== 1) return show(null);
      const file = files[0];
      if(!file || !file.name || !/\.cmix$/i.test(file.name)) return show(null);
      show(file);
    });
  });
})();
