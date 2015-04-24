var char = '0123456789abcdefghiklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

module.exports = function(length) {
  length = length ? length : 32;

  var str = '';

  for (var i = 0; i < length; i++) {
    var randomNum = Math.floor(Math.random() * char.length);
    str += char.substring(randomNum, randomNum + 1);
  }

  return str;
}
