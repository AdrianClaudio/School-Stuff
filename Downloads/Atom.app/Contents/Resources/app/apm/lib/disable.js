(function() {
  var CSON, Command, Disable, List, _, config, path, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  _ = require('underscore-plus');

  path = require('path');

  CSON = require('season');

  yargs = require('yargs');

  config = require('./apm');

  Command = require('./command');

  List = require('./list');

  module.exports = Disable = (function(superClass) {
    extend(Disable, superClass);

    function Disable() {
      return Disable.__super__.constructor.apply(this, arguments);
    }

    Disable.commandNames = ['disable'];

    Disable.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("\nUsage: apm disable [<package_name>]...\n\nDisables the named package(s).");
      return options.alias('h', 'help').describe('help', 'Print this usage message');
    };

    Disable.prototype.getInstalledPackages = function(callback) {
      var lister, options;
      options = {
        argv: {
          theme: false,
          bare: true
        }
      };
      lister = new List();
      return lister.listBundledPackages(options, function(error, core_packages) {
        return lister.listDevPackages(options, function(error, dev_packages) {
          return lister.listUserPackages(options, function(error, user_packages) {
            return callback(null, core_packages.concat(dev_packages, user_packages));
          });
        });
      });
    };

    Disable.prototype.run = function(options) {
      var callback, configFilePath, error, error1, packageNames, settings;
      callback = options.callback;
      options = this.parseOptions(options.commandArgs);
      packageNames = this.packageNamesFromArgv(options.argv);
      configFilePath = CSON.resolve(path.join(config.getAtomDirectory(), 'config'));
      if (!configFilePath) {
        callback("Could not find config.cson. Run Atom first?");
        return;
      }
      try {
        settings = CSON.readFileSync(configFilePath);
      } catch (error1) {
        error = error1;
        callback("Failed to load `" + configFilePath + "`: " + error.message);
        return;
      }
      return this.getInstalledPackages((function(_this) {
        return function(error, installedPackages) {
          var disabledPackages, error2, installedPackageNames, keyPath, pkg, ref, result, uninstalledPackageNames;
          if (error) {
            return callback(error);
          }
          installedPackageNames = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = installedPackages.length; i < len; i++) {
              pkg = installedPackages[i];
              results.push(pkg.name);
            }
            return results;
          })();
          uninstalledPackageNames = _.difference(packageNames, installedPackageNames);
          if (uninstalledPackageNames.length > 0) {
            console.log("Not Installed:\n  " + (uninstalledPackageNames.join('\n  ')));
          }
          packageNames = _.difference(packageNames, uninstalledPackageNames);
          if (packageNames.length === 0) {
            callback("Please specify a package to disable");
            return;
          }
          keyPath = '*.core.disabledPackages';
          disabledPackages = (ref = _.valueForKeyPath(settings, keyPath)) != null ? ref : [];
          result = _.union.apply(_, [disabledPackages].concat(slice.call(packageNames)));
          _.setValueForKeyPath(settings, keyPath, result);
          try {
            CSON.writeFileSync(configFilePath, settings);
          } catch (error2) {
            error = error2;
            callback("Failed to save `" + configFilePath + "`: " + error.message);
            return;
          }
          console.log("Disabled:\n  " + (packageNames.join('\n  ')));
          _this.logSuccess();
          return callback();
        };
      })(this));
    };

    return Disable;

  })(Command);

}).call(this);
