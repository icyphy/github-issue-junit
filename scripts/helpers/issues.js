/**
 * Gets issues filtered by label and optionally by lang.
 */
const assert = require('assert');
const config = require('../config');
const {log} = require('./logger');
const githubApi = require('./github-api');

const PER_PAGE = 100;

// FIXME: Get rid of the host
const JUNIT_URL_ERROR_REG = /https:\/\/icyphy.github.io\/ptII\/reports\/junit\/html\/alltests-errors.html/ig;
const JUNIT_URL_SUMMARY_REG = /https:\/\/icyphy.github.io\/ptII\/reports\/junit\/html\/overview-summary.html/ig;

module.exports = class Issues {
    constructor(label) {
        this._label = label;
        this._issues = [];
    }

    static extractJUnitErrorResultsUrl(issue) {
        const matches = issue.body.match(JUNIT_URL_ERROR_REG);
        assert(matches, `Can't find JUnit Results url ${JUNIT_URL_ERROR_REG} in body of issue: ${issue.url}, body: ${issue.body}`);
        return matches[0];
    }

    static extractJUnitSummaryResultsUrl(issue) {
        const matches = issue.body.match(JUNIT_URL_SUMMARY_REG);
        assert(matches, `Can't find JUnit Results url ${JUNIT_URL_SUMMARY_REG} in body of issue: ${issue.url}, body: ${issue.body}`);
        return matches[0];
    }

    async getAll() {
        await this._fetchIssues();
        //this._filterByLang();
        return this._issues;
    }

    async _fetchIssues() {
        const url = `issues?labels=${this._label}&per_page=${PER_PAGE}`;
        this._issues = (await githubApi.fetchJson(`get`, url)).result;
        log(`Fetched issues: ${this._issues.length} from ${url}`);
    }
};
