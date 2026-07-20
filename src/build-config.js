// Static product configuration. Distribution builds may replace this file before packaging.
(function(root){
  const supplied=root.CircleMixBuildConfig || {};
  root.CircleMixBuildConfig=Object.freeze({includeBundledSongs:supplied.includeBundledSongs !== false});
})(typeof globalThis!=="undefined"?globalThis:this);
