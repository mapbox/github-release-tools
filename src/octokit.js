const octokit = require('@octokit/rest')();
const Bottleneck = require('bottleneck');

// This module provides an instance of the github API, with each method
// wrapped in a rate-limit-throttling function

function createLimiters(authenticated) {
    // https://developer.github.com/v3/#rate-limiting
    const searchRate = 60 * 1000 / (authenticated ? 30 : 10);
    const coreRate = 60 * 60 * 1000 / (authenticated ? 5000 : 60);
    return {
        search: new Bottleneck({maxConcurrent: 1, minTime: searchRate}),
        core: new Bottleneck({maxConcurrent: 1, minTime: coreRate})
    };
}

const wrapped = {
    authenticate(...args) {
        octokit.authenticate.apply(octokit, args);
        this._wrap(true);
    },

    _wrap(authenticated) {
        const {search, core} = createLimiters(authenticated);

        for (const method of ['hasNextPage', 'hasPreviousPage']) {
            wrapped[method] = octokit[method];
        }
        for (const method of ['getNextPage', 'getPreviousPage', 'getFirstPage', 'getLastPage']) {
            wrapped[method] = core.wrap(octokit[method]);
        }

        for (const endpoint in octokit) {
            const api = octokit[endpoint];
            if (typeof api !== 'object') continue;
            wrapped[endpoint] = {};
            const limiter = endpoint === 'search' ? search : core;
            for (const method in api) {
                if (typeof api[method] !== 'function') continue;
                wrapped[endpoint][method] = limiter.wrap(api[method]);
            }
        }
    }
};

wrapped._wrap();

module.exports = wrapped;

