(function() {
  var Command, Links, config, fs, path, tree, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  yargs = require('yargs');

  Command = require('./command');

  config = require('./apm');

  fs = require('./fs');

  tree = require('./tree');

  module.exports = Links = (function(superClass) {
    extend(Links, superClass);

    Links.commandNames = ['linked', 'links', 'lns'];

    function Links() {
      this.devPackagesPath = path.join(config.getAtomDirectory(), 'dev', 'packages');
      this.packagesPath = path.join(config.getAtomDirectory(), 'packages');
    }

    Links.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("\nUsage: apm links\n\nList all of the symlinked atom packages in ~/.atom/packages and\n~/.atom/dev/packages.");
      return options.alias('h', 'help').describe('help', 'Print this usage message');
    };

    Links.prototype.getDevPackagePath = function(packageName) {
      return path.join(this.devPackagesPath, packageName);
    };

    Links.prototype.getPackagePath = function(packageName) {
      return path.join(this.packagesPath, packageName);
    };

    Links.prototype.getSymlinks = function(directoryPath) {
      var directory, i, len, ref, symlinkPath, symlinks;
      symlinks = [];
      ref = fs.list(directoryPath);
      for (i = 0, len = ref.length; i < len; i++) {
        directory = ref[i];
        symlinkPath = path.join(directoryPath, directory);
        if (fs.isSymbolicLinkSync(symlinkPath)) {
          symlinks.push(symlinkPath);
        }
      }
      return symlinks;
    };

    Links.prototype.logLinks = function(directoryPath) {
      var links;
      links = this.getSymlinks(directoryPath);
      console.log(directoryPath.cyan + " (" + links.length + ")");
      return tree(links, {
        emptyMessage: '(no links)'
      }, function(link) {
        var error, error1, realpath;
        try {
          realpath = fs.realpathSync(link);
        } catch (error1) {
          error = error1;
          realpath = '???'.red;
        }
        return (path.basename(link).yellow) + " -> " + realpath;
      });
    };

    Links.prototype.run = function(options) {
      var callback;
      callback = options.callback;
      this.logLinks(this.devPackagesPath);
      this.logLinks(this.packagesPath);
      return callback();
    };

    return Links;

  })(Command);

}).call(this);
