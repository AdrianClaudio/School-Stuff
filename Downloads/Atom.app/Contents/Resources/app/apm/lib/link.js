(function() {
  var CSON, Command, Link, config, fs, path, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  CSON = require('season');

  yargs = require('yargs');

  Command = require('./command');

  config = require('./apm');

  fs = require('./fs');

  module.exports = Link = (function(superClass) {
    extend(Link, superClass);

    function Link() {
      return Link.__super__.constructor.apply(this, arguments);
    }

    Link.commandNames = ['link', 'ln'];

    Link.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("\nUsage: apm link [<package_path>]\n\nCreate a symlink for the package in ~/.atom/packages. The package in the\ncurrent working directory is linked if no path is given.\n\nRun `apm links` to view all the currently linked packages.");
      options.alias('h', 'help').describe('help', 'Print this usage message');
      return options.alias('d', 'dev').boolean('dev').describe('dev', 'Link to ~/.atom/dev/packages');
    };

    Link.prototype.run = function(options) {
      var callback, error, error1, linkPath, packageName, packagePath, ref, ref1, targetPath;
      callback = options.callback;
      options = this.parseOptions(options.commandArgs);
      packagePath = (ref = (ref1 = options.argv._[0]) != null ? ref1.toString() : void 0) != null ? ref : '.';
      linkPath = path.resolve(process.cwd(), packagePath);
      try {
        packageName = CSON.readFileSync(CSON.resolve(path.join(linkPath, 'package'))).name;
      } catch (undefined) {}
      if (!packageName) {
        packageName = path.basename(linkPath);
      }
      if (options.argv.dev) {
        targetPath = path.join(config.getAtomDirectory(), 'dev', 'packages', packageName);
      } else {
        targetPath = path.join(config.getAtomDirectory(), 'packages', packageName);
      }
      if (!fs.existsSync(linkPath)) {
        callback("Package directory does not exist: " + linkPath);
        return;
      }
      try {
        if (fs.isSymbolicLinkSync(targetPath)) {
          fs.unlinkSync(targetPath);
        }
        fs.makeTreeSync(path.dirname(targetPath));
        fs.symlinkSync(linkPath, targetPath, 'junction');
        console.log(targetPath + " -> " + linkPath);
        return callback();
      } catch (error1) {
        error = error1;
        return callback("Linking " + targetPath + " to " + linkPath + " failed: " + error.message);
      }
    };

    return Link;

  })(Command);

}).call(this);
