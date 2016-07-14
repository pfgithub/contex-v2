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
   * The Rectangle Objec
   * 
   * @class Rectangle
   * @constructor
   * @param {int} w The width of the Rectangle
   * @param {int} h The height of the Rectangle
   * @extends Objec
   */
   
  /**
   * The fill color of the Rectangle
   *
   * @property fillColor
   * @type Color
   * @default Colors.White
   */
   
  /**
   * The stroke color of the Rectangle
   *
   * @property strokeColor
   * @type Color
   * @default Colors.White
   */
   
  /**
   * The stroke width of the Rectangle
   *
   * @property strokeWidth
   * @type Color
   * @default Colors.Black
   */
   
  /**
   * The fill mode of the Rectangle
   *
   * @property fillMode
   * @type FillMode
   * @default FillModes.Fill | FillModes.Stroke
   */
  function Rectangle(w,h){
    this.fillColor = new Color("#fff");
    this.strokeColor = new Color("#fff");
    this.strokeWidth = 0;
    
    this.fillMode = 1|2;
    
    this.super(w,h);
  }
  
  
  /**/
  Rectangle.prototype.super = function(w,h){
    this.image = new Contex(w,h);
    this.update();
  };
  
  Rectangle.prototype.resize = function(w,h){
    this.image.resize(w,h);
    this.update();
  };
  
  Rectangle.prototype.drawOnto = function(contex,x,y,anchor,w,h){
    contex.drawObjec(this,x,y,anchor,w,h);
  };
  /**/
  
  //util.inherits(Rectangle, Objec);
  
  Rectangle.prototype.update = function(){
    this.image.clear();
    
    this.image.ctx.fillStyle = this.fillColor.get();
    this.image.ctx.strokeStyle = this.strokeColor.get();
    this.image.ctx.lineWidth = this.strokeWidth;
    
    this.image.ctx.beginPath();
    var sw = (((this.fillMode & 1) == 1)?this.strokeWidth:0);
    this.image.ctx.rect(0+sw,0+sw, this.image.dom.width-sw*2, this.image.dom.height-sw*2);
    if((this.fillMode & 1) == 1)this.image.ctx.stroke();
    if((this.fillMode & 2) == 2)this.image.ctx.fill();
  };
  return Rectangle;
};