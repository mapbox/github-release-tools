const test = require('tap').test;
const mockfs = require('mock-fs');

const getRemoteUrl = require('../src/git-remote-url');

test('githubRepoFromGit', (t) => {
    t.tearDown(() => mockfs.restore());
    mockfs({
        '/test/.git/config': `[remote "origin"]
    url = git@github.com:example/some-repository
    fetch = +refs/heads/*:refs/remote/origin/*`
    });

    return getRemoteUrl('/test').then(result => {
        t.equal(result, 'git@github.com:example/some-repository');
        t.end();
    });
});
