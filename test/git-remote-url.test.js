const test = require('tap').test;
const mockfs = require('mock-fs');

const getRemoteUrl = require('../src/git-remote-url');

test('githubRepoFromGit', async (t) => {
    t.tearDown(() => mockfs.restore());
    mockfs({
        '/test/.git/config': '' +
        '[remote "origin"]\n' +
        '    url = git@github.com:example/some-repository\n' +
        '    fetch = +refs/heads/*:refs/remote/origin/*'
    });

    const result = await getRemoteUrl('/test');
    t.equal(result, 'git@github.com:example/some-repository');
});
