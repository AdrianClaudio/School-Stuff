(function() {
  var Command, Develop, Install, Link, _, async, config, fs, git, path, request, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  fs = require('fs');

  path = require('path');

  _ = require('underscore-plus');

  async = require('async');

  yargs = require('yargs');

  config = require('./apm');

  Command = require('./command');

  Install = require('./install');

  git = require('./git');

  Link = require('./link');

  request = require('./request');

  module.exports = Develop = (function(superClass) {
    extend(Develop, superClass);

    Develop.commandNames = ['dev', 'develop'];

    function Develop() {
      this.atomDirectory = config.getAtomDirectory();
      this.atomDevPackagesDirectory = path.join(this.atomDirectory, 'dev', 'packages');
    }

    Develop.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("Usage: apm develop <package_name> [<directory>]\n\nClone the given package's Git repository to the directory specified,\ninstall its dependencies, and link it for development to\n~/.atom/dev/packages/<package_name>.\n\nIf no directory is specified then the repository is cloned to\n~/github/<package_name>. The default folder to clone packages into can\nbe overridden using the ATOM_REPOS_HOME environment variable.\n\nOnce this command completes you can open a dev window from atom using\ncmd-shift-o to run the package out of the newly cloned repository.");
      return options.alias('h', 'help').describe('help', 'Print this usage message');
    };

    Develop.prototype.getRepositoryUrl = function(packageName, callback) {
      var requestSettings;
      requestSettings = {
        url: (config.getAtomPackagesUrl()) + "/" + packageName,
        json: true
      };
      return request.get(requestSettings, function(error, response, body) {
        var message, repositoryUrl;
        if (body == null) {
          body = {};
        }
        if (error != null) {
          return callback("Request for package information failed: " + error.message);
        } else if (response.statusCode === 200) {
          if (repositoryUrl = body.repository.url) {
            return callback(null, repositoryUrl);
          } else {
            return callback("No repository URL found for package: " + packageName);
          }
        } else {
          message = request.getErrorMessage(response, body);
          return callback("Request for package information failed: " + message);
        }
      });
    };

    Develop.prototype.cloneRepository = function(repoUrl, packageDirectory, options, callback) {
      if (callback == null) {
        callback = function() {};
      }
      return config.getSetting('git', (function(_this) {
        return function(command) {
          var args;
          if (command == null) {
            command = 'git';
          }
          args = ['clone', '--recursive', repoUrl, packageDirectory];
          if (!options.argv.json) {
            process.stdout.write("Cloning " + repoUrl + " ");
          }
          git.addGitToEnv(process.env);
          return _this.spawn(command, args, function() {
            var args;
            args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
            if (options.argv.json) {
              return _this.logCommandResultsIfFail.apply(_this, [callback].concat(slice.call(args)));
            } else {
              return _this.logCommandResults.apply(_this, [callback].concat(slice.call(args)));
            }
          });
        };
      })(this));
    };

    Develop.prototype.installDependencies = function(packageDirectory, options, callback) {
      var installOptions;
      if (callback == null) {
        callback = function() {};
      }
      process.chdir(packageDirectory);
      installOptions = _.clone(options);
      installOptions.callback = callback;
      return new Install().run(installOptions);
    };

    Develop.prototype.linkPackage = function(packageDirectory, options, callback) {
      var linkOptions;
      linkOptions = _.clone(options);
      if (callback) {
        linkOptions.callback = callback;
      }
      linkOptions.commandArgs = [packageDirectory, '--dev'];
      return new Link().run(linkOptions);
    };

    Develop.prototype.run = function(options) {
      var packageDirectory, packageName, ref;
      packageName = options.commandArgs.shift();
      if (!((packageName != null ? packageName.length : void 0) > 0)) {
        return options.callback("Missing required package name");
      }
      packageDirectory = (ref = options.commandArgs.shift()) != null ? ref : path.join(config.getReposDirectory(), packageName);
      packageDirectory = path.resolve(packageDirectory);
      if (fs.existsSync(packageDirectory)) {
        return this.linkPackage(packageDirectory, options);
      } else {
        return this.getRepositoryUrl(packageName, (function(_this) {
          return function(error, repoUrl) {
            var tasks;
            if (error != null) {
              return options.callback(error);
            } else {
              tasks = [];
              tasks.push(function(callback) {
                return _this.cloneRepository(repoUrl, packageDirectory, options, callback);
              });
              tasks.push(function(callback) {
                return _this.installDependencies(packageDirectory, options, callback);
              });
              tasks.push(function(callback) {
                return _this.linkPackage(packageDirectory, options, callback);
              });
              return async.waterfall(tasks, options.callback);
            }
          };
        })(this));
      }
    };

    return Develop;

  })(Command);

}).call(this);
