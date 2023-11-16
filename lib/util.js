function once(fn) {
  let value;
  let ran = false;
  function onceFn(...args) {
    if (ran) return value;
    value = fn(...args);
    ran = true;
    return value;
  }
  return onceFn;
}

function versionGteLt(version, gteRequirement, ltRequirement) {
  const [major, minor, patch, extra] = parse(version);
  const [gteMajor, gteMinor, gtePatch] = parse(gteRequirement);
  const isGte =
    major > gteMajor || (major === gteMajor && (minor > gteMinor || (minor === gteMinor && patch >= gtePatch)));
  let isLt = true;
  if (ltRequirement) {
    const [ltMajor, ltMinor, ltPatch] = parse(ltRequirement);
    isLt = major < ltMajor || (major === ltMajor && (minor < ltMinor || (minor === ltMinor && patch < ltPatch)));
  }
  return isGte && isLt;

  function parse(requirement) {
    return requirement.split(/[\.-]/).map((s) => parseInt(s, 10));
  }
}

module.exports = {
  once,
  versionGteLt
}
