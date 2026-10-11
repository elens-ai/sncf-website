/**
 * OPENNEXT: how the CMS is packaged for AWS Lambda (sst.config.ts at the
 * repository root runs this build and deploys its output).
 *
 * The one thing the default build cannot work out for itself: `sharp`, which
 * Payload uses to make each photograph's sizes, is a native module, and the
 * copy installed on a developer's Mac is of no use on the arm64 Linux the
 * function runs on. So it is installed again here, for that platform. The
 * version must match backend/package.json.
 */
const config = {
  default: {
    install: {
      packages: ['sharp@0.35.4'],
      arch: 'arm64',
    },
  },
}

export default config
