
const test = require('tap').test;

const renderSections = require('../src/render');

const mockPr = {
    html_url: 'https://github.com/mapbox/mapbox-gl-js/pull/1',
    number: 1,
    user: {
        login: 'fake-user',
        html_url: 'https://github.com/fake-user'
    },
    head: {
        user: { login: 'fake-user' }
    },
    base: {
        user: { login: 'mapbox' }
    }
};

const mockSections = {
    bugs: {
        title: "Bug fixes",
        labels: [{ name: "bug :beetle:" }],
        entries: [
            {
                body: "A changelog bug entry body",
                label: { name: "bug :beetle:" },
                pullRequest: mockPr
            }
        ]
    }
};

test('renderSections supports json formatting', async function(t) {
    const rendered = renderSections(mockSections, 'json');

    t.doesNotThrow(function() {
        JSON.parse(rendered);
    });
    t.ok(rendered.length > 0);
});

test('renderSections supports markdown formatting', async function(t) {
    const rendered = renderSections(mockSections, 'md');

    t.ok(rendered.length > 0);
});

test('renderSections markdown includes hattip URLs', async function(t) {
    const rendered = renderSections(mockSections, 'md');

    t.match(rendered, mockPr.user.html_url);
});

