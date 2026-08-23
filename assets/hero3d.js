/* Excel Unit — neural fiber network hero (Three.js) */
(function(){
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
var tries=0;
function boot(){
if(window.innerWidth===0 || document.getElementById('hero3d').clientWidth===0){ if(++tries<40) return setTimeout(boot,250); return; }
if(window.innerWidth < 1080) return;
var host=document.getElementById('hero3d'); if(!host||!window.THREE) return;
var W=host.clientWidth, H=host.clientHeight;
var renderer=new THREE.WebGLRenderer({canvas:host, alpha:true, antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setSize(W,H,false);
var scene=new THREE.Scene();
var cam=new THREE.PerspectiveCamera(46, W/H, 0.1, 100);
cam.position.set(0,0,13);

function glowTex(){
  var c=document.createElement('canvas'); c.width=c.height=64;
  var g=c.getContext('2d'), grd=g.createRadialGradient(32,32,0,32,32,32);
  grd.addColorStop(0,'rgba(190,220,255,1)'); grd.addColorStop(.35,'rgba(120,175,255,.7)'); grd.addColorStop(1,'rgba(80,140,255,0)');
  g.fillStyle=grd; g.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);
}
var tex=glowTex();

/* node cloud — flattened ellipsoid */
var N=110, nodes=[];
for(var i=0;i<N;i++){
  var th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1), r=2.6+Math.random()*2.6;
  nodes.push(new THREE.Vector3(Math.sin(ph)*Math.cos(th)*r*1.35, Math.cos(ph)*r*0.82, Math.sin(ph)*Math.sin(th)*r*0.9));
}
var group=new THREE.Group(); scene.add(group);
var pgeo=new THREE.BufferGeometry().setFromPoints(nodes);
var pts=new THREE.Points(pgeo, new THREE.PointsMaterial({size:.16, map:tex, transparent:true, opacity:.95, color:0x9CC7FF, blending:THREE.AdditiveBlending, depthWrite:false}));
group.add(pts);

/* edges — nearest neighbours, curved */
var curves=[], lineGroup=new THREE.Group(); group.add(lineGroup);
var lmat=new THREE.LineBasicMaterial({color:0x3B76D8, transparent:true, opacity:.24, blending:THREE.AdditiveBlending, depthWrite:false});
for(var i=0;i<N;i++){
  var d=[], a=nodes[i];
  for(var j=0;j<N;j++){ if(i!==j) d.push([a.distanceTo(nodes[j]), j]); }
  d.sort(function(x,y){return x[0]-y[0];});
  for(var k=0;k<2;k++){
    var j=d[k][1]; if(j<i) continue;
    var b=nodes[j], mid=a.clone().add(b).multiplyScalar(.5);
    mid.add(mid.clone().normalize().multiplyScalar(.55));
    var curve=new THREE.QuadraticBezierCurve3(a, mid, b);
    curves.push(curve);
    var geo=new THREE.BufferGeometry().setFromPoints(curve.getPoints(18));
    lineGroup.add(new THREE.Line(geo, lmat));
  }
}

/* pulses along random curves */
var P=26, pulses=[];
var pmat=new THREE.SpriteMaterial({map:tex, color:0xBFE0FF, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false});
for(var i=0;i<P;i++){
  var s=new THREE.Sprite(pmat.clone());
  s.scale.set(.34,.34,1);
  pulses.push({s:s, c:curves[(Math.random()*curves.length)|0], t:Math.random(), v:.16+Math.random()*.30});
  group.add(s);
}

/* core */
var core=new THREE.Sprite(new THREE.SpriteMaterial({map:tex, color:0x7FB0FF, transparent:true, opacity:.9, blending:THREE.AdditiveBlending, depthWrite:false}));
core.scale.set(2.6,2.6,1); group.add(core);

group.position.x=3.4; group.rotation.z=.06;
var tiltX=0, tiltY=0;
var hero=document.querySelector('.hero');
hero&&hero.addEventListener('mousemove',function(e){
  var r=hero.getBoundingClientRect();
  tiltY=((e.clientX-r.left)/r.width-.5)*.5; tiltX=((e.clientY-r.top)/r.height-.5)*.3;
});
var running=true;
document.addEventListener('visibilitychange',function(){running=!document.hidden;});
var clock=new THREE.Clock();
(function loop(){
  requestAnimationFrame(loop);
  if(!running) return;
  var dt=Math.min(clock.getDelta(), .05), t=clock.elapsedTime;
  group.rotation.y += dt*.12;
  group.rotation.y += (tiltY-group.rotation.y%.0001)*0;
  group.rotation.x += ((tiltX*.6)-group.rotation.x)*.04;
  group.rotation.y += (tiltY*.0);
  core.material.opacity=.75+.2*Math.sin(t*1.6);
  for(var i=0;i<P;i++){
    var p=pulses[i]; p.t+=dt*p.v;
    if(p.t>=1){ p.t=0; p.c=curves[(Math.random()*curves.length)|0]; p.v=.16+Math.random()*.30; }
    var pos=p.c.getPoint(p.t); p.s.position.copy(pos);
    p.s.material.opacity=Math.sin(p.t*Math.PI);
  }
  renderer.render(scene,cam);
})();
window.addEventListener('resize',function(){
  var w=host.clientWidth,h=host.clientHeight;
  renderer.setSize(w,h,false); cam.aspect=w/h; cam.updateProjectionMatrix();
});
}
boot();
})();