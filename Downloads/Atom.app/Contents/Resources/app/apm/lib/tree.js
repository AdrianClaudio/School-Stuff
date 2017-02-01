(function() {
  var _;

  _ = require('underscore-plus');

  module.exports = function(items, options, callback) {
    var emptyMessage, i, index, item, itemLine, len, ref, results;
    if (options == null) {
      options = {};
    }
    if (_.isFunction(options)) {
      callback = options;
      options = {};
    }
    if (callback == null) {
      callback = function(item) {
        return item;
      };
    }
    if (items.length === 0) {
      emptyMessage = (ref = options.emptyMessage) != null ? ref : '(empty)';
      return console.log("\u2514\u2500\u2500 " + emptyMessage);
    } else {
      results = [];
      for (index = i = 0, len = items.length; i < len; index = ++i) {
        item = items[index];
        if (index === items.length - 1) {
          itemLine = '\u2514\u2500\u2500 ';
        } else {
          itemLine = '\u251C\u2500\u2500 ';
        }
        results.push(console.log("" + itemLine + (callback(item))));
      }
      return results;
    }
  };

}).call(this);
