(function() {
  var deprecatedPackages, semver;

  semver = require('semver');

  deprecatedPackages = null;

  exports.isDeprecatedPackage = function(name, version) {
    var deprecatedVersionRange, ref;
    if (deprecatedPackages == null) {
      deprecatedPackages = (ref = require('../deprecated-packages')) != null ? ref : {};
    }
    if (!deprecatedPackages.hasOwnProperty(name)) {
      return false;
    }
    deprecatedVersionRange = deprecatedPackages[name].version;
    if (!deprecatedVersionRange) {
      return true;
    }
    return semver.valid(version) && semver.validRange(deprecatedVersionRange) && semver.satisfies(version, deprecatedVersionRange);
  };

}).call(this);
