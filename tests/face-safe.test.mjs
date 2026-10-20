import test from 'node:test';
import assert from 'node:assert/strict';
import {faceExclusionRect, outsideFace, peripheralAnchors, FX_PLACEMENTS} from '../face-safe.mjs';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js', import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html', import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css', import.meta.url),'utf8');
test('both placement presets protect an actual face with padding',()=>{
  const face=[{x:130,y:95},{x:250,y:95},{x:130,y:265},{x:250,y:265},{x:190,y:180},{x:165,y:110}];
  for(const mode of FX_PLACEMENTS){
    const r=faceExclusionRect(face,p=>p,390,390,mode);
    for(const p of face) assert.equal(outsideFace(r,p),false);
    assert(r.x<130 && r.y<95 && r.x+r.width>250 && r.y+r.height>265);
  }
});
test('focused mode offers more space than cinematic mode',()=>{
  const pts=[{x:200,y:150},{x:260,y:230},{x:245,y:240},{x:215,y:165},{x:225,y:180},{x:235,y:200}];
  const a=faceExclusionRect(pts,p=>p,600,420,'focused');
  const b=faceExclusionRect(pts,p=>p,600,420,'cinematic');
  assert(a.width>b.width && a.height>b.height);
});
test('idle zone protects center with no camera',()=>{
  for(const [w,h] of [[390,440],[900,506]]){
    const r=faceExclusionRect([],p=>p,w,h);
    assert.equal(outsideFace(r,{x:w*.5,y:h*.43}),false);
  }
});
test('off-canvas landmarks never break safe zone clipping',()=>{
  const pts=Array.from({length:6},(_,i)=>({x:-2+i,y:1.2}));
  const r=faceExclusionRect(pts,p=>p,300,240);
  assert(r.x>=0 && r.y>=0 && r.width>=0 && r.height>=0);
});
test('the only ornament anchor is always in the upper left and does not follow the face',()=>{
  for(const [w,h] of [[390,440],[900,506]]){
    const anchors=peripheralAnchors(w,h);
    assert.equal(anchors.length,1);
    assert(anchors.every(a=>a.x>0&&a.x<w&&a.y>0&&a.y<h));
    assert(anchors.every(a=>a.x<=w*.17 && a.y<=h*.25));
  }
});
test('FX are masked before drawing and true face landmarks render after clip restore',()=>{
  const draw=app.slice(app.indexOf('function draw(ms){'),app.indexOf('function tick(time){'));
  assert(draw.includes('ctx.clip("evenodd")'));
  assert(draw.indexOf('ctx.clip("evenodd")')<draw.indexOf('renderVisualFX(ms)'));
  assert(draw.indexOf('ctx.restore()')<draw.indexOf('renderLandmarks(ms)'));
  assert(!app.includes('const src = accentCenter()'));
});
test('one top-left ornament without the older placement UI',()=>{
  assert(!html.includes('id="fx-placement-select"'));
  assert(html.includes('SINGLE ORBIT / TOP LEFT'));
  assert(html.includes('Navod Ravindu Jayaweera'));
  assert(html.includes('NV. FACE LAB'));
  assert(css.includes('#4de0ff'));
});
