(function() {
  var Command, RebuildModuleCache, async, config, fs, path, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  async = require('async');

  yargs = require('yargs');

  Command = require('./command');

  config = require('./apm');

  fs = require('./fs');

  module.exports = RebuildModuleCache = (function(superClass) {
    extend(RebuildModuleCache, superClass);

    RebuildModuleCache.commandNames = ['rebuild-module-cache'];

    function RebuildModuleCache() {
      this.atomPackagesDirectory = path.join(config.getAtomDirectory(), 'packages');
    }

    RebuildModuleCache.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("\nUsage: apm rebuild-module-cache\n\nRebuild the module cache for all the packages installed to\n~/.atom/packages\n\nYou can see the state of the module cache for a package by looking\nat the _atomModuleCache property in the package's package.json file.\n\nThis command skips all linked packages.");
      return options.alias('h', 'help').describe('help', 'Print this usage message');
    };

    RebuildModuleCache.prototype.getResourcePath = function(callback) {
      if (this.resourcePath) {
        return process.nextTick((function(_this) {
          return function() {
            return callback(_this.resourcePath);
          };
        })(this));
      } else {
        return config.getResourcePath((function(_this) {
          return function(resourcePath1) {
            _this.resourcePath = resourcePath1;
            return callback(_this.resourcePath);
          };
        })(this));
      }
    };

    RebuildModuleCache.prototype.rebuild = function(packageDirectory, callback) {
      return this.getResourcePath((function(_this) {
        return function(resourcePath) {
          var error, error1;
          try {
            if (_this.moduleCache == null) {
              _this.moduleCache = require(path.join(resourcePath, 'src', 'module-cache'));
            }
            _this.moduleCache.create(packageDirectory);
          } catch (error1) {
            error = error1;
            return callback(error);
          }
          return callback();
        };
      })(this));
    };

    RebuildModuleCache.prototype.run = function(options) {
      var callback, commands;
      callback = options.callback;
      commands = [];
      fs.list(this.atomPackagesDirectory).forEach((function(_this) {
        return function(packageName) {
          var packageDirectory;
          packageDirectory = path.join(_this.atomPackagesDirectory, packageName);
          if (fs.isSymbolicLinkSync(packageDirectory)) {
            return;
          }
          if (!fs.isFileSync(path.join(packageDirectory, 'package.json'))) {
            return;
          }
          return commands.push(function(callback) {
            process.stdout.write("Rebuilding " + packageName + " module cache ");
            return _this.rebuild(packageDirectory, function(error) {
              if (error != null) {
                _this.logFailure();
              } else {
                _this.logSuccess();
              }
              return callback(error);
            });
          });
        };
      })(this));
      return async.waterfall(commands, callback);
    };

    return RebuildModuleCache;

  })(Command);

}).call(this);
