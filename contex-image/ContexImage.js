module.exports = function(c){
  return {
    Image: require("./ContexImages/Image")(c),
    ImageObjec: require("./ContexImages/ImageObjec")(c)
  };
};