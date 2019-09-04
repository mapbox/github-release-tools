const test = require('tap').test;

const {parseEntriesFromPullRequests, categorizeEntries, PR_LABELS} = require('../src/parse-and-categorize-changelog-entries');

const mockPRs = [
    {
        title: 'This is a feature.',
        body: 'Fake PR body here.',
        labels: [ {name: 'feature :green_apple:'} ]
    },
    {
        title: 'This is a bug.',
        body: 'Even more fake PR body here.',
        labels: [ {name: 'bug :beetle:'} ]
    },
    {
        title: 'This is unlabeled.',
        body: 'Yet another fake PR body here.',
        labels: []
    },
    {
        title: 'This uses the body instead.',
        body: 'A fake PR body\nBut also with some <changelog>CHANGELOG ENTRY TEXT</changelog>',
        labels: [ {name: 'performance :zap:'} ]
    },
];

const mockEntries = [
    {
        body: "A changelog feature entry body",
        label: PR_LABELS.feature,
        pr: {}
    },
    {
        body: "A changelog performance entry body",
        label: PR_LABELS.performance,
        pr: {}
    },
    {
        body: "A changelog bug entry body",
        label: PR_LABELS.bug,
        pr: {}
    }
]


test('parseEntriesFromPullRequests returns entries', async function(t) {
    const entries = parseEntriesFromPullRequests(mockPRs);

    t.equal(entries.length, mockPRs.length, 'Entry count incorrect');
});

test('parseEntriesFromPullRequests uses titles as entry bodies', async function(t) {
    const entries = parseEntriesFromPullRequests(mockPRs);

    t.equal(entries[0].body, mockPRs[0].title, 'Entry body not from PR title');
});

test('parseEntriesFromPullRequests uses optional formatted entries in the body', async function(t) {
    const entries = parseEntriesFromPullRequests(mockPRs);

    t.equal(entries[3].body, 'CHANGELOG ENTRY TEXT', 'Entry body not from formatted PR body');
});

test('parseEntriesFromPullRequests finds a known label type', async function(t) {
    const entries = parseEntriesFromPullRequests(mockPRs);

    t.equal(entries[0].label, PR_LABELS.feature, 'Entry has wrong label');
});

test('parseEntriesFromPullRequests finds entries without matching labels', async function(t) {
    const entries = parseEntriesFromPullRequests(mockPRs);

    t.equal(entries[2].label, null, 'Entry should have no label');
});

test('categorizeEntries', async function(t) {
    const sections = categorizeEntries(mockEntries);

    t.equal(sections.improvements.entries.length, 2);
    t.equal(sections.bugs.entries.length, 1);
    t.equal(sections.unlabeled.entries.length, 0);
});
