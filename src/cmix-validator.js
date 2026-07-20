(function attachCircleMixCmixValidator(root, factory){
  const api = factory();
  if(typeof module === "object" && module.exports) module.exports = api;
  if(root) root.CircleMixCmixValidator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCircleMixCmixValidator(){
  "use strict";

  const FORMAT = "circle-mix-song";
  const CHART_FORMAT = "circle-mix-chart";
  const FORMAT_VERSION = 1;
  const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const NOTE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
  const STYLE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{0,23}$/;
  const SHA256_PATTERN = /^[a-f0-9]{64}$/;
  const AUDIO_EXTENSIONS = new Set([".ogg", ".mp3", ".wav"]);
  const IMAGE_EXTENSIONS = new Set([".webp", ".png", ".jpg", ".jpeg"]);
  const FORBIDDEN_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".html", ".htm", ".exe", ".dll", ".wasm", ".bat", ".cmd", ".ps1", ".sh"]);
  const NOTE_TYPES = new Set(["cut", "fx", "slideCW", "slideCCW", "trace", "traceCW", "traceCCW", "swingCW", "swingCCW", "scratchCW", "scratchCCW"]);
  const DURATION_TYPES = new Set(["fx", "slideCW", "slideCCW", "trace", "traceCW", "traceCCW", "scratchCW", "scratchCCW"]);
  const END_ANGLE_TYPES = new Set(["slideCW", "slideCCW", "trace", "traceCW", "traceCCW"]);
  const TRACE_TYPES = new Set(["trace", "traceCW", "traceCCW"]);
  const CORE_MANIFEST_FIELDS = new Set(["format", "formatVersion", "packageType", "packageVersion", "id", "title", "artist", "bpm", "offset", "audio", "jacket", "preview", "audioMatch", "charts", "extensions"]);
  const CHART_DESCRIPTOR_FIELDS = new Set(["id", "name", "level", "style", "author", "file"]);
  const CORE_CHART_FIELDS = new Set(["format", "formatVersion", "id", "bpm", "offset", "notes", "extensions"]);
  const NOTE_FIELDS = new Set(["id", "type", "beat", "angle", "endAngle", "durationBeat", "signedSweepAngle", "direction"]);
  const LIMITS = Object.freeze({
    maxFiles: 64,
    maxCharts: 32,
    maxNotesPerChart: 100000,
    maxManifestBytes: 256 * 1024,
    maxChartBytes: 8 * 1024 * 1024,
    maxAudioBytes: 256 * 1024 * 1024,
    maxJacketBytes: 10 * 1024 * 1024,
    maxUncompressedBytes: 512 * 1024 * 1024,
    maxCompressionRatio: 200
  });

  function isObject(value){ return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
  function isFiniteNumber(value){ return typeof value === "number" && Number.isFinite(value); }
  function extensionOf(path){
    const name = String(path || "").toLowerCase();
    const slash = name.lastIndexOf("/");
    const dot = name.lastIndexOf(".");
    return dot > slash ? name.slice(dot) : "";
  }
  function normalizeDegrees(value){ return ((value % 360) + 360) % 360; }
  function shortestDegrees(a, b){ return Math.abs(normalizeDegrees(a - b + 180) - 180); }
  function issue(code, path, message){ return {code, path, message}; }
  function pushUnknownFields(value, allowed, path, errors){
    if(!isObject(value)) return;
    for(const key of Object.keys(value)) if(!allowed.has(key)) errors.push(issue("UNKNOWN_FIELD", `${path}/${key}`, `Unknown field: ${key}`));
  }
  function validId(value, maxLength){ return typeof value === "string" && value.length <= maxLength && ID_PATTERN.test(value); }
  function validText(value, minLength, maxLength){ return typeof value === "string" && value.trim().length >= minLength && value.length <= maxLength; }
  function validAngle(value){ return isFiniteNumber(value) && value >= 0 && value < 360; }

  function validatePath(path){
    if(typeof path !== "string" || !path) return {ok:false, code:"INVALID_PATH", message:"Path must be a non-empty string."};
    if(path.startsWith("/") || path.startsWith("\\")) return {ok:false, code:"ABSOLUTE_PATH", message:"Absolute paths are not allowed."};
    if(path.includes("\\")) return {ok:false, code:"BACKSLASH_PATH", message:"Backslashes are not allowed; use POSIX paths."};
    if(path.includes("\0")) return {ok:false, code:"NULL_PATH", message:"NUL bytes are not allowed in paths."};
    const segments = path.split("/");
    if(segments.some(segment => segment === "" || segment === "." || segment === "..")) return {ok:false, code:"PATH_TRAVERSAL", message:"Empty, dot, and parent path segments are not allowed."};
    return {ok:true};
  }

  function validatePreview(preview, path, errors){
    if(!isObject(preview)){ errors.push(issue("INVALID_PREVIEW", path, "preview must be an object.")); return; }
    pushUnknownFields(preview, new Set(["startSeconds", "durationSeconds"]), path, errors);
    if(!isFiniteNumber(preview.startSeconds) || preview.startSeconds < 0) errors.push(issue("INVALID_PREVIEW_START", `${path}/startSeconds`, "startSeconds must be a finite number >= 0."));
    if(!isFiniteNumber(preview.durationSeconds) || preview.durationSeconds <= 0 || preview.durationSeconds > 60) errors.push(issue("INVALID_PREVIEW_DURATION", `${path}/durationSeconds`, "durationSeconds must be > 0 and <= 60."));
  }

  function validateAudioMatch(audioMatch, path, errors){
    if(!isObject(audioMatch)){ errors.push(issue("INVALID_AUDIO_MATCH", path, "audioMatch must be an object.")); return; }
    const allowed = new Set(["durationSeconds", "durationToleranceSeconds", "sha256", "suggestedFilename", "title", "artist", "preview"]);
    pushUnknownFields(audioMatch, allowed, path, errors);
    if(!isFiniteNumber(audioMatch.durationSeconds) || audioMatch.durationSeconds <= 0 || audioMatch.durationSeconds > 7200) errors.push(issue("INVALID_AUDIO_DURATION", `${path}/durationSeconds`, "durationSeconds must be > 0 and <= 7200."));
    if(audioMatch.durationToleranceSeconds !== undefined && (!isFiniteNumber(audioMatch.durationToleranceSeconds) || audioMatch.durationToleranceSeconds < 0 || audioMatch.durationToleranceSeconds > 10)) errors.push(issue("INVALID_AUDIO_TOLERANCE", `${path}/durationToleranceSeconds`, "durationToleranceSeconds must be between 0 and 10."));
    if(audioMatch.sha256 !== undefined && (typeof audioMatch.sha256 !== "string" || !SHA256_PATTERN.test(audioMatch.sha256))) errors.push(issue("INVALID_AUDIO_HASH", `${path}/sha256`, "sha256 must be 64 lowercase hexadecimal characters."));
    if(audioMatch.suggestedFilename !== undefined && !validText(audioMatch.suggestedFilename, 1, 255)) errors.push(issue("INVALID_AUDIO_FILENAME", `${path}/suggestedFilename`, "suggestedFilename must be 1 to 255 characters."));
    if(audioMatch.title !== undefined && !validText(audioMatch.title, 1, 200)) errors.push(issue("INVALID_AUDIO_TITLE", `${path}/title`, "title must be 1 to 200 characters."));
    if(audioMatch.artist !== undefined && !validText(audioMatch.artist, 1, 200)) errors.push(issue("INVALID_AUDIO_ARTIST", `${path}/artist`, "artist must be 1 to 200 characters."));
    if(audioMatch.preview !== undefined) validatePreview(audioMatch.preview, `${path}/preview`, errors);
  }

  function validateManifest(manifest){
    const errors = [], warnings = [];
    if(!isObject(manifest)) return {ok:false, errors:[issue("INVALID_MANIFEST", "/", "Manifest must be a JSON object.")], warnings};
    pushUnknownFields(manifest, CORE_MANIFEST_FIELDS, "", errors);
    if(manifest.format !== FORMAT) errors.push(issue("INVALID_FORMAT", "/format", `format must be ${FORMAT}.`));
    if(manifest.formatVersion !== FORMAT_VERSION){
      const code = Number.isInteger(manifest.formatVersion) && manifest.formatVersion > FORMAT_VERSION ? "UNSUPPORTED_FORMAT_VERSION" : "INVALID_FORMAT_VERSION";
      errors.push(issue(code, "/formatVersion", `Only formatVersion ${FORMAT_VERSION} is supported.`));
    }
    if(manifest.packageType !== "full" && manifest.packageType !== "chart") errors.push(issue("INVALID_PACKAGE_TYPE", "/packageType", "packageType must be full or chart."));
    if(!Number.isInteger(manifest.packageVersion) || manifest.packageVersion < 1) errors.push(issue("INVALID_PACKAGE_VERSION", "/packageVersion", "packageVersion must be an integer >= 1."));
    if(!validId(manifest.id, 64)) errors.push(issue("INVALID_SONG_ID", "/id", "id must be a lowercase kebab-case identifier up to 64 characters."));
    if(!validText(manifest.title, 1, 200)) errors.push(issue("INVALID_TITLE", "/title", "title must be 1 to 200 characters."));
    if(!validText(manifest.artist, 1, 200)) errors.push(issue("INVALID_ARTIST", "/artist", "artist must be 1 to 200 characters."));
    if(!isFiniteNumber(manifest.bpm) || manifest.bpm < 20 || manifest.bpm > 1000) errors.push(issue("INVALID_BPM", "/bpm", "bpm must be a finite number from 20 to 1000."));
    if(manifest.offset !== undefined && (!isFiniteNumber(manifest.offset) || manifest.offset < -60 || manifest.offset > 60)) errors.push(issue("INVALID_OFFSET", "/offset", "offset must be a finite number from -60 to 60 seconds."));
    if(manifest.preview !== undefined) validatePreview(manifest.preview, "/preview", errors);
    if(manifest.packageType === "full"){
      if(typeof manifest.audio !== "string") errors.push(issue("MISSING_AUDIO", "/audio", "FULL packages must declare an audio file."));
    }else if(manifest.audio !== undefined){
      errors.push(issue("CHART_PACKAGE_CONTAINS_AUDIO", "/audio", "CHART packages must not declare an audio file."));
    }
    if(manifest.packageType === "chart" && manifest.audioMatch === undefined) errors.push(issue("MISSING_AUDIO_MATCH", "/audioMatch", "CHART packages must declare audioMatch."));
    if(manifest.audioMatch !== undefined) validateAudioMatch(manifest.audioMatch, "/audioMatch", errors);
    for(const [field, extensions] of [["audio", AUDIO_EXTENSIONS], ["jacket", IMAGE_EXTENSIONS]]){
      const value = manifest[field];
      if(value === undefined) continue;
      const pathResult = validatePath(value);
      if(!pathResult.ok) errors.push(issue(pathResult.code, `/${field}`, pathResult.message));
      if(!extensions.has(extensionOf(value))) errors.push(issue(`UNSUPPORTED_${field.toUpperCase()}_TYPE`, `/${field}`, `${field} uses an unsupported file extension.`));
    }
    if(!Array.isArray(manifest.charts) || manifest.charts.length < 1 || manifest.charts.length > LIMITS.maxCharts){
      errors.push(issue("INVALID_CHART_LIST", "/charts", `charts must contain 1 to ${LIMITS.maxCharts} entries.`));
    }else{
      const ids = new Set(), files = new Set();
      manifest.charts.forEach((chart, index) => {
        const path = `/charts/${index}`;
        if(!isObject(chart)){ errors.push(issue("INVALID_CHART_DESCRIPTOR", path, "Chart descriptor must be an object.")); return; }
        pushUnknownFields(chart, CHART_DESCRIPTOR_FIELDS, path, errors);
        if(!validId(chart.id, 64)) errors.push(issue("INVALID_CHART_ID", `${path}/id`, "Chart id must be lowercase kebab-case up to 64 characters."));
        if(ids.has(chart.id)) errors.push(issue("DUPLICATE_CHART_ID", `${path}/id`, `Duplicate chart id: ${chart.id}`));
        ids.add(chart.id);
        if(!validText(chart.name, 1, 64)) errors.push(issue("INVALID_CHART_NAME", `${path}/name`, "Chart name must be 1 to 64 characters."));
        if(!isFiniteNumber(chart.level) || chart.level < 1 || chart.level > 20) errors.push(issue("INVALID_CHART_LEVEL", `${path}/level`, "Chart level must be a finite number from 1 to 20."));
        if(chart.style !== undefined && (typeof chart.style !== "string" || !STYLE_PATTERN.test(chart.style))) errors.push(issue("INVALID_CHART_STYLE", `${path}/style`, "style must be an uppercase identifier up to 24 characters."));
        if(chart.author !== undefined && !validText(chart.author, 1, 100)) errors.push(issue("INVALID_CHART_AUTHOR", `${path}/author`, "author must be 1 to 100 characters."));
        const expectedFile = validId(chart.id, 64) ? `charts/${chart.id}.json` : null;
        if(typeof chart.file !== "string") errors.push(issue("MISSING_CHART_FILE", `${path}/file`, "Chart file path is required."));
        else{
          const pathResult = validatePath(chart.file);
          if(!pathResult.ok) errors.push(issue(pathResult.code, `${path}/file`, pathResult.message));
          if(expectedFile && chart.file !== expectedFile) errors.push(issue("CHART_FILE_MISMATCH", `${path}/file`, `Chart file must be ${expectedFile}.`));
          if(files.has(chart.file)) errors.push(issue("DUPLICATE_CHART_FILE", `${path}/file`, `Duplicate chart file: ${chart.file}`));
          files.add(chart.file);
        }
      });
    }
    return {ok:errors.length === 0, errors, warnings};
  }

  function validateChart(chart, options){
    const settings = options || {};
    const basePath = settings.path || "/chart";
    const errors = [], warnings = [];
    if(!isObject(chart)) return {ok:false, errors:[issue("INVALID_CHART", basePath, "Chart must be a JSON object.")], warnings};
    pushUnknownFields(chart, CORE_CHART_FIELDS, basePath, errors);
    if(chart.format !== CHART_FORMAT) errors.push(issue("INVALID_CHART_FORMAT", `${basePath}/format`, `format must be ${CHART_FORMAT}.`));
    if(chart.formatVersion !== FORMAT_VERSION){
      const code = Number.isInteger(chart.formatVersion) && chart.formatVersion > FORMAT_VERSION ? "UNSUPPORTED_CHART_VERSION" : "INVALID_CHART_VERSION";
      errors.push(issue(code, `${basePath}/formatVersion`, `Only chart formatVersion ${FORMAT_VERSION} is supported.`));
    }
    if(!validId(chart.id, 64)) errors.push(issue("INVALID_CHART_ID", `${basePath}/id`, "Chart id must be lowercase kebab-case up to 64 characters."));
    if(settings.descriptor && chart.id !== settings.descriptor.id) errors.push(issue("CHART_ID_MISMATCH", `${basePath}/id`, `Chart id must match descriptor id ${settings.descriptor.id}.`));
    if(chart.bpm !== undefined && (!isFiniteNumber(chart.bpm) || chart.bpm < 20 || chart.bpm > 1000)) errors.push(issue("INVALID_CHART_BPM", `${basePath}/bpm`, "Chart bpm must be from 20 to 1000."));
    if(chart.offset !== undefined && (!isFiniteNumber(chart.offset) || chart.offset < -60 || chart.offset > 60)) errors.push(issue("INVALID_CHART_OFFSET", `${basePath}/offset`, "Chart offset must be from -60 to 60 seconds."));
    if(!Array.isArray(chart.notes) || chart.notes.length < 1 || chart.notes.length > LIMITS.maxNotesPerChart){
      errors.push(issue("INVALID_NOTES", `${basePath}/notes`, `notes must contain 1 to ${LIMITS.maxNotesPerChart} entries.`));
      return {ok:errors.length === 0, errors, warnings};
    }
    const noteIds = new Set();
    let previousBeat = -Infinity;
    let previousNote = null;
    chart.notes.forEach((note, index) => {
      const path = `${basePath}/notes/${index}`;
      if(!isObject(note)){ errors.push(issue("INVALID_NOTE", path, "Note must be an object.")); return; }
      pushUnknownFields(note, NOTE_FIELDS, path, errors);
      if(!NOTE_TYPES.has(note.type)) errors.push(issue("UNSUPPORTED_NOTE_TYPE", `${path}/type`, `Unsupported note type: ${note.type}`));
      if(!isFiniteNumber(note.beat) || note.beat < 0) errors.push(issue("INVALID_NOTE_BEAT", `${path}/beat`, "beat must be a finite number >= 0."));
      else if(note.beat < previousBeat) errors.push(issue("UNSORTED_NOTES", `${path}/beat`, "Notes must be sorted by non-decreasing beat."));
      if(!validAngle(note.angle)) errors.push(issue("INVALID_NOTE_ANGLE", `${path}/angle`, "angle must be a finite number >= 0 and < 360."));
      if(note.id !== undefined){
        if(typeof note.id !== "string" || !NOTE_ID_PATTERN.test(note.id)) errors.push(issue("INVALID_NOTE_ID", `${path}/id`, "Note id contains unsupported characters or is too long."));
        else if(noteIds.has(note.id)) errors.push(issue("DUPLICATE_NOTE_ID", `${path}/id`, `Duplicate note id: ${note.id}`));
        noteIds.add(note.id);
      }
      if(DURATION_TYPES.has(note.type) && (!isFiniteNumber(note.durationBeat) || note.durationBeat <= 0)) errors.push(issue("INVALID_NOTE_DURATION", `${path}/durationBeat`, `${note.type} requires durationBeat > 0.`));
      else if(note.durationBeat !== undefined && (!isFiniteNumber(note.durationBeat) || note.durationBeat <= 0)) errors.push(issue("INVALID_NOTE_DURATION", `${path}/durationBeat`, "durationBeat must be > 0 when present."));
      if(END_ANGLE_TYPES.has(note.type) && !validAngle(note.endAngle)) errors.push(issue("INVALID_END_ANGLE", `${path}/endAngle`, `${note.type} requires endAngle >= 0 and < 360.`));
      else if(note.endAngle !== undefined && !validAngle(note.endAngle)) errors.push(issue("INVALID_END_ANGLE", `${path}/endAngle`, "endAngle must be >= 0 and < 360 when present."));
      if(note.direction !== undefined && note.direction !== "CW" && note.direction !== "CCW") errors.push(issue("INVALID_DIRECTION", `${path}/direction`, "direction must be CW or CCW."));
      if(TRACE_TYPES.has(note.type)){
        if(!isFiniteNumber(note.signedSweepAngle) || note.signedSweepAngle === 0) errors.push(issue("INVALID_TRACE_SWEEP", `${path}/signedSweepAngle`, "TRACE requires a non-zero finite signedSweepAngle."));
        const expectedDirection = note.type === "traceCW" ? 1 : note.type === "traceCCW" ? -1 : note.direction === "CW" ? 1 : note.direction === "CCW" ? -1 : 0;
        if(expectedDirection && isFiniteNumber(note.signedSweepAngle) && Math.sign(note.signedSweepAngle) !== expectedDirection) errors.push(issue("TRACE_DIRECTION_CONFLICT", `${path}/signedSweepAngle`, "TRACE direction conflicts with signedSweepAngle."));
      }else if(note.signedSweepAngle !== undefined){
        errors.push(issue("UNEXPECTED_SWEEP", `${path}/signedSweepAngle`, "signedSweepAngle is only valid for TRACE notes."));
      }
      if(previousNote && isFiniteNumber(note.beat) && isFiniteNumber(previousNote.beat) && Math.abs(note.beat - previousNote.beat) < 0.000001 && validAngle(note.angle) && validAngle(previousNote.angle) && shortestDegrees(note.angle, previousNote.angle) < 8){
        warnings.push(issue("OVERLAPPING_NOTES", path, "Consecutive same-time notes are visually close."));
      }
      if(isFiniteNumber(note.beat)) previousBeat = Math.max(previousBeat, note.beat);
      previousNote = note;
    });
    return {ok:errors.length === 0, errors, warnings};
  }

  function entrySize(entry){
    if(isFiniteNumber(entry.uncompressedSize)) return entry.uncompressedSize;
    if(isFiniteNumber(entry.size)) return entry.size;
    return NaN;
  }

  function validatePackage(input){
    const errors = [], warnings = [];
    if(!isObject(input)) return {ok:false, errors:[issue("INVALID_PACKAGE", "/", "Package validation input must be an object.")], warnings};
    const manifestResult = validateManifest(input.manifest);
    errors.push(...manifestResult.errors); warnings.push(...manifestResult.warnings);
    const manifest = isObject(input.manifest) ? input.manifest : null;
    const chartObjects = isObject(input.charts) ? input.charts : {};
    const entries = Array.isArray(input.entries) ? input.entries : [];
    if(entries.length < 1 || entries.length > LIMITS.maxFiles) errors.push(issue("INVALID_ENTRY_COUNT", "/entries", `Package must contain 1 to ${LIMITS.maxFiles} files.`));
    const entryMap = new Map();
    let totalUncompressed = 0;
    entries.forEach((entry, index) => {
      const path = isObject(entry) ? entry.path : undefined;
      const issuePath = `/entries/${index}`;
      if(!isObject(entry)){ errors.push(issue("INVALID_ENTRY", issuePath, "Entry must be an object.")); return; }
      const pathResult = validatePath(path);
      if(!pathResult.ok){ errors.push(issue(pathResult.code, `${issuePath}/path`, pathResult.message)); return; }
      if(entryMap.has(path)) errors.push(issue("DUPLICATE_ENTRY", `${issuePath}/path`, `Duplicate package entry: ${path}`));
      entryMap.set(path, entry);
      const ext = extensionOf(path);
      if(FORBIDDEN_EXTENSIONS.has(ext)) errors.push(issue("FORBIDDEN_FILE_TYPE", `${issuePath}/path`, `Forbidden file type: ${ext}`));
      const size = entrySize(entry);
      if(!isFiniteNumber(size) || size < 0) errors.push(issue("INVALID_ENTRY_SIZE", `${issuePath}/uncompressedSize`, "Entry size must be a finite number >= 0."));
      else totalUncompressed += size;
      if(entry.compressedSize !== undefined){
        if(!isFiniteNumber(entry.compressedSize) || entry.compressedSize < 0) errors.push(issue("INVALID_COMPRESSED_SIZE", `${issuePath}/compressedSize`, "compressedSize must be a finite number >= 0."));
        else if(size > 0 && entry.compressedSize === 0) errors.push(issue("INVALID_COMPRESSION_RATIO", issuePath, "A non-empty entry cannot have compressedSize 0."));
        else if(size > 0 && size / Math.max(1, entry.compressedSize) > LIMITS.maxCompressionRatio) errors.push(issue("COMPRESSION_RATIO_EXCEEDED", issuePath, `Compression ratio exceeds ${LIMITS.maxCompressionRatio}:1.`));
      }
    });
    if(totalUncompressed > LIMITS.maxUncompressedBytes) errors.push(issue("PACKAGE_TOO_LARGE", "/entries", `Uncompressed package size exceeds ${LIMITS.maxUncompressedBytes} bytes.`));
    if(!entryMap.has("manifest.json")) errors.push(issue("MISSING_MANIFEST_FILE", "/entries", "Package must contain manifest.json."));
    const allowedPaths = new Set(["manifest.json"]);
    if(manifest){
      if(typeof manifest.audio === "string") allowedPaths.add(manifest.audio);
      if(typeof manifest.jacket === "string") allowedPaths.add(manifest.jacket);
      if(Array.isArray(manifest.charts)){
        for(const descriptor of manifest.charts){
          if(!isObject(descriptor) || typeof descriptor.file !== "string") continue;
          allowedPaths.add(descriptor.file);
          if(!entryMap.has(descriptor.file)) errors.push(issue("MISSING_DECLARED_FILE", `/manifest/charts/${descriptor.id || "?"}/file`, `Missing declared chart file: ${descriptor.file}`));
          const chart = chartObjects[descriptor.file];
          if(chart === undefined) errors.push(issue("MISSING_PARSED_CHART", `/charts/${descriptor.file}`, `No parsed chart object was supplied for ${descriptor.file}.`));
          else{
            const result = validateChart(chart, {descriptor, path:`/charts/${descriptor.id || descriptor.file}`});
            errors.push(...result.errors); warnings.push(...result.warnings);
          }
        }
      }
      if(manifest.packageType === "full" && typeof manifest.audio === "string" && !entryMap.has(manifest.audio)) errors.push(issue("MISSING_DECLARED_FILE", "/manifest/audio", `Missing declared audio file: ${manifest.audio}`));
      if(typeof manifest.jacket === "string" && !entryMap.has(manifest.jacket)) errors.push(issue("MISSING_DECLARED_FILE", "/manifest/jacket", `Missing declared jacket file: ${manifest.jacket}`));
    }
    for(const [path, entry] of entryMap){
      if(!allowedPaths.has(path)) errors.push(issue("UNDECLARED_FILE", `/entries/${path}`, `File is not declared by manifest: ${path}`));
      const size = entrySize(entry);
      let max = null;
      if(path === "manifest.json") max = LIMITS.maxManifestBytes;
      else if(manifest && path === manifest.audio) max = LIMITS.maxAudioBytes;
      else if(manifest && path === manifest.jacket) max = LIMITS.maxJacketBytes;
      else if(path.startsWith("charts/") && path.endsWith(".json")) max = LIMITS.maxChartBytes;
      if(max !== null && isFiniteNumber(size) && size > max) errors.push(issue("FILE_TOO_LARGE", `/entries/${path}`, `${path} exceeds ${max} bytes.`));
    }
    if(manifest && manifest.packageType === "chart"){
      for(const path of entryMap.keys()) if(AUDIO_EXTENSIONS.has(extensionOf(path))) errors.push(issue("CHART_PACKAGE_CONTAINS_AUDIO", `/entries/${path}`, "CHART packages must not contain audio files."));
    }
    return {ok:errors.length === 0, errors, warnings};
  }

  return Object.freeze({
    FORMAT,
    CHART_FORMAT,
    FORMAT_VERSION,
    LIMITS,
    supportedAudioExtensions:Object.freeze([...AUDIO_EXTENSIONS]),
    supportedImageExtensions:Object.freeze([...IMAGE_EXTENSIONS]),
    noteTypes:Object.freeze([...NOTE_TYPES]),
    validatePath,
    validateManifest,
    validateChart,
    validatePackage
  });
});
