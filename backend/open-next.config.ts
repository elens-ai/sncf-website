/**
 * OPENNEXT: how the CMS is packaged for AWS Lambda (sst.config.ts at the
 * repository root runs this build and deploys its output).
 *
 * The one thing the default build cannot work out for itself: `sharp`, which
 * Payload uses to make each photograph's sizes, is a native module, and the
 * copy installed on the machine that builds (a developer's Mac, or the x64
 * Linux of GitHub Actions) is of no use on the arm64 Linux the function runs
 * on. So it is installed again here, for that platform: `arch` alone is not
 * enough, since npm takes `--cpu`, and without `libc` it finds no matching
 * build and settles for the slow WebAssembly one. The version must match
 * backend/package.json.
 */
const install = {
  packages: ['sharp@0.35.4'],
  arch: 'arm64',
  libc: 'glibc',
  additionalArgs: '--cpu=arm64',
}

const config = {
  default: { install },
  /* the function behind /_next/image, arm64 as well: the same build of sharp */
  imageOptimization: { install },
}

export default config
