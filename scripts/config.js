
const path = require('path');
const ms = require('ms');

const config = {};

// The repo that has an issue with label that will be updated.
// Typical: export GITHUB_ISSUE_JUNIT=https://api.github.com/repos/cxbrooks/travis-junit
config.apiUrl = process.env.GITHUB_ISSUE_JUNIT

// The label of an issue in the repo.
// Typical: export JUNIT_LABEL=junit-results
config.issuesLabel = process.env.JUNIT_LABEL;

// To actually post or delete a comment: Invoke "export JUNIT_RESULTS_NOT_DRY_RUN=true" and then invoke.
config.dryRun = !process.env.JUNIT_RESULTS_NOT_DRY_RUN;

// The GitHub personal access token should have public_repo access.
config.githubToken = process.env.GITHUB_TOKEN

// The URL of the JUnitindex.html file.
// export JUNIT_URL_INDEX=https://icyphy.github.io/ptII-test/reports/junit/html/index.html
config.junit_url_index = process.env.JUNIT_URL_INDEX;

// This is used to extract the URL of the JUnit Summary page from the issue.
// This is probably excess generality, but we leave it for now.
config.junit_url_reg = /https:\/\/.*\/reports\/junit\/html\/overview-summary.html/ig;

// Retry options
config.jUnitResultsRetryOptions = {
  retries: 5,
  minTimeout: 5000,
};
config.artifactsPath = path.join('.artifacts', config.issuesLabel || '');
config.isDaily = config.issuesLabel && config.issuesLabel.indexOf('daily') >= 0;
// Period while issues should not be updated: 22 hours for daily, and 6 days for weekly. Allows to re-run script.
config.noUpdatePeriodMs = config.isDaily ? ms('22h') : ms('6d');

module.exports = config;
