/**
 * Updates single issue.
 * Based on https://github.com/vitalets/github-trending-repos/blob/master/scripts/helpers/issue-updater.js
 */

const R = require('ramda');
const ms = require('ms');
const config = require('../config');
const {log} = require('./logger');
const Issues = require('./issues');
//const Trends = require('./trends');
const JUnitHTMLResults = require('./junit-html-results');
const Comments = require('./comments');

module.exports = class JUnitUpdater {
    constructor(issue) {
        this._issue = issue;
        this._commentsHelper = new Comments(this._issue);
        this._jUnitResultsRepos = [];
        this._knownRepos = [];
        // this._newRepos = [];
        this._commentBody = '';
        this._updated = false;
    }

    get updated() {
        return this._updated;
    }

    async update() {
        log(`junit-updater.js: update() start`);
        this._logHeader();
        await this._loadJUnitResults();
        this._generateCommentBody();
        if (this._shouldUpdate()) {
            await this._postComment();
        }
    }

    async _loadJUnitResults() {
       const jUnitResultsUrl = Issues.extractJUnitResultsUrl(this._issue);
       this._jUnitResultsRepos = await new JUnitHTMLResults(jUnitResultsUrl, config.jUnitResultsRetryOptions).getAll();
    }

    async _postComment() {
        const result = await this._commentsHelper.post(this._commentBody);
        if (result.url) {
            this._updated = true;
            log(`Commented: ${result.html_url}`);
        } else {
            throw new Error(JSON.stringify(result));
        }
    }

    _shouldUpdate() {
        if (config.dryRun) {
            log(`DRY RUN! Skip posting comment.\nComment body:\n${this._commentBody}`);
            return false;
        }
        const timeSinceLastUpdate = Date.now() - this._commentsHelper.lastCommentTimestamp;
        if (timeSinceLastUpdate < config.noUpdatePeriodMs) {
            log([
                `RECENTLY UPDATED (${ms(timeSinceLastUpdate)} ago)! Skip posting comment.`,
                `Comment body:\n${this._commentBody}`
            ].join('\n'));
            return false;
        }
        return true;
    }

    _logHeader() {
        log(`\n== ${this._issue.title.toUpperCase()} ==`);
    }

    _generateCommentBody() {
        const header = `**${this._issue.title}!**`;
        const commentItems = this._jUnitResultsRepos.map(repo => {
           return [
             `[${repo.name.replace('/', ' / ')}](${repo.url})`,
             repo.description,
             repo.starsAdded ? `***+${repo.starsAdded}** stars ${since}*` : '',
           ].filter(Boolean).join('\n');
         });
        log(`junit-updated.js: _generateCommentBody(): this._jUnitResultsRepos: ${this._jUnitResultsRepos}`);
        this._commentBody = [header, ...commentItems].join('\n\n');
    }
};
