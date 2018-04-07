/**
 * Main script for updating an issue with junit summary results.
 * 
 * Based on https://github.com/vitalets/github-trending-repos/blob/master/scripts/update-issues.js
 */

const config = require('./config');
const {log, logError} = require('./helpers/logger');
const reporter = require('./helpers/reporter');
const stat = require('./helpers/stat');
const Issues = require('./helpers/issues');
const JUnitUpdater = require('./helpers/junit-updater');

main()
    .catch(e => {
        logError(e);
        process.exit(1);
    });

async function main() {
    reporter.logStart();
    await updateIssues();
    reporter.logFinish();
    throwIfErrors();
}

async function updateIssues() {
    const issues = await new Issues(config.issuesLabel, config.lang).getAll();
    for (const issue of issues) {
        try {
            log(`junit-result.js: updateIssues: ${issue}`);
            const updater = new JUnitUpdater(issue);
            await updater.update();
            handleIssueSuccess(updater.updated);
        } catch(e) {
            handleIssueError(e);
        } finally {
            stat.processed++;
            log(`Issue ${stat.processed} of ${issues.length}`);
        }
    }
}

function throwIfErrors() {
    if (stat.errors > 0) {
        throw new Error(`There are ${stat.errors} error(s)`);
    }
}

function handleIssueError(error) {
    stat.errors++;
    if (config.dryRun) {
        throw error;
    } else {
        logError(error);
    }
}

function handleIssueSuccess(updated) {
    if (updated) {
        stat.updated++;
    }
}
