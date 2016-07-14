var util = require('util');
var events = require('events');

var nlsrc = [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAIVBMVEX///98fHz6+vqMjIyWlpa+vr7Q0NC2tra",
      "EhITo6Oiurq7gQ/BeAAAAXElEQVQYlYWOSRbAIAxCIYPT/Q9cjUNdtWzC+wYi8C8xdgHZ5SZAodYFNEBS6txxqnE+eABjEhsmMQbGPm53gCzX",
      "I2O0E/HZzrZLe7umkdxnUZUlgJ2/eg7wki89lEABGUoqalIAAAAASUVORK5CYII="
    ].join("");

module.exports = function(c){
  var Contex = c.Contex;
  var Objec = c.Objec;
  var Color = c.Color;
  
  function Image(url){
    this.dom = document.createElement("img");
    this.isLoaded = false;
    this.events = new events.EventEmitter();
    this.dom.addEventListener("load", function(){
      this.isLoaded = true;
      this.events.emit("load");
    }.bind(this));
    this.dom.src = url;
    
    this.notLoaded = document.createElement("img");
    this.notLoaded.src = nlsrc;
    this.nlloaded = false;
    this.notLoaded.addEventListener("load", function(){
      this.nlloaded = true;
      this.events.emit("nlloaded");
    }.bind(this));
  }
  
  //util.inherits(Image, events.EventEmitter); ///why doesn't util.inherits work
  return Image;
};