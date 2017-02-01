(function() {
  var Command, Featured, _, config, request, tree, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  yargs = require('yargs');

  Command = require('./command');

  config = require('./apm');

  request = require('./request');

  tree = require('./tree');

  module.exports = Featured = (function(superClass) {
    extend(Featured, superClass);

    function Featured() {
      return Featured.__super__.constructor.apply(this, arguments);
    }

    Featured.commandNames = ['featured'];

    Featured.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("\nUsage: apm featured\n       apm featured --themes\n       apm featured --compatible 0.49.0\n\nList the Atom packages and themes that are currently featured in the\natom.io registry.");
      options.alias('h', 'help').describe('help', 'Print this usage message');
      options.alias('t', 'themes').boolean('themes').describe('themes', 'Only list themes');
      options.alias('c', 'compatible').string('compatible').describe('compatible', 'Only list packages/themes compatible with this Atom version');
      return options.boolean('json').describe('json', 'Output featured packages as JSON array');
    };

    Featured.prototype.getFeaturedPackagesByType = function(atomVersion, packageType, callback) {
      var ref, requestSettings;
      if (_.isFunction(atomVersion)) {
        ref = [atomVersion, null], callback = ref[0], atomVersion = ref[1];
      }
      requestSettings = {
        url: (config.getAtomApiUrl()) + "/" + packageType + "/featured",
        json: true
      };
      if (atomVersion) {
        requestSettings.qs = {
          engine: atomVersion
        };
      }
      return request.get(requestSettings, function(error, response, body) {
        var message, packages;
        if (body == null) {
          body = [];
        }
        if (error != null) {
          return callback(error);
        } else if (response.statusCode === 200) {
          packages = body.filter(function(pack) {
            var ref1;
            return (pack != null ? (ref1 = pack.releases) != null ? ref1.latest : void 0 : void 0) != null;
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

    Featured.prototype.getAllFeaturedPackages = function(atomVersion, callback) {
      return this.getFeaturedPackagesByType(atomVersion, 'packages', (function(_this) {
        return function(error, packages) {
          if (error != null) {
            return callback(error);
          }
          return _this.getFeaturedPackagesByType(atomVersion, 'themes', function(error, themes) {
            if (error != null) {
              return callback(error);
            }
            return callback(null, packages.concat(themes));
          });
        };
      })(this));
    };

    Featured.prototype.run = function(options) {
      var callback, listCallback;
      callback = options.callback;
      options = this.parseOptions(options.commandArgs);
      listCallback = function(error, packages) {
        if (error != null) {
          return callback(error);
        }
        if (options.argv.json) {
          console.log(JSON.stringify(packages));
        } else {
          if (options.argv.themes) {
            console.log('Featured Atom Themes'.cyan + " (" + packages.length + ")");
          } else {
            console.log('Featured Atom Packages'.cyan + " (" + packages.length + ")");
          }
          tree(packages, function(arg) {
            var description, downloads, label, name, stargazers_count, version;
            name = arg.name, version = arg.version, description = arg.description, downloads = arg.downloads, stargazers_count = arg.stargazers_count;
            label = name.yellow;
            if (description) {
              label += " " + (description.replace(/\s+/g, ' '));
            }
            if (downloads >= 0 && stargazers_count >= 0) {
              label += (" (" + (_.pluralize(downloads, 'download')) + ", " + (_.pluralize(stargazers_count, 'star')) + ")").grey;
            }
            return label;
          });
          console.log();
          console.log("Use `apm install` to install them or visit " + 'http://atom.io/packages'.underline + " to read more about them.");
          console.log();
        }
        return callback();
      };
      if (options.argv.themes) {
        return this.getFeaturedPackagesByType(options.argv.compatible, 'themes', listCallback);
      } else {
        return this.getAllFeaturedPackages(options.argv.compatible, listCallback);
      }
    };

    return Featured;

  })(Command);

}).call(this);
