module.exports = function(Contex){
  /**
   * The contex module
   * 
   * @module contex
  
  */
  
  /**
   * Colors for drawing things
   *
   * @class Color
   * @constructor
   * @param {string} value The CSS color value of the color
   */
  function Color(hex){
      this.hex = hex;
  }
  /**
   * The color for internal use
   * 
   * @method get
   * @return {string} color The color for use internally
   */
  Object.prototype.get = function(){
    return this.hex;
  };
  
  return Color;
};