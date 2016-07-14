var util = require('util');

/**
 * A simple contex plugin to draw primitive shapes
 * 
 * @module contex-primitives

*/

module.exports = function(c){
  var Contex = c.Contex;
  var Objec = c.Objec;
  var Color = c.Color;
  
  /**
   * The Ellipse Objec
   * 
   * @class Ellipse
   * @constructor
   * @param {int} w The width of the ellipse
   * @param {int} h The height of the ellipse
   * @extends Objec
   */
   
  /**
   * The fill color of the Circle
   *
   * @property fillColor
   * @type Color
   * @default Colors.White
   */
   
  /**
   * The stroke color of the Circle
   *
   * @property strokeColor
   * @type Color
   * @default Colors.White
   */
   
  /**
   * The stroke width of the Circle
   *
   * @property strokeWidth
   * @type Color
   * @default Colors.Black
   */
   
  /**
   * The fill mode of the circle
   *
   * @property fillMode
   * @type FillMode
   * @default FillModes.Fill | FillModes.Stroke
   */
  function Ellipse(w,h){
    this.fillColor = new Color("#fff");
    this.strokeColor = new Color("#000");
    this.strokeWidth = 2;
    
    this.fillMode = 1 | 2;
    
    this.super(w,h);
  }
  
  
  /**/
  Ellipse.prototype.super = function(w,h){
    this.image = new Contex(w,h);
    this.update();
  };
  
  Ellipse.prototype.resize = function(w,h){
    this.image.resize(w,h);
    this.update();
  };
  
  Ellipse.prototype.drawOnto = function(contex,x,y,anchor,w,h){
    contex.drawObjec(this,x,y,anchor,w,h);
  };
  /**/
  
  //util.inherits(Ellipse, Objec);
  
  Ellipse.prototype.update = function(){
    this.image.clear();
    
    this.image.ctx.fillStyle = this.fillColor.get();
    this.image.ctx.strokeStyle = this.strokeColor.get();
    this.image.ctx.lineWidth = this.strokeWidth.get();
    
    this.image.ctx.beginPath();
    this.image.ctx.ellipse(this.image.dom.width/2, this.image.dom.height/2, (this.image.dom.width-this.strokeWidth)/2, (this.image.dom.height-this.strokeWidth)/2, 0 * Math.PI/180, 0, 2 * Math.PI);
    if((this.fillMode & 1) == 1)this.image.ctx.stroke();
    if((this.fillMode & 2) == 2)this.image.ctx.fill();
  };
  return Ellipse;
};