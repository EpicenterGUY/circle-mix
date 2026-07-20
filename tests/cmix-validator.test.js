const assert = require("node:assert/strict");
const fs = require("node:fs");
const validator = require("../src/cmix-validator.js");

function test(name, fn){
  try{ fn(); console.log(`PASS ${name}`); }
  catch(error){ console.error(`FAIL ${name}`); throw error; }
}
function codes(result){ return result.errors.map(error => error.code); }
function fullManifest(){
  return {
    format:"circle-mix-song", formatVersion:1, packageType:"full", packageVersion:1,
    id:"camellia-routing", title:"Routing", artist:"Camellia", bpm:144, offset:0,
    audio:"audio.ogg", jacket:"jacket.webp", preview:{startSeconds:50,durationSeconds:15},
    charts:[
      {id:"beginner",name:"Beginner",level:3,file:"charts/beginner.json"},
      {id:"reverb",name:"Reverb",level:15,style:"TECH",file:"charts/reverb.json"}
    ]
  };
}
function chart(id){
  return {
    format:"circle-mix-chart", formatVersion:1, id,
    notes:[
      {id:`${id}-001`,type:"cut",beat:0,angle:0},
      {id:`${id}-002`,type:"slideCW",beat:2,angle:45,endAngle:135,durationBeat:1},
      {id:`${id}-003`,type:"traceCCW",beat:4,angle:180,endAngle:90,durationBeat:2,signedSweepAngle:-450}
    ]
  };
}
function entry(path, uncompressedSize, compressedSize){ return {path,uncompressedSize,compressedSize}; }

test("schemas and examples are valid JSON", () => {
  for(const file of [
    "schemas/cmix-manifest-v1.schema.json", "schemas/cmix-chart-v1.schema.json",
    "examples/cmix/manifest.full.example.json", "examples/cmix/manifest.chart.example.json", "examples/cmix/chart.example.json"
  ]) assert.doesNotThrow(() => JSON.parse(fs.readFileSync(file, "utf8")), file);
});

test("valid FULL manifest and package pass", () => {
  const manifest = fullManifest();
  assert.equal(validator.validateManifest(manifest).ok, true);
  const result = validator.validatePackage({
    manifest,
    charts:{"charts/beginner.json":chart("beginner"),"charts/reverb.json":chart("reverb")},
    entries:[entry("manifest.json",1200,400),entry("audio.ogg",5_000_000,4_000_000),entry("jacket.webp",50_000,40_000),entry("charts/beginner.json",2000,500),entry("charts/reverb.json",2000,500)]
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test("valid CHART package requires audioMatch and contains no audio", () => {
  const manifest = fullManifest();
  manifest.packageType = "chart";
  delete manifest.audio;
  manifest.audioMatch = {durationSeconds:111,durationToleranceSeconds:2,suggestedFilename:"Camellia - Routing.ogg"};
  manifest.charts = [manifest.charts[1]];
  const result = validator.validatePackage({
    manifest,
    charts:{"charts/reverb.json":chart("reverb")},
    entries:[entry("manifest.json",1000,400),entry("jacket.webp",50_000,40_000),entry("charts/reverb.json",2000,500)]
  });
  assert.equal(result.ok, true);
});

test("manifest rejects unsupported versions, duplicate ids, and noncanonical chart files", () => {
  const manifest = fullManifest();
  manifest.formatVersion = 2;
  manifest.charts[1].id = "beginner";
  manifest.charts[1].file = "other/reverb.json";
  const result = validator.validateManifest(manifest);
  assert.ok(codes(result).includes("UNSUPPORTED_FORMAT_VERSION"));
  assert.ok(codes(result).includes("DUPLICATE_CHART_ID"));
  assert.ok(codes(result).includes("CHART_FILE_MISMATCH"));
});

test("CHART manifests reject embedded audio and missing audioMatch", () => {
  const manifest = fullManifest();
  manifest.packageType = "chart";
  const result = validator.validateManifest(manifest);
  assert.ok(codes(result).includes("CHART_PACKAGE_CONTAINS_AUDIO"));
  assert.ok(codes(result).includes("MISSING_AUDIO_MATCH"));
});

test("chart validation rejects invalid runtime data", () => {
  const invalid = chart("reverb");
  invalid.notes = [
    {id:"dup",type:"traceCW",beat:2,angle:360,endAngle:90,durationBeat:0,signedSweepAngle:-90},
    {id:"dup",type:"unknown",beat:1,angle:0,signedSweepAngle:90},
    {type:"slideCCW",beat:Number.NaN,angle:20,durationBeat:1}
  ];
  const result = validator.validateChart(invalid, {descriptor:{id:"other"}});
  for(const code of ["CHART_ID_MISMATCH","INVALID_NOTE_ANGLE","INVALID_NOTE_DURATION","TRACE_DIRECTION_CONFLICT","DUPLICATE_NOTE_ID","UNSUPPORTED_NOTE_TYPE","UNSORTED_NOTES","INVALID_NOTE_BEAT","INVALID_END_ANGLE"]){
    assert.ok(codes(result).includes(code), code);
  }
});

test("package validation rejects traversal, forbidden and undeclared files", () => {
  const manifest = fullManifest();
  const result = validator.validatePackage({
    manifest,
    charts:{"charts/beginner.json":chart("beginner"),"charts/reverb.json":chart("reverb")},
    entries:[entry("manifest.json",1000,500),entry("../escape.json",10,10),entry("payload.js",10,10),entry("audio.ogg",1000,900),entry("jacket.webp",100,90),entry("charts/beginner.json",1000,500),entry("charts/reverb.json",1000,500)]
  });
  assert.ok(codes(result).includes("PATH_TRAVERSAL"));
  assert.ok(codes(result).includes("FORBIDDEN_FILE_TYPE"));
  assert.ok(codes(result).includes("UNDECLARED_FILE"));
});

test("package validation rejects missing declarations and suspicious compression ratios", () => {
  const manifest = fullManifest();
  const result = validator.validatePackage({
    manifest,
    charts:{"charts/beginner.json":chart("beginner")},
    entries:[entry("manifest.json",1000,1),entry("charts/beginner.json",1000,500)]
  });
  assert.ok(codes(result).includes("COMPRESSION_RATIO_EXCEEDED"));
  assert.ok(codes(result).includes("MISSING_DECLARED_FILE"));
  assert.ok(codes(result).includes("MISSING_PARSED_CHART"));
});

test("validator remains pure and browser reusable", () => {
  const source = fs.readFileSync("src/cmix-validator.js", "utf8");
  assert.doesNotMatch(source, /indexedDB|JSZip|document\.|querySelector|innerHTML/);
  assert.equal(validator.FORMAT_VERSION, 1);
  assert.ok(Object.isFrozen(validator.LIMITS));
  assert.deepEqual(validator.validatePath("charts/reverb.json"), {ok:true});
  assert.equal(validator.validatePath("charts\\reverb.json").ok, false);
});
