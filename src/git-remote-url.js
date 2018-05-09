
const gitConfig = require('gitconfiglocal');

// Return a promise for the 'origin' remote url from the given local git repo
module.exports = function(dir = process.cwd()) {
    return new Promise((resolve, reject) => {
        gitConfig(dir, (err, config) => {
            if (err) { return reject(err); }

            if (!(config.remote && config.remote.origin && config.remote.origin.url)) {
                return reject(new Error(`Couldn't find remote 'origin' for ${dir}.`));
            }

            resolve(config.remote.origin.url);
        });
    });
};
