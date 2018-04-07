
const path = require('path');
const ms = require('ms');

const config = {};

// Typical: export JUNIT_LABEL=junit-results
config.issuesLabel = process.env.JUNIT_LABEL;

// Invoke "export JUNIT_RESULTS_NOT_DRY_RUN=true" to actually post/delete comments
config.dryRun = !process.env.JUNIT_RESULTS_NOT_DRY_RUN;

config.githubToken = process.env.GITHUB_TOKEN
config.apiUrl = 'https://api.github.com/repos/cxbrooks/travis-junit';

config.jUnitResultsRetryOptions = {
  retries: 5,
  minTimeout: 5000,
};
config.artifactsPath = path.join('.artifacts', config.issuesLabel || '');
config.isDaily = config.issuesLabel && config.issuesLabel.indexOf('daily') >= 0;
// Period while issues should not be updated: 22 hours for daily, and 6 days for weekly. Allows to re-run script.
config.noUpdatePeriodMs = config.isDaily ? ms('22h') : ms('6d');

module.exports = config;
