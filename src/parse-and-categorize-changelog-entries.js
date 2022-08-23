// 'canonical_name' maps to start of github PR label name fields
const PR_LABELS = {
    breaking: { canonical_name: 'breaking change' },
    bug: { canonical_name: 'bug' },
    feature: { canonical_name: 'feature' },
    docs: { canonical_name: 'docs' },
    performance: { canonical_name: 'performance' },
    workflow: { canonical_name: 'build', alternative_name: 'workflow :nail_care:' },
    testing: { canonical_name: 'testing' },
    skip: { canonical_name: 'skip changelog' }
};

module.exports = {
    PR_LABELS: PR_LABELS,

    parseEntriesFromPullRequests: function(pullRequests) {
        const entries = [];

        for (const pr of pullRequests) {
            const labelNames = pr.labels.map(l => l.name);

            let foundLabel;
            for (const label of Object.values(PR_LABELS)) {
                if (labelNames.some(l => l.startsWith(label.canonical_name))
                || labelNames.includes(label.alternative_name)) {
                    foundLabel = label;
                }
            }

            let body = pr.title;
            if (pr.body){
                // eslint-disable-next-line no-useless-escape
                let matches = pr.body.match(/\<changelog\>(.+)<\/changelog>/);
                if (matches) {
                    body = matches[1];
                }
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