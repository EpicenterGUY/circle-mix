from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


game_path = Path("src/game.js")
source = game_path.read_text(encoding="utf-8")

source = replace_once(
    source,
    '    const color=noteColor(n), dir=n.type==="swingCW"?1:-1;',
    '    const color=noteColor(n), pulseSync=isPulseSynchronizedNote(n), dir=n.type==="swingCW"?1:-1;',
    "drawSwing sync detection",
)

source = replace_once(
    source,
    '''    drawDirectedArcSegments(r,startA,amount,`rgba(255,255,255,${n===focusNote?.22:.12})`,n===focusNote?NOTE_WIDTHS.swing+4:NOTE_WIDTHS.swing,1,color,n===focusNote?12:6);
    drawDirectedArcSegments(r,startA,amount,color,n===focusNote?NOTE_WIDTHS.swing+1:NOTE_WIDTHS.swing,n===focusNote?.82:.64,color,n===focusNote?14:7);
''',
    '''    const backingColor=pulseSync?colorAlpha(color,n===focusNote?.46:.34):`rgba(255,255,255,${n===focusNote?.22:.12})`;
    const bodyAlpha=pulseSync?(n===focusNote?1:.94):(n===focusNote?.82:.64);
    drawDirectedArcSegments(r,startA,amount,backingColor,n===focusNote?NOTE_WIDTHS.swing+5:NOTE_WIDTHS.swing+1,1,color,n===focusNote?14:8);
    drawDirectedArcSegments(r,startA,amount,color,n===focusNote?NOTE_WIDTHS.swing+2:NOTE_WIDTHS.swing+1,bodyAlpha,color,n===focusNote?16:10);
    if(pulseSync){
      ctx.save();ctx.translate(cx,cy);ctx.strokeStyle=colorAlpha(color,.96);ctx.lineWidth=2.5;ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.arc(0,0,r+8,startA,startA+amount,dir<0);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    }
''',
    "drawSwing body visibility",
)

source = replace_once(
    source,
    '''    ctx.fillStyle="rgba(255,255,255,.94)";
    ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-8,-8);ctx.lineTo(-4,0);ctx.lineTo(-8,8);ctx.closePath();ctx.fill();
''',
    '''    ctx.fillStyle=pulseSync?color:"rgba(255,255,255,.94)";
    ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-8,-8);ctx.lineTo(-4,0);ctx.lineTo(-8,8);ctx.closePath();ctx.fill();
    if(pulseSync){ctx.strokeStyle="#ffffff";ctx.lineWidth=2;ctx.stroke();}
''',
    "drawSwing arrow visibility",
)

source = replace_once(
    source,
    '    drawRingLabel(isReversal?"REV":(link?"EXIT":(dir>0?"↻":"↺")),center,r+24,isReversal?"rgba(255,114,214,.9)":"rgba(255,255,255,.86)",n===focusNote?18:14);',
    '    const labelColor=pulseSync?color:(isReversal?"rgba(255,114,214,.9)":"rgba(255,255,255,.86)");\n    drawRingLabel(isReversal?"REV":(link?"EXIT":(dir>0?"↻":"↺")),center,r+24,labelColor,n===focusNote?18:14);',
    "drawSwing label visibility",
)

source = replace_once(
    source,
    '''  function drawFx(n,t){
    const active=t>=n.hitTime;
    const color=noteColor(n);
    const focus=n===focusNote;
''',
    '''  function drawFx(n,t){
    const active=t>=n.hitTime;
    const color=noteColor(n);
    const pulseSync=isPulseSynchronizedNote(n);
    const focus=n===focusNote;
''',
    "drawFx sync detection",
)

source = replace_once(
    source,
    '''    ctx.globalAlpha=alpha;
    ctx.shadowBlur=24;
    ctx.shadowColor=color;
''',
    '''    ctx.globalAlpha=alpha;
    ctx.shadowBlur=pulseSync?30:24;
    ctx.shadowColor=color;
''',
    "drawFx glow",
)

source = replace_once(
    source,
    '      ctx.strokeStyle=colorAlpha(color,active?.92:.72);',
    '      ctx.strokeStyle=colorAlpha(color,pulseSync?(active?.98:.90):(active?.92:.72));',
    "drawFx body visibility",
)

old_head = '''      ctx.fillStyle="#ffffff";
      ctx.beginPath();ctx.arc(headR,0,focus?14:12,0,TAU);ctx.fill();
      ctx.strokeStyle="rgba(0,0,0,.45)";ctx.lineWidth=3;ctx.stroke();
'''
new_head = '''      ctx.fillStyle=pulseSync?color:"#ffffff";
      ctx.beginPath();ctx.arc(headR,0,focus?14:12,0,TAU);ctx.fill();
      ctx.strokeStyle=pulseSync?"#ffffff":"rgba(0,0,0,.45)";ctx.lineWidth=3;ctx.stroke();
      if(pulseSync){
        ctx.strokeStyle="rgba(255,255,255,.94)";ctx.lineWidth=2;ctx.setLineDash([4,3]);
        ctx.beginPath();ctx.arc(headR,0,focus?19:17,0,TAU);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle="#ffffff";ctx.beginPath();ctx.arc(headR,0,4,0,TAU);ctx.fill();
      }
'''
head_count = source.count(old_head)
if head_count != 2:
    raise SystemExit(f"drawFx heads: expected exactly two matches, found {head_count}")
source = source.replace(old_head, new_head, 2)

source = replace_once(
    source,
    '        ctx.fillText("START",headR,-18);',
    '        ctx.fillText(pulseSync?"PULSE":"START",headR,-18);',
    "drawFx synchronized label",
)

game_path.write_text(source, encoding="utf-8")

test_path = Path("tests/smoke.test.js")
tests = test_path.read_text(encoding="utf-8")
tests = replace_once(
    tests,
    '  for(const [name,next] of [["drawTrace","linkedTraceForSwing"],["drawSlide","drawFx"],["drawFx","drawScratch"]]){',
    '  for(const [name,next] of [["drawTrace","linkedTraceForSwing"],["drawSwing","drawSlide"],["drawSlide","drawFx"],["drawFx","drawScratch"]]){',
    "renderer coverage list",
)
needle = '''    assert.ok(renderer.includes("noteColor(n)"),name+" uses synchronized color");
  }
'''
replacement = '''    assert.ok(renderer.includes("noteColor(n)"),name+" uses synchronized color");
  }
  const swingStart=src.indexOf("  function drawSwing("), swingEnd=src.indexOf("\\n  function drawSlide(",swingStart);
  const swingRenderer=src.slice(swingStart,swingEnd);
  assert.ok(swingRenderer.includes("pulseSync=isPulseSynchronizedNote(n)"),"SWING renderer detects PULSE synchronization");
  assert.ok(swingRenderer.includes("ctx.fillStyle=pulseSync?color"),"SWING arrow uses directional orange");
  assert.ok(swingRenderer.includes("ctx.setLineDash([5,4])"),"SWING shows a synchronized dashed accent");
  const holdStart=src.indexOf("  function drawFx("), holdEnd=src.indexOf("\\n  function drawScratch(",holdStart);
  const holdRenderer=src.slice(holdStart,holdEnd);
  assert.ok(holdRenderer.includes("pulseSync=isPulseSynchronizedNote(n)"),"HOLD renderer detects PULSE synchronization");
  assert.ok(holdRenderer.includes('ctx.fillStyle=pulseSync?color:"#ffffff"'),"HOLD head uses synchronized orange");
  assert.ok(holdRenderer.includes('ctx.fillText(pulseSync?"PULSE":"START"'),"HOLD labels the synchronized start");
'''
tests = replace_once(tests, needle, replacement, "renderer assertions")
test_path.write_text(tests, encoding="utf-8")
