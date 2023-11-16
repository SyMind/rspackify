/** @internal */
export function once<Fn extends (...args: any[]) => any>(fn: Fn) {
  let value: ReturnType<Fn>;
  let ran = false;
  function onceFn(...args: Parameters<Fn>): ReturnType<Fn> {
    if (ran) return value;
    value = fn(...args);
    ran = true;
    return value;
  }
  return onceFn;
}

/** @internal */
export function versionGteLt(version: string, gteRequirement: string, ltRequirement?: string) {
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

  function parse(requirement: string) {
    return requirement.split(/[\.-]/).map((s) => parseInt(s, 10));
  }
}
