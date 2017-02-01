(function() {
  var CSON, Command, Uninstall, async, auth, config, fs, path, request, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  async = require('async');

  CSON = require('season');

  yargs = require('yargs');

  auth = require('./auth');

  Command = require('./command');

  config = require('./apm');

  fs = require('./fs');

  request = require('./request');

  module.exports = Uninstall = (function(superClass) {
    extend(Uninstall, superClass);

    function Uninstall() {
      return Uninstall.__super__.constructor.apply(this, arguments);
    }

    Uninstall.commandNames = ['deinstall', 'delete', 'erase', 'remove', 'rm', 'uninstall'];

    Uninstall.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("\nUsage: apm uninstall <package_name>...\n\nDelete the installed package(s) from the ~/.atom/packages directory.");
      options.alias('h', 'help').describe('help', 'Print this usage message');
      options.alias('d', 'dev').boolean('dev').describe('dev', 'Uninstall from ~/.atom/dev/packages');
      return options.boolean('hard').describe('hard', 'Uninstall from ~/.atom/packages and ~/.atom/dev/packages');
    };

    Uninstall.prototype.getPackageVersion = function(packageDirectory) {
      var error, error1, ref;
      try {
        return (ref = CSON.readFileSync(path.join(packageDirectory, 'package.json'))) != null ? ref.version : void 0;
      } catch (error1) {
        error = error1;
        return null;
      }
    };

    Uninstall.prototype.registerUninstall = function(arg, callback) {
      var packageName, packageVersion;
      packageName = arg.packageName, packageVersion = arg.packageVersion;
      if (!packageVersion) {
        return callback();
      }
      return auth.getToken(function(error, token) {
        var requestOptions;
        if (!token) {
          return callback();
        }
        requestOptions = {
          url: (config.getAtomPackagesUrl()) + "/" + packageName + "/versions/" + packageVersion + "/events/uninstall",
          json: true,
          headers: {
            authorization: token
          }
        };
        return request.post(requestOptions, function(error, response, body) {
          return callback();
        });
      });
    };

    Uninstall.prototype.run = function(options) {
      var callback, devPackagesDirectory, error, error1, i, len, packageDirectory, packageName, packageNames, packageVersion, packagesDirectory, uninstallError, uninstallsToRegister;
      callback = options.callback;
      options = this.parseOptions(options.commandArgs);
      packageNames = this.packageNamesFromArgv(options.argv);
      if (packageNames.length === 0) {
        callback("Please specify a package name to uninstall");
        return;
      }
      packagesDirectory = path.join(config.getAtomDirectory(), 'packages');
      devPackagesDirectory = path.join(config.getAtomDirectory(), 'dev', 'packages');
      uninstallsToRegister = [];
      uninstallError = null;
      for (i = 0, len = packageNames.length; i < len; i++) {
        packageName = packageNames[i];
        process.stdout.write("Uninstalling " + packageName + " ");
        try {
          if (!options.argv.dev) {
            packageDirectory = path.join(packagesDirectory, packageName);
            if (fs.existsSync(packageDirectory)) {
              packageVersion = this.getPackageVersion(packageDirectory);
              fs.removeSync(packageDirectory);
              if (packageVersion) {
                uninstallsToRegister.push({
                  packageName: packageName,
                  packageVersion: packageVersion
                });
              }
            } else if (!options.argv.hard) {
              throw new Error("Does not exist");
            }
          }
          if (options.argv.hard || options.argv.dev) {
            packageDirectory = path.join(devPackagesDirectory, packageName);
            if (fs.existsSync(packageDirectory)) {
              fs.removeSync(packageDirectory);
            } else if (!options.argv.hard) {
              throw new Error("Does not exist");
            }
          }
          this.logSuccess();
        } catch (error1) {
          error = error1;
          this.logFailure();
          uninstallError = new Error("Failed to delete " + packageName + ": " + error.message);
          break;
        }
      }
      return async.eachSeries(uninstallsToRegister, this.registerUninstall.bind(this), function() {
        return callback(uninstallError);
      });
    };

    return Uninstall;

  })(Command);

}).call(this);
