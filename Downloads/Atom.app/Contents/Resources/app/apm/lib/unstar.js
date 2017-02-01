(function() {
  var Command, Login, Unstar, async, config, request, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  async = require('async');

  yargs = require('yargs');

  config = require('./apm');

  Command = require('./command');

  Login = require('./login');

  request = require('./request');

  module.exports = Unstar = (function(superClass) {
    extend(Unstar, superClass);

    function Unstar() {
      return Unstar.__super__.constructor.apply(this, arguments);
    }

    Unstar.commandNames = ['unstar'];

    Unstar.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("\nUsage: apm unstar <package_name>...\n\nUnstar the given packages on https://atom.io\n\nRun `apm stars` to see all your starred packages.");
      return options.alias('h', 'help').describe('help', 'Print this usage message');
    };

    Unstar.prototype.starPackage = function(packageName, token, callback) {
      var requestSettings;
      if (process.platform === 'darwin') {
        process.stdout.write('\uD83D\uDC5F \u2B50  ');
      }
      process.stdout.write("Unstarring " + packageName + " ");
      requestSettings = {
        json: true,
        url: (config.getAtomPackagesUrl()) + "/" + packageName + "/star",
        headers: {
          authorization: token
        }
      };
      return request.del(requestSettings, (function(_this) {
        return function(error, response, body) {
          var message, ref, ref1;
          if (body == null) {
            body = {};
          }
          if (error != null) {
            _this.logFailure();
            return callback(error);
          } else if (response.statusCode !== 204) {
            _this.logFailure();
            message = (ref = (ref1 = body.message) != null ? ref1 : body.error) != null ? ref : body;
            return callback("Unstarring package failed: " + message);
          } else {
            _this.logSuccess();
            return callback();
          }
        };
      })(this));
    };

    Unstar.prototype.run = function(options) {
      var callback, packageNames;
      callback = options.callback;
      options = this.parseOptions(options.commandArgs);
      packageNames = this.packageNamesFromArgv(options.argv);
      if (packageNames.length === 0) {
        callback("Please specify a package name to unstar");
        return;
      }
      return Login.getTokenOrLogin((function(_this) {
        return function(error, token) {
          var commands;
          if (error != null) {
            return callback(error);
          }
          commands = packageNames.map(function(packageName) {
            return function(callback) {
              return _this.starPackage(packageName, token, callback);
            };
          });
          return async.waterfall(commands, callback);
        };
      })(this));
    };

    return Unstar;

  })(Command);

}).call(this);
