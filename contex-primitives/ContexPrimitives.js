
/**
 * A simple contex plugin to draw primitive shapes
 * 
 * Make sure to initialize this with require('contex-primitives')(C) where C is your require('contex')
 * 
 * @module contex-primitives

*/

	
/**
 * Fill Modes for your primitives
 *
 * @element FillMode
 */
   
/**
 * Draw a stroke on the primitive
 *
 * @attribute Stroke
 * @type FillMode
 * @default FillModes.Stroke
 */
   
/**
 * Fill in the primitive
 *
 * @attribute Fill
 * @type FillMode
 * @default FillModes.Fill
 */

module.exports = function(c){
  return {
    Rectangle: require("./ContexPrimitives/Rectangle")(c),
    Ellipse: require("./ContexPrimitives/Ellipse")(c),
    FillModes: {
      Stroke: 1,
      Fill: 2
    }
  };
};