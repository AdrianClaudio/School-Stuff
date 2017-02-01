(function() {
  var CSON, Command, List, _, config, fs, getRepository, path, tree, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  _ = require('underscore-plus');

  CSON = require('season');

  yargs = require('yargs');

  Command = require('./command');

  fs = require('./fs');

  config = require('./apm');

  tree = require('./tree');

  getRepository = require("./packages").getRepository;

  module.exports = List = (function(superClass) {
    extend(List, superClass);

    List.commandNames = ['list', 'ls'];

    function List() {
      var configPath, ref, ref1;
      this.userPackagesDirectory = path.join(config.getAtomDirectory(), 'packages');
      this.devPackagesDirectory = path.join(config.getAtomDirectory(), 'dev', 'packages');
      if (configPath = CSON.resolve(path.join(config.getAtomDirectory(), 'config'))) {
        try {
          this.disabledPackages = (ref = CSON.readFileSync(configPath)) != null ? (ref1 = ref.core) != null ? ref1.disabledPackages : void 0 : void 0;
        } catch (undefined) {}
      }
      if (this.disabledPackages == null) {
        this.disabledPackages = [];
      }
    }

    List.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("\nUsage: apm list\n       apm list --themes\n       apm list --packages\n       apm list --installed\n       apm list --installed --bare > my-packages.txt\n       apm list --json\n\nList all the installed packages and also the packages bundled with Atom.");
      options.alias('b', 'bare').boolean('bare').describe('bare', 'Print packages one per line with no formatting');
      options.alias('d', 'dev').boolean('dev')["default"]('dev', true).describe('dev', 'Include dev packages');
      options.alias('h', 'help').describe('help', 'Print this usage message');
      options.alias('i', 'installed').boolean('installed').describe('installed', 'Only list installed packages/themes');
      options.alias('j', 'json').boolean('json').describe('json', 'Output all packages as a JSON object');
      options.alias('l', 'links').boolean('links')["default"]('links', true).describe('links', 'Include linked packages');
      options.alias('t', 'themes').boolean('themes').describe('themes', 'Only list themes');
      return options.alias('p', 'packages').boolean('packages').describe('packages', 'Only list packages');
    };

    List.prototype.isPackageDisabled = function(name) {
      return this.disabledPackages.indexOf(name) !== -1;
    };

    List.prototype.logPackages = function(packages, options) {
      var i, len, pack, packageLine;
      if (options.argv.bare) {
        for (i = 0, len = packages.length; i < len; i++) {
          pack = packages[i];
          packageLine = pack.name;
          if (pack.version != null) {
            packageLine += "@" + pack.version;
          }
          console.log(packageLine);
        }
      } else {
        tree(packages, (function(_this) {
          return function(pack) {
            var ref, repo, shaLine;
            packageLine = pack.name;
            if (pack.version != null) {
              packageLine += "@" + pack.version;
            }
            if (((ref = pack.apmInstallSource) != null ? ref.type : void 0) === 'git') {
              repo = getRepository(pack);
              shaLine = "#" + (pack.apmInstallSource.sha.substr(0, 8));
              if (repo != null) {
                shaLine = repo + shaLine;
              }
              packageLine += (" (" + shaLine + ")").grey;
            }
            if (_this.isPackageDisabled(pack.name)) {
              packageLine += ' (disabled)';
            }
            return packageLine;
          };
        })(this));
      }
      return console.log();
    };

    List.prototype.listPackages = function(directoryPath, options) {
      var child, i, len, manifest, manifestPath, packages, ref;
      packages = [];
      ref = fs.list(directoryPath);
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        if (!fs.isDirectorySync(path.join(directoryPath, child))) {
          continue;
        }
        if (child.match(/^\./)) {
          continue;
        }
        if (!options.argv.links) {
          if (fs.isSymbolicLinkSync(path.join(directoryPath, child))) {
            continue;
          }
        }
        manifest = null;
        if (manifestPath = CSON.resolve(path.join(directoryPath, child, 'package'))) {
          try {
            manifest = CSON.readFileSync(manifestPath);
          } catch (undefined) {}
        }
        if (manifest == null) {
          manifest = {};
        }
        manifest.name = child;
        if (options.argv.themes) {
          if (manifest.theme) {
            packages.push(manifest);
          }
        } else if (options.argv.packages) {
          if (!manifest.theme) {
            packages.push(manifest);
          }
        } else {
          packages.push(manifest);
        }
      }
      return packages;
    };

    List.prototype.listUserPackages = function(options, callback) {
      var userPackages;
      userPackages = this.listPackages(this.userPackagesDirectory, options).filter(function(pack) {
        return !pack.apmInstallSource;
      });
      if (!(options.argv.bare || options.argv.json)) {
        console.log(("Community Packages (" + userPackages.length + ")").cyan, "" + this.userPackagesDirectory);
      }
      return typeof callback === "function" ? callback(null, userPackages) : void 0;
    };

    List.prototype.listDevPackages = function(options, callback) {
      var devPackages;
      if (!options.argv.dev) {
        return typeof callback === "function" ? callback(null, []) : void 0;
      }
      devPackages = this.listPackages(this.devPackagesDirectory, options);
      if (devPackages.length > 0) {
        if (!(options.argv.bare || options.argv.json)) {
          console.log(("Dev Packages (" + devPackages.length + ")").cyan, "" + this.devPackagesDirectory);
        }
      }
      return typeof callback === "function" ? callback(null, devPackages) : void 0;
    };

    List.prototype.listGitPackages = function(options, callback) {
      var gitPackages;
      gitPackages = this.listPackages(this.userPackagesDirectory, options).filter(function(pack) {
        var ref;
        return ((ref = pack.apmInstallSource) != null ? ref.type : void 0) === 'git';
      });
      if (gitPackages.length > 0) {
        if (!(options.argv.bare || options.argv.json)) {
          console.log(("Git Packages (" + gitPackages.length + ")").cyan, "" + this.userPackagesDirectory);
        }
      }
      return typeof callback === "function" ? callback(null, gitPackages) : void 0;
    };

    List.prototype.listBundledPackages = function(options, callback) {
      return config.getResourcePath(function(resourcePath) {
        var _atomPackages, metadata, metadataPath, packageName, packages;
        try {
          metadataPath = path.join(resourcePath, 'package.json');
          _atomPackages = JSON.parse(fs.readFileSync(metadataPath))._atomPackages;
        } catch (undefined) {}
        if (_atomPackages == null) {
          _atomPackages = {};
        }
        packages = (function() {
          var results;
          results = [];
          for (packageName in _atomPackages) {
            metadata = _atomPackages[packageName].metadata;
            results.push(metadata);
          }
          return results;
        })();
        packages = packages.filter(function(metadata) {
          if (options.argv.themes) {
            return metadata.theme;
          } else if (options.argv.packages) {
            return !metadata.theme;
          } else {
            return true;
          }
        });
        if (!(options.argv.bare || options.argv.json)) {
          if (options.argv.themes) {
            console.log('Built-in Atom Themes'.cyan + " (" + packages.length + ")");
          } else {
            console.log('Built-in Atom Packages'.cyan + " (" + packages.length + ")");
          }
        }
        return typeof callback === "function" ? callback(null, packages) : void 0;
      });
    };

    List.prototype.listInstalledPackages = function(options) {
      return this.listDevPackages(options, (function(_this) {
        return function(error, packages) {
          if (packages.length > 0) {
            _this.logPackages(packages, options);
          }
          return _this.listUserPackages(options, function(error, packages) {
            _this.logPackages(packages, options);
            return _this.listGitPackages(options, function(error, packages) {
              return _this.logPackages(packages, options);
            });
          });
        };
      })(this));
    };

    List.prototype.listPackagesAsJson = function(options, callback) {
      var output;
      if (callback == null) {
        callback = function() {};
      }
      output = {
        core: [],
        dev: [],
        git: [],
        user: []
      };
      return this.listBundledPackages(options, (function(_this) {
        return function(error, packages) {
          if (error) {
            return callback(error);
          }
          output.core = packages;
          return _this.listDevPackages(options, function(error, packages) {
            if (error) {
              return callback(error);
            }
            output.dev = packages;
            return _this.listUserPackages(options, function(error, packages) {
              if (error) {
                return callback(error);
              }
              output.user = packages;
              return _this.listGitPackages(options, function(error, packages) {
                if (error) {
                  return callback(error);
                }
                output.git = packages;
                console.log(JSON.stringify(output));
                return callback();
              });
            });
          });
        };
      })(this));
    };

    List.prototype.run = function(options) {
      var callback;
      callback = options.callback;
      options = this.parseOptions(options.commandArgs);
      if (options.argv.json) {
        return this.listPackagesAsJson(options, callback);
      } else if (options.argv.installed) {
        this.listInstalledPackages(options);
        return callback();
      } else {
        return this.listBundledPackages(options, (function(_this) {
          return function(error, packages) {
            _this.logPackages(packages, options);
            _this.listInstalledPackages(options);
            return callback();
          };
        })(this));
      }
    };

    return List;

  })(Command);

}).call(this);
