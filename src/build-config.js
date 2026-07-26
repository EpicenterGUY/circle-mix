// Static product configuration. Distribution builds may replace this file before packaging.
(function(root){
  const supplied=root.CircleMixBuildConfig || {};
  root.CircleMixBuildConfig=Object.freeze({includeBundledSongs:supplied.includeBundledSongs !== false});
  function mountOrbitEntry(){
    if(typeof document==="undefined" || document.getElementById("safeOrbit"))return;
    const anchor=document.getElementById("safeEditor")||document.getElementById("safeTutorial");
    if(!anchor)return;
    const button=document.createElement("button");
    button.id="safeOrbit";
    button.type="button";
    button.className=anchor.className;
    button.textContent="ORBIT MODE";
    button.addEventListener("click",()=>{ root.location.href="./orbit.html"; });
    const parent=anchor.parentElement;
    if(parent)parent.insertBefore(button,anchor.nextSibling);
  }
  if(root.document){
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mountOrbitEntry,{once:true});
    else mountOrbitEntry();
  }
})(typeof globalThis!=="undefined"?globalThis:this);
