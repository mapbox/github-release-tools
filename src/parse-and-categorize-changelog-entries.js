// `name` maps to github PR label name fields
const PR_LABELS = {
    breaking: { name: 'breaking change :warning:', canonical_name: 'breaking change' },
    bug: { name: 'bug :beetle:', canonical_name: 'bug' },
    feature: { name: 'feature :green_apple:', canonical_name: 'feature' },
    docs: { name: 'docs :scroll:', canonical_name: 'docs' },
    performance: { name: 'performance :zap:', canonical_name: 'performance' },
    workflow: { name: 'workflow :nail_care:', canonical_name: 'build' },
    testing: { name: 'testing :100:', canonical_name: 'testing' },
    skip: { name: 'skip changelog', canonical_name: 'skip changelog' },
};

module.exports = {
    PR_LABELS: PR_LABELS,

    parseEntriesFromPullRequests: function(pullRequests) {
        const entries = [];

        for (const pr of pullRequests) {
            const labelNames = pr.labels.map(l => l.name);

            let foundLabel;
            for (const label of Object.values(PR_LABELS)) {
                if (labelNames.includes(label.name) || labelNames.includes(label.canonical_name)) {
                    foundLabel = label;
                }
            }

            let body;
            let matches = pr.body.match(/\<changelog\>(.+)<\/changelog>/);
            if (matches) {
                body = matches[1];
            } else {
                body = pr.title;
            }

            const entry = {
                label: foundLabel || null,
                body: body,
                pullRequest: pr,
            };

            entries.push(entry);
        }

        return entries;
    },

    categorizeEntries: function(entries) {
        const sections = {
            breaking: {
                title: 'Breaking changes ⚠️',
                labels: [PR_LABELS.breaking],
                entries: []
            },
            improvements: {
                title: 'Features ✨ and improvements 🏁',
                labels: [PR_LABELS.feature, PR_LABELS.docs, PR_LABELS.performance],
                entries: []
            },
            bugs: {
                title: 'Bug fixes 🐞',
                labels: [PR_LABELS.bug],
                entries: []
            },
            maybeInternal: {
                title: 'MAYBE INTERNAL (workflow changes, issues filed since last release)',
                labels: [PR_LABELS.testing, PR_LABELS.workflow],
                entries: []
            },
            skip: {
                title: 'Skipped (no entry needed)',
                labels: [PR_LABELS.skip],
                entries: []
            },
            unlabeled: {
                title: 'UNCATEGORIZED',
                labels: [],
                entries: []
            },
        };

        for (const entry of entries) {
            let section = Object.values(sections).find((section) => {
                return section.labels.includes(entry.label);
            });

            if (!section) {
                section = sections.unlabeled;
            }

            section.entries.push(entry);
        }

        return sections;
    }
}