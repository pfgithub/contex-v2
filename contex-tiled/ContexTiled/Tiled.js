var util = require('util');
var events = require('events');

if (!Object.prototype.keys) {
    Object.prototype.keys = function (obj) {
        var arr = [],
            key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                arr.push(key);
            }
        }
        return arr;
    };
}

module.exports = function(c,CI){
  var Contex = c.Contex;
  var Objec = c.Objec;
  var Color = c.Color;
  
  var Image = CI.Image;
  var ImageObjec = CI.ImageObjec;
  
  function parseMap(map){
    var result = [];
    var tilesets = {};
    var imageObjecs = {};
    
    var size = [0,0];
    
    var event = new events.EventEmitter();
    
    var loadedImages = 0;
    
    var loaded = false;
    
    map.map.forEach(function(layer){
      var layero = [];
      var tileset;
      if(tilesets[layer.tileset]){
        tileset = tilesets[layer.tileset];
      }else{
        tileset = {
          "image": new Image(map.tilesets[layer.tileset].image),
          "tilesize": map.tilesets[layer.tileset].tilesize
        };
        tileset.image.events.on("load",function(){
          loadedImages++;
          console.log("images loaded",loadedImages,"images left",Object.keys(map.tilesets).length);
          if(loadedImages >= Object.keys(map.tilesets).length){
            console.log("all images loaded");
            loaded = true;
            event.emit("loaded");
          }
        });
        tilesets[layer.tileset] = tileset;
      }
      
      var sizex = 0;
      var sizey = 0;
      layer.content.forEach(function(content,y){
        sizex = y;
        var layeroo = [];
        content.split(",").forEach(function(tile,x){
          sizey = x;
          
          if(imageObjecs[tile]){
            layeroo.push({img: imageObjecs[tile], x: x*tileset.tilesize[0], y: y*tileset.tilesize[1]});
          }else{
            if(tile == "-1")
              layeroo.push(undefined);
            else{
              var xs = parseInt(tile.split(".")[0],10);
              var ys = parseInt(tile.split(".")[1],10);
              //console.log(xs, tileset.tilesize, xs*tileset.tilesize[0], ys*tileset.tilesize[1], tileset.tilesize[0], tileset.tilesize[1]);
              var imageObjec = new ImageObjec(tileset.image, xs*tileset.tilesize[0], ys*tileset.tilesize[1], tileset.tilesize[0], tileset.tilesize[1]);
              imageObjecs[tile] = imageObjec;
              layeroo.push({
                img: imageObjec, x: x*tileset.tilesize[0], y: y*tileset.tilesize[1]
              });
            }
          }
        });
        layero.push(layeroo);
      });
      
      sizex *= tileset.tilesize[0];
      sizey *= tileset.tilesize[1];
      
      size = [Math.max(sizex, size[0]), Math.max(sizey, size[1])];
      
      result.push(layero);
    });
    
    return {
      w: size[0],
      h: size[1],
      result: result,
      events: event,
      loaded: loaded
    };
  }
  
  function Tiled(map){
    this.map = parseMap(map);
    
    this.map.events.on("loaded",function(){
      console.log("saw said images");
      this.update();
    }.bind(this));
    
    this.super(this.map.w, this.map.h);
  }
  
  /**/
  Tiled.prototype.super = function(w,h){
    this.image = new Contex(w,h);
    this.update();
  };
  
  Tiled.prototype.resize = function(w,h){
    this.image.resize(w,h);
    this.update();
  };
  
  Tiled.prototype.drawOnto = function(contex,x,y,anchor,w,h){
    contex.drawObjec(this,x,y,anchor,w,h);
  };
  /**/
  
  //util.inherits(Tiled, Objec);
  
  Tiled.prototype.update = function(){
    this.image.clear();
    
    this.map.result.forEach(function(layer){
      layer.forEach(function(tileset, x){
        tileset.forEach(function(tile,y){
          if(tile){
            tile.img.update();
            tile.img.drawOnto(this.image, tile.x,tile.y);
          }
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };
  return Tiled;
};