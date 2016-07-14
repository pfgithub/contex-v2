module.exports = function(Contex){
  /**
   * The contex module
   * 
   * @module contex
  
  */
  
  /**
   * The top level Objec (A thing you draw to a contex). Subclass this when making a new Objec
   *
   * @class Objec
   * @constructor
   * @param {int} width The width of the Objec
   * @param {int} height The height of the Objec
   */
  function Objec(w,h){
    this.super(w,h);
  }
  /**
   * The method you run to initialize a subclassed objec
   * 
   * @method super
   * @param {int} w The width of the Objec
   * @param {int} h The height of the Objec
   * 
   */
  Objec.prototype.super = function(w,h){
    this.image = new Contex(w,h);
    this.update();
  };
  
  /**
   * Update an Objec's image if you have changed it's properties or it is drawing the wrong thing to the screen
   * 
   * @method update
   * 
   */
  Objec.prototype.update = function(){
    this.image.clear();
  };
  
  
  /**
   * Resize an objec's internal contex
   * 
   * @method resize
   * @param {int} w The new width of the Objec
   * @param {int} h The new height of the Objec
   */
  Objec.prototype.resize = function(w,h){
    this.image.resize(w,h);
    this.update();
  };

  /**
   * Draw an Objec to a contex
   * 
   * @method drawOnto
   * @param {Contex} contex The contex to draw onto
   * @param {int} x The x position where you would like to draw
   * @param {int} y The y position where you would like to draw
   * @param {Object x:0,y:0} [anchor=x:0,y:0] The anchor point from x:0,y:0 to x:1,y:1 for where on the image x and y correlate to
   * @param {int} [w=objec.image.dom.w] The width of the objec you are drawing, defaulting to the objec's width (objec.image.dom.w) (will stretch the image)
   * @param {int} [h=objec.image.dom.h] The height of the objec you are drawing, defaulting to the objec's height (objec.image.dom.h) (will stretch the image)
   */
  Objec.prototype.drawOnto = function(contex,x,y,anchor,w,h){
    contex.drawObjec(this,x,y,anchor,w,h);
  };
  
  return Objec;
};