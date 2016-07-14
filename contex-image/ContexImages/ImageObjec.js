var util = require('util');

module.exports = function(c){
  var Contex = c.Contex;
  var Objec = c.Objec;
  var Color = c.Color;
  
  function ImageObjec(image, x, y, w, h){
    this.img = image;
    this.x = -x;
    this.y = -y;
    this.super(w,h);
    
    this.img.events.on("load",function(){
      this.update();
    }.bind(this));
    
    this.img.events.on("nlloaded",function(){
      this.update();
    }.bind(this));
  }
  
  /**/
  ImageObjec.prototype.super = function(w,h){
    this.image = new Contex(w,h);
    this.update();
  };
  
  ImageObjec.prototype.resize = function(w,h){
    this.image.resize(w,h);
    this.update();
  };
  
  ImageObjec.prototype.drawOnto = function(contex,x,y,anchor,w,h){
    contex.drawObjec(this,x,y,anchor,w,h);
  };
  /**/
  
  ImageObjec.prototype.update = function(){
    this.image.clear();
    if(this.img.isLoaded)
      this.image.ctx.drawImage(this.img.dom, this.x, this.y);
    else if(this.img.nlloaded)
      this.image.ctx.drawImage(this.img.notLoaded, 0,0,this.image.dom.width, this.image.dom.height);
  };
  
  return ImageObjec;
};