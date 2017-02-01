(function() {
  var Command, Init, fs, path, yargs,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  path = require('path');

  yargs = require('yargs');

  Command = require('./command');

  fs = require('./fs');

  module.exports = Init = (function(superClass) {
    extend(Init, superClass);

    function Init() {
      return Init.__super__.constructor.apply(this, arguments);
    }

    Init.commandNames = ['init'];

    Init.prototype.supportedSyntaxes = ['coffeescript', 'javascript'];

    Init.prototype.parseOptions = function(argv) {
      var options;
      options = yargs(argv).wrap(100);
      options.usage("Usage:\n  apm init -p <package-name>\n  apm init -p <package-name> --syntax <javascript-or-coffeescript>\n  apm init -p <package-name> -c ~/Downloads/r.tmbundle\n  apm init -p <package-name> -c https://github.com/textmate/r.tmbundle\n  apm init -p <package-name> --template /path/to/your/package/template\n\n  apm init -t <theme-name>\n  apm init -t <theme-name> -c ~/Downloads/Dawn.tmTheme\n  apm init -t <theme-name> -c https://raw.github.com/chriskempson/tomorrow-theme/master/textmate/Tomorrow-Night-Eighties.tmTheme\n  apm init -t <theme-name> --template /path/to/your/theme/template\n\n  apm init -l <language-name>\n\nGenerates code scaffolding for either a theme or package depending\non the option selected.");
      options.alias('p', 'package').string('package').describe('package', 'Generates a basic package');
      options.alias('s', 'syntax').string('syntax').describe('syntax', 'Sets package syntax to CoffeeScript or JavaScript');
      options.alias('t', 'theme').string('theme').describe('theme', 'Generates a basic theme');
      options.alias('l', 'language').string('language').describe('language', 'Generates a basic language package');
      options.alias('c', 'convert').string('convert').describe('convert', 'Path or URL to TextMate bundle/theme to convert');
      options.alias('h', 'help').describe('help', 'Print this usage message');
      return options.string('template').describe('template', 'Path to the package or theme template');
    };

    Init.prototype.run = function(options) {
      var callback, languageName, languagePath, packagePath, ref, ref1, ref2, syntax, templatePath, themePath;
      callback = options.callback;
      options = this.parseOptions(options.commandArgs);
      if (((ref = options.argv["package"]) != null ? ref.length : void 0) > 0) {
        if (options.argv.convert) {
          return this.convertPackage(options.argv.convert, options.argv["package"], callback);
        } else {
          packagePath = path.resolve(options.argv["package"]);
          syntax = options.argv.syntax || this.supportedSyntaxes[0];
          if (indexOf.call(this.supportedSyntaxes, syntax) < 0) {
            return callback("You must specify one of " + (this.supportedSyntaxes.join(', ')) + " after the --syntax argument");
          }
          templatePath = this.getTemplatePath(options.argv, "package-" + syntax);
          this.generateFromTemplate(packagePath, templatePath);
          return callback();
        }
      } else if (((ref1 = options.argv.theme) != null ? ref1.length : void 0) > 0) {
        if (options.argv.convert) {
          return this.convertTheme(options.argv.convert, options.argv.theme, callback);
        } else {
          themePath = path.resolve(options.argv.theme);
          templatePath = this.getTemplatePath(options.argv, 'theme');
          this.generateFromTemplate(themePath, templatePath);
          return callback();
        }
      } else if (((ref2 = options.argv.language) != null ? ref2.length : void 0) > 0) {
        languagePath = path.resolve(options.argv.language);
        languageName = path.basename(languagePath).replace(/^language-/, '');
        languagePath = path.join(path.dirname(languagePath), "language-" + languageName);
        templatePath = this.getTemplatePath(options.argv, 'language');
        this.generateFromTemplate(languagePath, templatePath, languageName);
        return callback();
      } else if (options.argv["package"] != null) {
        return callback('You must specify a path after the --package argument');
      } else if (options.argv.theme != null) {
        return callback('You must specify a path after the --theme argument');
      } else {
        return callback('You must specify either --package, --theme or --language to `apm init`');
      }
    };

    Init.prototype.convertPackage = function(sourcePath, destinationPath, callback) {
      var PackageConverter, converter;
      if (!destinationPath) {
        callback("Specify directory to create package in using --package");
        return;
      }
      PackageConverter = require('./package-converter');
      converter = new PackageConverter(sourcePath, destinationPath);
      return converter.convert((function(_this) {
        return function(error) {
          var templatePath;
          if (error != null) {
            return callback(error);
          } else {
            destinationPath = path.resolve(destinationPath);
            templatePath = path.resolve(__dirname, '..', 'templates', 'bundle');
            _this.generateFromTemplate(destinationPath, templatePath);
            return callback();
          }
        };
      })(this));
    };

    Init.prototype.convertTheme = function(sourcePath, destinationPath, callback) {
      var ThemeConverter, converter;
      if (!destinationPath) {
        callback("Specify directory to create theme in using --theme");
        return;
      }
      ThemeConverter = require('./theme-converter');
      converter = new ThemeConverter(sourcePath, destinationPath);
      return converter.convert((function(_this) {
        return function(error) {
          var templatePath;
          if (error != null) {
            return callback(error);
          } else {
            destinationPath = path.resolve(destinationPath);
            templatePath = path.resolve(__dirname, '..', 'templates', 'theme');
            _this.generateFromTemplate(destinationPath, templatePath);
            fs.removeSync(path.join(destinationPath, 'styles', 'colors.less'));
            fs.removeSync(path.join(destinationPath, 'LICENSE.md'));
            return callback();
          }
        };
      })(this));
    };

    Init.prototype.generateFromTemplate = function(packagePath, templatePath, packageName) {
      var childPath, contents, i, len, packageAuthor, ref, relativePath, results, sourcePath, templateChildPath;
      if (packageName == null) {
        packageName = path.basename(packagePath);
      }
      packageAuthor = process.env.GITHUB_USER || 'atom';
      fs.makeTreeSync(packagePath);
      ref = fs.listRecursive(templatePath);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        childPath = ref[i];
        templateChildPath = path.resolve(templatePath, childPath);
        relativePath = templateChildPath.replace(templatePath, "");
        relativePath = relativePath.replace(/^\//, '');
        relativePath = relativePath.replace(/\.template$/, '');
        relativePath = this.replacePackageNamePlaceholders(relativePath, packageName);
        sourcePath = path.join(packagePath, relativePath);
        if (fs.existsSync(sourcePath)) {
          continue;
        }
        if (fs.isDirectorySync(templateChildPath)) {
          results.push(fs.makeTreeSync(sourcePath));
        } else if (fs.isFileSync(templateChildPath)) {
          fs.makeTreeSync(path.dirname(sourcePath));
          contents = fs.readFileSync(templateChildPath).toString();
          contents = this.replacePackageNamePlaceholders(contents, packageName);
          contents = this.replacePackageAuthorPlaceholders(contents, packageAuthor);
          results.push(fs.writeFileSync(sourcePath, contents));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Init.prototype.replacePackageAuthorPlaceholders = function(string, packageAuthor) {
      return string.replace(/__package-author__/g, packageAuthor);
    };

    Init.prototype.replacePackageNamePlaceholders = function(string, packageName) {
      var placeholderRegex;
      placeholderRegex = /__(?:(package-name)|([pP]ackageName)|(package_name))__/g;
      return string = string.replace(placeholderRegex, (function(_this) {
        return function(match, dash, camel, underscore) {
          if (dash) {
            return _this.dasherize(packageName);
          } else if (camel) {
            if (/[a-z]/.test(camel[0])) {
              packageName = packageName[0].toLowerCase() + packageName.slice(1);
            } else if (/[A-Z]/.test(camel[0])) {
              packageName = packageName[0].toUpperCase() + packageName.slice(1);
            }
            return _this.camelize(packageName);
          } else if (underscore) {
            return _this.underscore(packageName);
          }
        };
      })(this));
    };

    Init.prototype.getTemplatePath = function(argv, templateType) {
      if (argv.template != null) {
        return path.resolve(argv.template);
      } else {
        return path.resolve(__dirname, '..', 'templates', templateType);
      }
    };

    Init.prototype.dasherize = function(string) {
      string = string[0].toLowerCase() + string.slice(1);
      return string.replace(/([A-Z])|(_)/g, function(m, letter, underscore) {
        if (letter) {
          return "-" + letter.toLowerCase();
        } else {
          return "-";
        }
      });
    };

    Init.prototype.camelize = function(string) {
      return string.replace(/[_-]+(\w)/g, function(m) {
        return m[1].toUpperCase();
      });
    };

    Init.prototype.underscore = function(string) {
      string = string[0].toLowerCase() + string.slice(1);
      return string.replace(/([A-Z])|(-)/g, function(m, letter, dash) {
        if (letter) {
          return "_" + letter.toLowerCase();
        } else {
          return "_";
        }
      });
    };

    return Init;

  })(Command);

}).call(this);
