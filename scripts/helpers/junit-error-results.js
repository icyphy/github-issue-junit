/**
 * Grabs the errors lines showing the number of JUnit tests from https://icyphy.github.io/ptII/reports/junit/html/alltests-errors.html
 *
 * In case of error retries X times because server can response with different errors:
 * 1. "This page is taking way too long to load." - when page loads too long
 */
// Based on https://github.com/vitalets/github-trending-repos/blob/master/scripts/helpers/trends.js

const axios = require('axios');
const cheerio = require('cheerio');
const promiseRetry = require('promise-retry');
const {log, logError} = require('./logger');
const artifacts = require('./artifacts');
const util = require('util');

const RETRY_DEFAULTS = {
    retries: 5,
    minTimeout: 5000,
};

// JUnit results page can take a long time to load (FIXME: Is this true?)
const request = axios.create({
    timeout: 30 * 1000,
});

module.exports = class JUnitErrorResults {
    constructor(url, retryOptions) {
        this._url = url;
        this._retryOptions = Object.assign({}, RETRY_DEFAULTS, retryOptions);
        this._html = null;
        this._$ = null;
        this._domRepos = null;
        this._repos = [];
        this._filename = this._url.split('/').pop();
    }

    /**
     * Loads JUnit HTML Results (3 retries).
     *
     * @returns {Promise<Array>}
     */
    async getAll() {
        return promiseRetry((retry, attempt) => {
            const date = new Date();
            const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
            log(`Fetching JUnitErrorResults (attempt #${attempt}, ${time}): ${this._url}`);
            return this._loadRepos().catch(e => this._retry(e, retry));
        }, this._retryOptions);
    }

    async _loadRepos() {
        await this._loadHtml();
        this._constructDom();
        this._queryRepos();
        // this._domRepos.each((index, repo) => this._extractRepoInfo(repo));
        // FIXME: just deal with the first item.
        this._extractRepoInfo(this._domRepos[0]);
        if (this._repos.length === 0) {
            throw new Error(`Can't find JUnit Error Results on page: ${this._url}`);
        }
        return this._repos;
    }

    _retry(error, retryFn) {
        const r = error.response;
        if (r) {
            log(`Error: ${r.status} ${r.statusText}`);
            this._saveHtmlToArtifacts(r.data);
        } else {
            logError(error);
            this._saveHtmlToArtifacts(this._html);
        }
        retryFn(error);
    }

    async _loadHtml() {
        this._html = '';
        this._html = (await request(this._url)).data;
    }

    _constructDom() {
        this._$ = cheerio.load(this._html);
    }

    _queryRepos() {
        //this._domRepos = this._$('li', 'ol.repo-list');
        this._domRepos = this._$('table');
        log(`Found JUnit Error HTML page: ${this._domRepos.length}`);
    }

    _extractRepoInfo(repo) {
        const $repo = this._$(repo);
        const repoLength = $repo.length
        const repoName = $repo[0].name
        const repoChildrenLength = $repo[0].children.length;;
        const repoParentLength = $repo[0].parent.children.length;
        const summaryRow = $repo[0].parent.children[9].children[1].children[2];
        const summaryTable = util.inspect(summaryRow, {showHidden: true, depth: 3});
        const tests = summaryRow.children[1].children[0].children[0].data;
        // const summaryTable = util.inspect($repo[0].parent.children[3].children[1].children[0].children[2], {showHidden: true, depth: 2});

        const errorTable = $repo[0].parent.children[9].children[1].children;
        log(`junit-error-results.js: _extractRepoInfo(${repo}), name: ${repoName}, length: ${repoLength}, ${repoChildrenLength}, ${repoParentLength}: tests: ${tests}`);

        // console.log(util.inspect(errorTable));

        var baseUrl = this._url.substring(0, this._url.lastIndexOf('/') + 1);
        for (var i = 1; i < errorTable.length; i++) {
            if (errorTable[i].type === 'tag' && errorTable[i].name === 'tr') {
                // console.log('errorTable ' + i);
                var fullUrl = errorTable[i].children[2].children[1].attribs.href;
                var url = fullUrl.replace(/ /g, '%20');
                var name = fullUrl.substring(fullUrl.indexOf(' ') + 1, fullUrl.length);
                // console.log(`fullUrl: ${fullUrl}, url: ${url}, name: ${name}`);

                const info = {
                    name: name,
                    url: baseUrl + url,
                    description: ''
                };
                this._repos.push(info);
            }
        }
    }

    _saveHtmlToArtifacts(html) {
        try {
            artifacts.save(`${this._filename}.html`, html);
        } catch (e) {
            logError('Error while saving artifact', e);
        }
    }
};

function toNumber(el) {
    return parseInt(el.text().trim().replace(',', '') || 0);
}
