(function() {
  var Command, _, child_process, config, git, path, semver,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

  child_process = require('child_process');

  path = require('path');

  _ = require('underscore-plus');

  semver = require('semver');

  config = require('./apm');

  git = require('./git');

  module.exports = Command = (function() {
    function Command() {
      this.logCommandResultsIfFail = bind(this.logCommandResultsIfFail, this);
      this.logCommandResults = bind(this.logCommandResults, this);
    }

    Command.prototype.spawn = function() {
      var args, callback, command, errorChunks, onChildExit, options, outputChunks, remaining, spawned;
      command = arguments[0], args = arguments[1], remaining = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      if (remaining.length >= 2) {
        options = remaining.shift();
      }
      callback = remaining.shift();
      spawned = child_process.spawn(command, args, options);
      errorChunks = [];
      outputChunks = [];
      spawned.stdout.on('data', function(chunk) {
        if (options != null ? options.streaming : void 0) {
          return process.stdout.write(chunk);
        } else {
          return outputChunks.push(chunk);
        }
      });
      spawned.stderr.on('data', function(chunk) {
        if (options != null ? options.streaming : void 0) {
          return process.stderr.write(chunk);
        } else {
          return errorChunks.push(chunk);
        }
      });
      onChildExit = function(errorOrExitCode) {
        spawned.removeListener('error', onChildExit);
        spawned.removeListener('close', onChildExit);
        return typeof callback === "function" ? callback(errorOrExitCode, Buffer.concat(errorChunks).toString(), Buffer.concat(outputChunks).toString()) : void 0;
      };
      spawned.on('error', onChildExit);
      spawned.on('close', onChildExit);
      return spawned;
    };

    Command.prototype.fork = function() {
      var args, remaining, script;
      script = arguments[0], args = arguments[1], remaining = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      args.unshift(script);
      return this.spawn.apply(this, [process.execPath, args].concat(slice.call(remaining)));
    };

    Command.prototype.packageNamesFromArgv = function(argv) {
      return this.sanitizePackageNames(argv._);
    };

    Command.prototype.sanitizePackageNames = function(packageNames) {
      if (packageNames == null) {
        packageNames = [];
      }
      packageNames = packageNames.map(function(packageName) {
        return packageName.trim();
      });
      return _.compact(_.uniq(packageNames));
    };

    Command.prototype.logSuccess = function() {
      if (process.platform === 'win32') {
        return process.stdout.write('done\n'.green);
      } else {
        return process.stdout.write('\u2713\n'.green);
      }
    };

    Command.prototype.logFailure = function() {
      if (process.platform === 'win32') {
        return process.stdout.write('failed\n'.red);
      } else {
        return process.stdout.write('\u2717\n'.red);
      }
    };

    Command.prototype.logCommandResults = function(callback, code, stderr, stdout) {
      if (stderr == null) {
        stderr = '';
      }
      if (stdout == null) {
        stdout = '';
      }
      if (code === 0) {
        this.logSuccess();
        return callback();
      } else {
        this.logFailure();
        return callback((stdout + "\n" + stderr).trim());
      }
    };

    Command.prototype.logCommandResultsIfFail = function(callback, code, stderr, stdout) {
      if (stderr == null) {
        stderr = '';
      }
      if (stdout == null) {
        stdout = '';
      }
      if (code === 0) {
        return callback();
      } else {
        this.logFailure();
        return callback((stdout + "\n" + stderr).trim());
      }
    };

    Command.prototype.normalizeVersion = function(version) {
      if (typeof version === 'string') {
        return version.replace(/-.*$/, '');
      } else {
        return version;
      }
    };

    Command.prototype.loadInstalledAtomMetadata = function(callback) {
      return this.getResourcePath((function(_this) {
        return function(resourcePath) {
          var electronVersion, ref, ref1, ref2, version;
          try {
            ref1 = (ref = require(path.join(resourcePath, 'package.json'))) != null ? ref : {}, version = ref1.version, electronVersion = ref1.electronVersion;
            version = _this.normalizeVersion(version);
            if (semver.valid(version)) {
              _this.installedAtomVersion = version;
            }
          } catch (undefined) {}
          _this.electronVersion = (ref2 = process.env.ATOM_ELECTRON_VERSION) != null ? ref2 : electronVersion;
          if (_this.electronVersion == null) {
            throw new Error('Could not determine Electron version');
          }
          return callback();
        };
      })(this));
    };

    Command.prototype.getResourcePath = function(callback) {
      if (this.resourcePath) {
        return process.nextTick((function(_this) {
          return function() {
            return callback(_this.resourcePath);
          };
        })(this));
      } else {
        return config.getResourcePath((function(_this) {
          return function(resourcePath1) {
            _this.resourcePath = resourcePath1;
            return callback(_this.resourcePath);
          };
        })(this));
      }
    };

    Command.prototype.addBuildEnvVars = function(env) {
      if (config.isWin32()) {
        this.updateWindowsEnv(env);
      }
      this.addNodeBinToEnv(env);
      return this.addProxyToEnv(env);
    };

    Command.prototype.getVisualStudioFlags = function() {
      var vsVersion;
      if (vsVersion = config.getInstalledVisualStudioFlag()) {
        return "--msvs_version=" + vsVersion;
      }
    };

    Command.prototype.updateWindowsEnv = function(env) {
      var localModuleBins;
      env.USERPROFILE = env.HOME;
      localModuleBins = path.resolve(__dirname, '..', 'node_modules', '.bin');
      if (env.Path) {
        env.Path += "" + path.delimiter + localModuleBins;
      } else {
        env.Path = localModuleBins;
      }
      return git.addGitToEnv(env);
    };

    Command.prototype.addNodeBinToEnv = function(env) {
      var nodeBinFolder, pathKey;
      nodeBinFolder = path.resolve(__dirname, '..', 'bin');
      pathKey = config.isWin32() ? 'Path' : 'PATH';
      if (env[pathKey]) {
        return env[pathKey] = "" + nodeBinFolder + path.delimiter + env[pathKey];
      } else {
        return env[pathKey] = nodeBinFolder;
      }
    };

    Command.prototype.addProxyToEnv = function(env) {
      var httpProxy, httpsProxy;
      httpProxy = this.npm.config.get('proxy');
      if (httpProxy) {
        if (env.HTTP_PROXY == null) {
          env.HTTP_PROXY = httpProxy;
        }
        if (env.http_proxy == null) {
          env.http_proxy = httpProxy;
        }
      }
      httpsProxy = this.npm.config.get('https-proxy');
      if (httpsProxy) {
        if (env.HTTPS_PROXY == null) {
          env.HTTPS_PROXY = httpsProxy;
        }
        return env.https_proxy != null ? env.https_proxy : env.https_proxy = httpsProxy;
      }
    };

    return Command;

  })();

}).call(this);
