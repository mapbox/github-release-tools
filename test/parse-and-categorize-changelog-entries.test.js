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
    }
];

const mockEntries = [
    {
        body: "A changelog feature entry body",
        label: PR_LABELS.feature,
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

test('parseEntriesFromPullRequests finds a known label type', async function(t) {
    const entries = parseEntriesFromPullRequests(mockPRs);
    t.equal(entries[0].label, PR_LABELS.feature, 'Entry has wrong label');
});

test('parseEntriesFromPullRequests finds entries without matching labels', async function(t) {
    const entries = parseEntriesFromPullRequests(mockPRs);
    t.deepEqual(entries[2].label, null, 'Entry should have no label');
});

test('categorizeEntries', async function(t) {
    const sections = categorizeEntries(mockEntries);
    t.equal(sections.improvements.entries.length, 1);
    t.equal(sections.bugs.entries.length, 1);
    t.equal(sections.unlabeled.entries.length, 0);
});
