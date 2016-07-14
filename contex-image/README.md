# Contex Image

## Usage

### Initialization
    
    var CI = require("contex-image")(C); // C is what you set require("contex") equal to
    
    var Image = CI.Image;
    var ImageObjec = CI.ImageObjec

## Image
    
    var image = new Image("http://image.source.url");
    
    image.events.on("load", function(){
      // image loaded  
    }.bind(this);

## ImageObjec    
    
    var imageObjec = new imageObjec(image, /* Information for spritemapping*/ /*x*/ 0, /*y*/ 0, /*w*/ 10, /*h*/ 10);
    
    imageObjec.drawOnto(mainContex, 50, 50); // make sure you draw the image after it is loaded (if you draw before, you will either get nothing or a loading icon)