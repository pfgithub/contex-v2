/**
 * The contex module
 * 
 * @module contex

*/

/**
 * The main Contex class
 *
 * @class Contex
 * @constructor
 * @param {int} width The width of the contex
 * @param {int} height The height of the contex
 * @param {bool} [useDoubleBuffering=false] Wether or not to use double buffering
 */

/**
 * A position to offset all drawn things by
 *
 * @property camera
 * @type Object x:0,y:0
 * @default x:0,y:0
 */

function Contex(w,h,db){
    if(h && w){
        this.dom = document.createElement("canvas");
        this.dom.width = w;
        this.dom.height = h;
    }else if(w){
        this.dom = w;
    }else if(h){
        this.dom = h.canvas;
    }
    
    if(db){
        var dd = document.createElement("canvas");
        dd.width = this.dom.width;
        dd.height = this.dom.height;
        
        this.ctx = dd.getContext("2d");
        this._dtx = this.dom.getContext("2d");
    }else{
        this.ctx = this.dom.getContext("2d");
    }
    
    this.camera = {x:0,y:0};
} // ctx.translate - no cameras needed

/**
 * Run after drawing everything when using double buffering
 * 
 * @method swap
 */
Contex.prototype.swap = function(){
    if(this._dtx)this._dtx.drawImage(this.ctx.canvas, 0, 0);
};

/**
 * Draw an Objec to the contex
 * 
 * @method drawObjec
 * @param {Objec} objec The objec to draw
 * @param {int} x The x position of the objec you would like to draw
 * @param {int} y The y position of the objec you would like to draw
 * @param {Object x:0,y:0} [anchor=x:0,y:0] The anchor point from x:0,y:0 to x:1,y:1 for where on the image x and y correlate to
 * @param {int} [w=objec.image.dom.w] The width of the objec you are drawing, defaulting to the objec's width (objec.image.dom.w) (will stretch the image)
 * @param {int} [h=objec.image.dom.h] The height of the objec you are drawing, defaulting to the objec's height (objec.image.dom.h) (will stretch the image)
 */
Contex.prototype.drawObjec = function(objec,x,y, anchor,w,h){
    this.drawImage(objec.image,x,y, anchor,w,h);
};

/**
 * Draw a Contex to the contex
 * 
 * @method drawImage
 * @param {Contex} contex The contex to draw
 * @param {int} x The x position of the contex you would like to draw
 * @param {int} y The y position of the contex you would like to draw
 * @param {Object ({x: 0, y: 0})} [anchor=x:0,y:0] The anchor point from x:0,y:0 to x:1,y:1 for where on the image x and y correlate to
 * @param {int} [w=contex.dom.w] The width of the contex you are drawing, defaulting to the contex's width (contex.dom.w) (will stretch the image)
 * @param {int} [h=contex.dom.h] The height of the contex you are drawing, defaulting to the contex's height (contex.dom.h) (will stretch the image)
 */
Contex.prototype.drawImage = function(contex,x,y, anchor,ww,hh){
    var xmask = anchor ? anchor.x : 0;
    var ymask = anchor ? anchor.y : 0;
    var w = ww || contex.dom.width;
    var h = hh || contex.dom.height;
    var xadd = xmask * w;
    var yadd = ymask * h;
    this.ctx.drawImage(contex.dom,x-xadd + this.camera.x,y-yadd + this.camera.y,ww || contex.dom.width, hh||contex.dom.height);
};
/**
 * Resize the contex (shows white space where empty)
 * 
 * This is somewhat resource intensive, don't run this all the time.
 * 
 * @method resize
 * @param {int} w The new width of the contex
 * @param {int} h The new height of the contex
 */
Contex.prototype.resize = function(w,h){
    var newctx = new Contex(w,h);
    newctx.drawImage(this,0,0);
    this.dom.width = w;
    this.dom.height = h;
    this.drawImage(newctx,0,0);
    
    if(this._dtx){
        this.ctx.canvas.width = w;
        this.ctx.canvas.height = h;
        this.swap();
    }
    
    return;
};
/**
 * Clear the contex
 * 
 * @method clear
 * @param {Color} [color=Colors.Transparent] The color to reset the contex to after it is cleared
 */
Contex.prototype.clear = function(color){
    this.ctx.fillStyle = (color || Colors.Transparent).get();
    this.ctx.strokeStyle = (color || Colors.Transparent).get();
    this.ctx.lineWidth = 0;
    
    var oldcop = this.ctx.globalCompositeOperation;
    if((color || Colors.Transparent) == Colors.Transparent){
        
    
        this.ctx.globalCompositeOperation = "destination-out";
    }
    
    this.ctx.beginPath();
    var sw = (0);
    this.ctx.rect(0+sw,0+sw, this.dom.width-sw*2, this.dom.height-sw*2);
    this.ctx.fill();
    
    this.ctx.globalCompositeOperation = oldcop;
};

var Objec = require("./Contex/Objec.js")(Contex);
var Color = require("./Contex/Color.js")(Color);

/**
 * Basic Colors
 *
 * @element Colors
 */
   
/**
 * White
 *
 * @attribute White
 * @type Color
 * @default Colors.White
 */
   
/**
 * Red
 *
 * @attribute Red
 * @type Color
 * @default Colors.Red
 */
   
/**
 * Transparent
 *
 * @attribute Transparent
 * @type Color
 * @default Colors.Transparent
 */
   
/**
 * Black
 *
 * @attribute Black
 * @type Color
 * @default Colors.Black
 */


var Colors = {
    "White": new Color("white"),
    "Red": new Color("red"),
    "Transparent": new Color("rgba(0,0,0,1)"),
    "Black": new Color("black")
};

module.exports = {
    Contex: Contex,
    Objec: Objec,
    Color: Color,
    Colors: Colors
};