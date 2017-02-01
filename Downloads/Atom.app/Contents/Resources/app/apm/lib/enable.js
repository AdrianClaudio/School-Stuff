(function() {
  var CSON, Command, Enable, _, config, path, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  path = require('path');

  CSON = require('season');

  yargs = require('yargs');

  config = require('./apm');

  Command = require('./command');

  module.exports = Enable = (function(superClass) {
    extend(Enable, superClass);

    function Enable() {
      return Enable.__super__.constructor.apply(this, arguments);
    }

    Enable.commandNames = ['enable'];

    Enable.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("\nUsage: apm enable [<package_name>]...\n\nEnables the named package(s).");
      return options.alias('h', 'help').describe('help', 'Print this usage message');
    };

    Enable.prototype.run = function(options) {
      var callback, configFilePath, disabledPackages, error, error1, error2, errorPackages, keyPath, packageNames, ref, result, settings;
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
      keyPath = '*.core.disabledPackages';
      disabledPackages = (ref = _.valueForKeyPath(settings, keyPath)) != null ? ref : [];
      errorPackages = _.difference(packageNames, disabledPackages);
      if (errorPackages.length > 0) {
        console.log("Not Disabled:\n  " + (errorPackages.join('\n  ')));
      }
      packageNames = _.difference(packageNames, errorPackages);
      if (packageNames.length === 0) {
        callback("Please specify a package to enable");
        return;
      }
      result = _.difference(disabledPackages, packageNames);
      _.setValueForKeyPath(settings, keyPath, result);
      try {
        CSON.writeFileSync(configFilePath, settings);
      } catch (error2) {
        error = error2;
        callback("Failed to save `" + configFilePath + "`: " + error.message);
        return;
      }
      console.log("Enabled:\n  " + (packageNames.join('\n  ')));
      this.logSuccess();
      return callback();
    };

    return Enable;

  })(Command);

}).call(this);
