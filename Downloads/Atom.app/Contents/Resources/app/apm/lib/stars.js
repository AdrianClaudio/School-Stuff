(function() {
  var Command, Install, Login, Stars, _, config, request, tree, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  yargs = require('yargs');

  Command = require('./command');

  config = require('./apm');

  Install = require('./install');

  Login = require('./login');

  request = require('./request');

  tree = require('./tree');

  module.exports = Stars = (function(superClass) {
    extend(Stars, superClass);

    function Stars() {
      return Stars.__super__.constructor.apply(this, arguments);
    }

    Stars.commandNames = ['stars', 'starred'];

    Stars.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("\nUsage: apm stars\n       apm stars --install\n       apm stars --user thedaniel\n       apm stars --themes\n\nList or install starred Atom packages and themes.");
      options.alias('h', 'help').describe('help', 'Print this usage message');
      options.alias('i', 'install').boolean('install').describe('install', 'Install the starred packages');
      options.alias('t', 'themes').boolean('themes').describe('themes', 'Only list themes');
      options.alias('u', 'user').string('user').describe('user', 'GitHub username to show starred packages for');
      return options.boolean('json').describe('json', 'Output packages as a JSON array');
    };

    Stars.prototype.getStarredPackages = function(user, atomVersion, callback) {
      var requestSettings;
      requestSettings = {
        json: true
      };
      if (atomVersion) {
        requestSettings.qs = {
          engine: atomVersion
        };
      }
      if (user) {
        requestSettings.url = (config.getAtomApiUrl()) + "/users/" + user + "/stars";
        return this.requestStarredPackages(requestSettings, callback);
      } else {
        requestSettings.url = (config.getAtomApiUrl()) + "/stars";
        return Login.getTokenOrLogin((function(_this) {
          return function(error, token) {
            if (error != null) {
              return callback(error);
            }
            requestSettings.headers = {
              authorization: token
            };
            return _this.requestStarredPackages(requestSettings, callback);
          };
        })(this));
      }
    };

    Stars.prototype.requestStarredPackages = function(requestSettings, callback) {
      return request.get(requestSettings, function(error, response, body) {
        var message, packages;
        if (body == null) {
          body = [];
        }
        if (error != null) {
          return callback(error);
        } else if (response.statusCode === 200) {
          packages = body.filter(function(pack) {
            var ref;
            return (pack != null ? (ref = pack.releases) != null ? ref.latest : void 0 : void 0) != null;
          });
          packages = packages.map(function(arg) {
            var downloads, metadata, readme, stargazers_count;
            readme = arg.readme, metadata = arg.metadata, downloads = arg.downloads, stargazers_count = arg.stargazers_count;
            return _.extend({}, metadata, {
              readme: readme,
              downloads: downloads,
              stargazers_count: stargazers_count
            });
          });
          packages = _.sortBy(packages, 'name');
          return callback(null, packages);
        } else {
          message = request.getErrorMessage(response, body);
          return callback("Requesting packages failed: " + message);
        }
      });
    };

    Stars.prototype.installPackages = function(packages, callback) {
      var commandArgs;
      if (packages.length === 0) {
        return callback();
      }
      commandArgs = packages.map(function(arg) {
        var name;
        name = arg.name;
        return name;
      });
      return new Install().run({
        commandArgs: commandArgs,
        callback: callback
      });
    };

    Stars.prototype.logPackagesAsJson = function(packages, callback) {
      console.log(JSON.stringify(packages));
      return callback();
    };

    Stars.prototype.logPackagesAsText = function(user, packagesAreThemes, packages, callback) {
      var label, userLabel;
      userLabel = user != null ? user : 'you';
      if (packagesAreThemes) {
        label = "Themes starred by " + userLabel;
      } else {
        label = "Packages starred by " + userLabel;
      }
      console.log(label.cyan + " (" + packages.length + ")");
      tree(packages, function(arg) {
        var description, downloads, name, stargazers_count, version;
        name = arg.name, version = arg.version, description = arg.description, downloads = arg.downloads, stargazers_count = arg.stargazers_count;
        label = name.yellow;
        if (process.platform === 'darwin') {
          label = "\u2B50  " + label;
        }
        if (description) {
          label += " " + (description.replace(/\s+/g, ' '));
        }
        if (downloads >= 0 && stargazers_count >= 0) {
          label += (" (" + (_.pluralize(downloads, 'download')) + ", " + (_.pluralize(stargazers_count, 'star')) + ")").grey;
        }
        return label;
      });
      console.log();
      console.log("Use `apm stars --install` to install them all or visit " + 'http://atom.io/packages'.underline + " to read more about them.");
      console.log();
      return callback();
    };

    Stars.prototype.run = function(options) {
      var callback, ref, user;
      callback = options.callback;
      options = this.parseOptions(options.commandArgs);
      user = (ref = options.argv.user) != null ? ref.toString().trim() : void 0;
      return this.getStarredPackages(user, options.argv.compatible, (function(_this) {
        return function(error, packages) {
          if (error != null) {
            return callback(error);
          }
          if (options.argv.themes) {
            packages = packages.filter(function(arg) {
              var theme;
              theme = arg.theme;
              return theme;
            });
          }
          if (options.argv.install) {
            return _this.installPackages(packages, callback);
          } else if (options.argv.json) {
            return _this.logPackagesAsJson(packages, callback);
          } else {
            return _this.logPackagesAsText(user, options.argv.themes, packages, callback);
          }
        };
      })(this));
    };

    return Stars;

  })(Command);

}).call(this);
