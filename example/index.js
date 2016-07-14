var C = require("../contex/index");
var CP = require("../contex-primitives/index")(C);
var CI = require("../contex-image/index")(C);
var CT = require("../contex-tiled/index")(C, CI);

var gloop = require('gloop')();
require('keyboardevent-key-polyfill').polyfill();

var Contex = C.Contex;
var Color = C.Color;
var Colors = C.Colors;
var Anchors = C.Anchors;
var Rectangle = CP.Rectangle;
var FillModes = CP.FillModes;
var Image = CI.Image;
var ImageObjec = CI.ImageObjec;
var Tiled = CT.Tiled;

var mainContex = new Contex(window.innerWidth,window.innerHeight, true);
document.body.appendChild(mainContex.dom);
mainContex.dom.style.position="fixed";
mainContex.dom.style.top="0";
mainContex.dom.style.left="0";
mainContex.dom.style.width="100%";
mainContex.dom.style.height="100%";

var testRect = new ImageObjec(new Image("imgae.png"), 0,0,60,60);//new Rectangle(30,30); // https://i.stack.imgur.com/UAqTj.jpg?s=64&g=1

testRect.fillColor = new Color("#123456");
testRect.strokeColor = new Color("#654321");
testRect.strokeWidth = 5;
testRect.fillMode = FillModes.Fill;
testRect.update();

var testTiled = new Tiled(require("./map.json"));


mainContex.clear(Colors.Red);
testRect.drawOnto(mainContex,50,50, {x: 0.5, y: 0.5});

var xpos = 50;
var ypos = 50;
var prexpos = 0;

var dir = {
  left: false,
  right: false,
  up:false,
  down: false
};

gloop.on('tick', function (dt) {
  if(dir.right)xpos += (dt / 1000)*100;
  if(dir.left)xpos -= (dt / 1000)*100;
  if(dir.up)ypos -= (dt / 1000)*100;
  if(dir.down)ypos += (dt / 1000)*100;
  
  mainContex.clear(Colors.Red);
  mainContex.drawObjec(testTiled,0,0);
  mainContex.drawObjec(testRect,xpos,ypos, {x: 0.5, y: 0.5}, 30, 30);
  
  mainContex.camera.x = -xpos + 0.5*(mainContex.dom.width);
  mainContex.camera.y = -ypos + 0.5*(mainContex.dom.height);
  
  mainContex.swap();
});
 
gloop.on('frame', function (t) {
  //draw
  //update
});
 
gloop.on('start', function () {
});
 
gloop.on('stop', function () {
});
gloop.start();

document.addEventListener('keydown', function (e) {
  if(e.key == "ArrowLeft")dir.left = true;
  if(e.key == "ArrowRight")dir.right = true;
  if(e.key == "ArrowUp")dir.up = true;
  if(e.key == "ArrowDown")dir.down = true;
});

document.addEventListener('keyup', function (e) {
  if(e.key == "ArrowLeft")dir.left = false;
  if(e.key == "ArrowRight")dir.right = false;
  if(e.key == "ArrowUp")dir.up = false;
  if(e.key == "ArrowDown")dir.down = false;
});

window.addEventListener('resize', function (e) {
  mainContex.resize(window.innerWidth,window.innerHeight);
});