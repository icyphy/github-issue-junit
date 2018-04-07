Based on https://github.com/vitalets/github-trending-repos/ and a suggestion by @nebgnahz.

Read JUnit HTML output and add a comment to an open issue on GitHub.

This module hacks around the problem of running a Travis-CI job and wanting to notify users of failed tests.

This is a start on solving [Handle Ant's JUnit XML formatted output from test/spec runs](https://github.com/travis-ci/travis-ci/issues/239).

See https://github.com/icyphy/ptII/issues/1 for sample output.

# To Do
1. The contents of the JUnit html output file overview-summary.html is being parsed, which seems fragile.
2. It might be good to list the tests that have failed.
3. It might be good to notice if new tests have failed.

# How to use
1. Set up your Travis-ci job to run JUnit tests, save the output as xml and upload the test results to [GitHub pages](https://docs.travis-ci.com/user/deployment/pages/). See [ptII/.travis.yml](https://github.com/icyphy/ptII/blob/master/.travis.yml) and [ptII/bin/ptIITravisBuild.sh](https://github.com/icyphy/ptII/blob/master/bin/ptIITravisBuild.sh).

2. In the `gh-pages` branch, run the ant junitreport target in frames format.  See [build.xml](https://github.com/icyphy/ptII/blob/gh-pages/build.xml).  The main thing is to create the JUnit HTML summary page at an accessible location.

3. Create an issue in your GitHub repo that will be the issue that gets updated with the test results.  See https://github.com/icyphy/ptII/issues/1
  1. Create a label for the issue that signifies that it will be updated, for example `junit-results`.
  2. Add the URL of the JUnit summary results page created by running the ant junitresults target, for example https://icyphy.github.io/ptII/reports/junit/html/overview-summary.html.  This tool looks for issues with a specific label and searches for urls that matches a regular expression defined in scripts/config.js.  So the issues need to ahve the appropriate label and the appropriate URL.

4. In your environment, set the JUNIT_LABEL variable to the name of the label created above
```
export JUNIT_LABEL=junit-results
```

5. In your environment, set GITHUB_ISSUE_JUNIT=https://api.github.com/repos/cxbrooks/travis-junit
```
export GITHUB_ISSUE_JUNIT=https://api.github.com/repos/cxbrooks/travis-junit
```

6. To update an issue from Travis-ci, get a GitHub token
  1. On [GitHub](https://github.com), under your account on the upper right, click on Settings -> Developer Settings -> Personal access tokens -> [Generate new token](https://github.com/settings/tokens)
  2. The new token should have `public_repo` status
  3. On [Travis-ci](https://travis-ci.org), on your project page, click on More options -> Settings, then add the token from the step above as `GITHUB_TOKEN`
  4. For testing purposes, set the GITHUB_TOKEN environment variable on your local machine

7. If necessary, update the variables in `scripts/config.js`

8. To test:
```
node ./scripts/junit-results.js
```

9. To actually upload the results to an issue:
```
export JUNIT_RESULTS_NOT_DRY_RUN=false
node junit-results.js
```

10. To have Travis do the update, create a script:
```
#!/bin/bash

mkdir node_modules
npm install @icyphy/github-issue-junit
export JUNIT_LABEL=junit-results
export JUNIT_RESULTS_NOT_DRY_RUN=false
export GITHUB_ISSUE_JUNIT=https://api.github.com/repos/cxbrooks/travis-junit
(cd node_modules/@icyphy/github-issue-junit/scripts; node junit-results.js)
```

# How to publish updates to this module

1.  Update the patch number in package.json
2.  Login to npm
        npm login

        Username: icyphy-npm
        Password: See https://wiki.eecs.berkeley.edu/ptolemy/Ptolemy/Accounts
        Email: icyphy-npm@icyphy.org
3.  Publish:
        npm publish --access public
