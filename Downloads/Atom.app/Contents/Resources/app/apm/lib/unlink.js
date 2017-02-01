(function() {
  var CSON, Command, Unlink, config, fs, path, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  CSON = require('season');

  yargs = require('yargs');

  Command = require('./command');

  config = require('./apm');

  fs = require('./fs');

  module.exports = Unlink = (function(superClass) {
    extend(Unlink, superClass);

    Unlink.commandNames = ['unlink'];

    function Unlink() {
      this.devPackagesPath = path.join(config.getAtomDirectory(), 'dev', 'packages');
      this.packagesPath = path.join(config.getAtomDirectory(), 'packages');
    }

    Unlink.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("\nUsage: apm unlink [<package_path>]\n\nDelete the symlink in ~/.atom/packages for the package. The package in the\ncurrent working directory is unlinked if no path is given.\n\nRun `apm links` to view all the currently linked packages.");
      options.alias('h', 'help').describe('help', 'Print this usage message');
      options.alias('d', 'dev').boolean('dev').describe('dev', 'Unlink package from ~/.atom/dev/packages');
      options.boolean('hard').describe('hard', 'Unlink package from ~/.atom/packages and ~/.atom/dev/packages');
      return options.alias('a', 'all').boolean('all').describe('all', 'Unlink all packages in ~/.atom/packages and ~/.atom/dev/packages');
    };

    Unlink.prototype.getDevPackagePath = function(packageName) {
      return path.join(this.devPackagesPath, packageName);
    };

    Unlink.prototype.getPackagePath = function(packageName) {
      return path.join(this.packagesPath, packageName);
    };

    Unlink.prototype.unlinkPath = function(pathToUnlink) {
      var error, error1;
      try {
        process.stdout.write("Unlinking " + pathToUnlink + " ");
        if (fs.isSymbolicLinkSync(pathToUnlink)) {
          fs.unlinkSync(pathToUnlink);
        }
        return this.logSuccess();
      } catch (error1) {
        error = error1;
        this.logFailure();
        throw error;
      }
    };

    Unlink.prototype.unlinkAll = function(options, callback) {
      var child, error, error1, i, j, len, len1, packagePath, ref, ref1;
      try {
        ref = fs.list(this.devPackagesPath);
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          packagePath = path.join(this.devPackagesPath, child);
          if (fs.isSymbolicLinkSync(packagePath)) {
            this.unlinkPath(packagePath);
          }
        }
        if (!options.argv.dev) {
          ref1 = fs.list(this.packagesPath);
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            child = ref1[j];
            packagePath = path.join(this.packagesPath, child);
            if (fs.isSymbolicLinkSync(packagePath)) {
              this.unlinkPath(packagePath);
            }
          }
        }
        return callback();
      } catch (error1) {
        error = error1;
        return callback(error);
      }
    };

    Unlink.prototype.unlinkPackage = function(options, callback) {
      var error, error1, error2, linkPath, packageName, packagePath, ref, ref1, targetPath;
      packagePath = (ref = (ref1 = options.argv._[0]) != null ? ref1.toString() : void 0) != null ? ref : '.';
      linkPath = path.resolve(process.cwd(), packagePath);
      try {
        packageName = CSON.readFileSync(CSON.resolve(path.join(linkPath, 'package'))).name;
      } catch (undefined) {}
      if (!packageName) {
        packageName = path.basename(linkPath);
      }
      if (options.argv.hard) {
        try {
          this.unlinkPath(this.getDevPackagePath(packageName));
          this.unlinkPath(this.getPackagePath(packageName));
          return callback();
        } catch (error1) {
          error = error1;
          return callback(error);
        }
      } else {
        if (options.argv.dev) {
          targetPath = this.getDevPackagePath(packageName);
        } else {
          targetPath = this.getPackagePath(packageName);
        }
        try {
          this.unlinkPath(targetPath);
          return callback();
        } catch (error2) {
          error = error2;
          return callback(error);
        }
      }
    };

    Unlink.prototype.run = function(options) {
      var callback;
      callback = options.callback;
      options = this.parseOptions(options.commandArgs);
      if (options.argv.all) {
        return this.unlinkAll(options, callback);
      } else {
        return this.unlinkPackage(options, callback);
      }
    };

    return Unlink;

  })(Command);

}).call(this);
