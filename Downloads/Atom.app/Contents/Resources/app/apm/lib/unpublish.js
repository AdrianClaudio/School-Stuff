(function() {
  var Command, Unpublish, auth, config, fs, path, readline, request, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  path = require('path');

  readline = require('readline');

  yargs = require('yargs');

  auth = require('./auth');

  Command = require('./command');

  config = require('./apm');

  fs = require('./fs');

  request = require('./request');

  module.exports = Unpublish = (function(superClass) {
    extend(Unpublish, superClass);

    function Unpublish() {
      return Unpublish.__super__.constructor.apply(this, arguments);
    }

    Unpublish.commandNames = ['unpublish'];

    Unpublish.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("Usage: apm unpublish [<package_name>]\n       apm unpublish <package_name>@<package_version>\n\nRemove a published package or package version from the atom.io registry.\n\nThe package in the current working directory will be used if no package\nname is specified.");
      options.alias('h', 'help').describe('help', 'Print this usage message');
      return options.alias('f', 'force').boolean('force').describe('force', 'Do not prompt for confirmation');
    };

    Unpublish.prototype.unpublishPackage = function(packageName, packageVersion, callback) {
      var packageLabel;
      packageLabel = packageName;
      if (packageVersion) {
        packageLabel += "@" + packageVersion;
      }
      process.stdout.write("Unpublishing " + packageLabel + " ");
      return auth.getToken((function(_this) {
        return function(error, token) {
          var options;
          if (error != null) {
            _this.logFailure();
            callback(error);
            return;
          }
          options = {
            uri: (config.getAtomPackagesUrl()) + "/" + packageName,
            headers: {
              authorization: token
            },
            json: true
          };
          if (packageVersion) {
            options.uri += "/versions/" + packageVersion;
          }
          return request.del(options, function(error, response, body) {
            var message, ref, ref1;
            if (body == null) {
              body = {};
            }
            if (error != null) {
              _this.logFailure();
              return callback(error);
            } else if (response.statusCode !== 204) {
              _this.logFailure();
              message = (ref = (ref1 = body.message) != null ? ref1 : body.error) != null ? ref : body;
              return callback("Unpublishing failed: " + message);
            } else {
              _this.logSuccess();
              return callback();
            }
          });
        };
      })(this));
    };

    Unpublish.prototype.promptForConfirmation = function(packageName, packageVersion, callback) {
      var packageLabel, question;
      packageLabel = packageName;
      if (packageVersion) {
        packageLabel += "@" + packageVersion;
      }
      if (packageVersion) {
        question = "Are you sure you want to unpublish '" + packageLabel + "'? (no) ";
      } else {
        question = ("Are you sure you want to unpublish ALL VERSIONS of '" + packageLabel + "'? ") + "This will remove it from the apm registry, including " + "download counts and stars, and this action is irreversible. (no)";
      }
      return this.prompt(question, (function(_this) {
        return function(answer) {
          answer = answer ? answer.trim().toLowerCase() : 'no';
          if (answer === 'y' || answer === 'yes') {
            return _this.unpublishPackage(packageName, packageVersion, callback);
          } else {
            return callback("Cancelled unpublishing " + packageLabel);
          }
        };
      })(this));
    };

    Unpublish.prototype.prompt = function(question, callback) {
      var prompt;
      prompt = readline.createInterface(process.stdin, process.stdout);
      return prompt.question(question, function(answer) {
        prompt.close();
        return callback(answer);
      });
    };

    Unpublish.prototype.run = function(options) {
      var atIndex, callback, name, ref, version;
      callback = options.callback;
      options = this.parseOptions(options.commandArgs);
      name = options.argv._[0];
      if ((name != null ? name.length : void 0) > 0) {
        atIndex = name.indexOf('@');
        if (atIndex !== -1) {
          version = name.substring(atIndex + 1);
          name = name.substring(0, atIndex);
        }
      }
      if (!name) {
        try {
          name = (ref = JSON.parse(fs.readFileSync('package.json'))) != null ? ref.name : void 0;
        } catch (undefined) {}
      }
      if (!name) {
        name = path.basename(process.cwd());
      }
      if (options.argv.force) {
        return this.unpublishPackage(name, version, callback);
      } else {
        return this.promptForConfirmation(name, version, callback);
      }
    };

    return Unpublish;

  })(Command);

}).call(this);
