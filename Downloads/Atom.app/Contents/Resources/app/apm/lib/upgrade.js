(function() {
  var Command, Git, Install, Packages, Upgrade, _, async, config, fs, git, path, read, request, semver, tree, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  _ = require('underscore-plus');

  async = require('async');

  yargs = require('yargs');

  read = require('read');

  semver = require('semver');

  Git = require('git-utils');

  Command = require('./command');

  config = require('./apm');

  fs = require('./fs');

  Install = require('./install');

  Packages = require('./packages');

  request = require('./request');

  tree = require('./tree');

  git = require('./git');

  module.exports = Upgrade = (function(superClass) {
    extend(Upgrade, superClass);

    Upgrade.commandNames = ['upgrade', 'outdated', 'update'];

    function Upgrade() {
      this.atomDirectory = config.getAtomDirectory();
      this.atomPackagesDirectory = path.join(this.atomDirectory, 'packages');
    }

    Upgrade.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("\nUsage: apm upgrade\n       apm upgrade --list\n       apm upgrade [<package_name>...]\n\nUpgrade out of date packages installed to ~/.atom/packages\n\nThis command lists the out of date packages and then prompts to install\navailable updates.");
      options.alias('c', 'confirm').boolean('confirm')["default"]('confirm', true).describe('confirm', 'Confirm before installing updates');
      options.alias('h', 'help').describe('help', 'Print this usage message');
      options.alias('l', 'list').boolean('list').describe('list', 'List but don\'t install the outdated packages');
      options.boolean('json').describe('json', 'Output outdated packages as a JSON array');
      options.string('compatible').describe('compatible', 'Only list packages/themes compatible with this Atom version');
      return options.boolean('verbose')["default"]('verbose', false).describe('verbose', 'Show verbose debug information');
    };

    Upgrade.prototype.getInstalledPackages = function(options) {
      var i, len, name, pack, packageNames, packages, ref;
      packages = [];
      ref = fs.list(this.atomPackagesDirectory);
      for (i = 0, len = ref.length; i < len; i++) {
        name = ref[i];
        if (pack = this.getIntalledPackage(name)) {
          packages.push(pack);
        }
      }
      packageNames = this.packageNamesFromArgv(options.argv);
      if (packageNames.length > 0) {
        packages = packages.filter(function(arg) {
          var name;
          name = arg.name;
          return packageNames.indexOf(name) !== -1;
        });
      }
      return packages;
    };

    Upgrade.prototype.getIntalledPackage = function(name) {
      var metadata, packageDirectory;
      packageDirectory = path.join(this.atomPackagesDirectory, name);
      if (fs.isSymbolicLinkSync(packageDirectory)) {
        return;
      }
      try {
        metadata = JSON.parse(fs.readFileSync(path.join(packageDirectory, 'package.json')));
        if ((metadata != null ? metadata.name : void 0) && (metadata != null ? metadata.version : void 0)) {
          return metadata;
        }
      } catch (undefined) {}
    };

    Upgrade.prototype.loadInstalledAtomVersion = function(options, callback) {
      if (options.argv.compatible) {
        return process.nextTick((function(_this) {
          return function() {
            var version;
            version = _this.normalizeVersion(options.argv.compatible);
            if (semver.valid(version)) {
              _this.installedAtomVersion = version;
            }
            return callback();
          };
        })(this));
      } else {
        return this.loadInstalledAtomMetadata(callback);
      }
    };

    Upgrade.prototype.getLatestVersion = function(pack, callback) {
      var requestSettings;
      requestSettings = {
        url: (config.getAtomPackagesUrl()) + "/" + pack.name,
        json: true
      };
      return request.get(requestSettings, (function(_this) {
        return function(error, response, body) {
          var atomVersion, engine, latestVersion, message, metadata, ref, ref1, ref2, ref3, ref4, ref5, version;
          if (body == null) {
            body = {};
          }
          if (error != null) {
            return callback("Request for package information failed: " + error.message);
          } else if (response.statusCode === 404) {
            return callback();
          } else if (response.statusCode !== 200) {
            message = (ref = (ref1 = body.message) != null ? ref1 : body.error) != null ? ref : body;
            return callback("Request for package information failed: " + message);
          } else {
            atomVersion = _this.installedAtomVersion;
            latestVersion = pack.version;
            ref3 = (ref2 = body.versions) != null ? ref2 : {};
            for (version in ref3) {
              metadata = ref3[version];
              if (!semver.valid(version)) {
                continue;
              }
              if (!metadata) {
                continue;
              }
              engine = (ref4 = (ref5 = metadata.engines) != null ? ref5.atom : void 0) != null ? ref4 : '*';
              if (!semver.validRange(engine)) {
                continue;
              }
              if (!semver.satisfies(atomVersion, engine)) {
                continue;
              }
              if (semver.gt(version, latestVersion)) {
                latestVersion = version;
              }
            }
            if (latestVersion !== pack.version && _this.hasRepo(pack)) {
              return callback(null, latestVersion);
            } else {
              return callback();
            }
          }
        };
      })(this));
    };

    Upgrade.prototype.getLatestSha = function(pack, callback) {
      var repoPath;
      repoPath = path.join(this.atomPackagesDirectory, pack.name);
      return config.getSetting('git', (function(_this) {
        return function(command) {
          var args;
          if (command == null) {
            command = 'git';
          }
          args = ['fetch', 'origin', 'master'];
          git.addGitToEnv(process.env);
          return _this.spawn(command, args, {
            cwd: repoPath
          }, function(code, stderr, stdout) {
            var repo, sha;
            if (stderr == null) {
              stderr = '';
            }
            if (stdout == null) {
              stdout = '';
            }
            if (code !== 0) {
              return callback(code);
            }
            repo = Git.open(repoPath);
            sha = repo.getReferenceTarget(repo.getUpstreamBranch('refs/heads/master'));
            if (sha !== pack.apmInstallSource.sha) {
              return callback(null, sha);
            } else {
              return callback();
            }
          });
        };
      })(this));
    };

    Upgrade.prototype.hasRepo = function(pack) {
      return Packages.getRepository(pack) != null;
    };

    Upgrade.prototype.getAvailableUpdates = function(packages, callback) {
      var getLatestVersionOrSha;
      getLatestVersionOrSha = (function(_this) {
        return function(pack, done) {
          var ref;
          if (((ref = pack.apmInstallSource) != null ? ref.type : void 0) === 'git') {
            return _this.getLatestSha(pack, function(err, sha) {
              return done(err, {
                pack: pack,
                sha: sha
              });
            });
          } else {
            return _this.getLatestVersion(pack, function(err, latestVersion) {
              return done(err, {
                pack: pack,
                latestVersion: latestVersion
              });
            });
          }
        };
      })(this);
      return async.map(packages, getLatestVersionOrSha, function(error, updates) {
        if (error != null) {
          return callback(error);
        }
        updates = _.filter(updates, function(update) {
          return (update.latestVersion != null) || (update.sha != null);
        });
        updates.sort(function(updateA, updateB) {
          return updateA.pack.name.localeCompare(updateB.pack.name);
        });
        return callback(null, updates);
      });
    };

    Upgrade.prototype.promptForConfirmation = function(callback) {
      return read({
        prompt: 'Would you like to install these updates? (yes)',
        edit: true
      }, function(error, answer) {
        answer = answer ? answer.trim().toLowerCase() : 'yes';
        return callback(error, answer === 'y' || answer === 'yes');
      });
    };

    Upgrade.prototype.installUpdates = function(updates, callback) {
      var fn, i, installCommands, latestVersion, len, pack, ref, verbose;
      installCommands = [];
      verbose = this.verbose;
      fn = function(pack, latestVersion) {
        return installCommands.push(function(callback) {
          var commandArgs, ref;
          if (((ref = pack.apmInstallSource) != null ? ref.type : void 0) === 'git') {
            commandArgs = [pack.apmInstallSource.source];
          } else {
            commandArgs = [pack.name + "@" + latestVersion];
          }
          if (verbose) {
            commandArgs.unshift('--verbose');
          }
          return new Install().run({
            callback: callback,
            commandArgs: commandArgs
          });
        });
      };
      for (i = 0, len = updates.length; i < len; i++) {
        ref = updates[i], pack = ref.pack, latestVersion = ref.latestVersion;
        fn(pack, latestVersion);
      }
      return async.waterfall(installCommands, callback);
    };

    Upgrade.prototype.run = function(options) {
      var callback, command;
      callback = options.callback, command = options.command;
      options = this.parseOptions(options.commandArgs);
      options.command = command;
      this.verbose = options.argv.verbose;
      if (this.verbose) {
        request.debug(true);
        process.env.NODE_DEBUG = 'request';
      }
      return this.loadInstalledAtomVersion(options, (function(_this) {
        return function() {
          if (_this.installedAtomVersion) {
            return _this.upgradePackages(options, callback);
          } else {
            return callback('Could not determine current Atom version installed');
          }
        };
      })(this));
    };

    Upgrade.prototype.upgradePackages = function(options, callback) {
      var packages;
      packages = this.getInstalledPackages(options);
      return this.getAvailableUpdates(packages, (function(_this) {
        return function(error, updates) {
          var packagesWithLatestVersionOrSha;
          if (error != null) {
            return callback(error);
          }
          if (options.argv.json) {
            packagesWithLatestVersionOrSha = updates.map(function(arg) {
              var latestVersion, pack, sha;
              pack = arg.pack, latestVersion = arg.latestVersion, sha = arg.sha;
              if (latestVersion) {
                pack.latestVersion = latestVersion;
              }
              if (sha) {
                pack.latestSha = sha;
              }
              return pack;
            });
            console.log(JSON.stringify(packagesWithLatestVersionOrSha));
          } else {
            console.log("Package Updates Available".cyan + (" (" + updates.length + ")"));
            tree(updates, function(arg) {
              var apmInstallSource, latestVersion, name, pack, ref, sha, version;
              pack = arg.pack, latestVersion = arg.latestVersion, sha = arg.sha;
              name = pack.name, apmInstallSource = pack.apmInstallSource, version = pack.version;
              name = name.yellow;
              if (sha != null) {
                version = apmInstallSource.sha.substr(0, 8).red;
                latestVersion = sha.substr(0, 8).green;
              } else {
                version = version.red;
                latestVersion = latestVersion.green;
              }
              latestVersion = (latestVersion != null ? latestVersion.green : void 0) || (apmInstallSource != null ? (ref = apmInstallSource.sha) != null ? ref.green : void 0 : void 0);
              return name + " " + version + " -> " + latestVersion;
            });
          }
          if (options.command === 'outdated') {
            return callback();
          }
          if (options.argv.list) {
            return callback();
          }
          if (updates.length === 0) {
            return callback();
          }
          console.log();
          if (options.argv.confirm) {
            return _this.promptForConfirmation(function(error, confirmed) {
              if (error != null) {
                return callback(error);
              }
              if (confirmed) {
                console.log();
                return _this.installUpdates(updates, callback);
              } else {
                return callback();
              }
            });
          } else {
            return _this.installUpdates(updates, callback);
          }
        };
      })(this));
    };

    return Upgrade;

  })(Command);

}).call(this);
