// Sections are groups of changelog entries by category
module.exports = function renderSections(sections, format = 'md') {
    if (format === 'md') {
        return renderSectionsMd(sections);
    } else if (format === 'json') {
        return renderSectionsJson(sections);
    } else {
        throw new Error(`Unknown format requested: ${format}`);
    }
}

function renderSectionsMd(sections) {
    let output = '';

    for (const section of Object.values(sections)) {
        if  (section.entries.length > 0) {
            output += `## ${section.title}\n`;
            for (const entry of section.entries) {
                output += renderEntryMd(entry)
                output += '\n';
            }
            output += '\n\n';
        }
    }

    return output;
}

function renderSectionsJson(sections) {
    return JSON.stringify(sections);
}

function renderEntryMd(entry) {
    const description = entry.body;
    const pr = entry.pullRequest;

    const prRef = ` ([#${pr.number}](${pr.html_url}))`;

    let hattip = '';
    if (pr.head.user.login !== pr.base.user.login) {
        hattip += ` (h/t [${pr.user.login}](${pr.user.html_url}))`;
    }

    const output = `* ${description}${prRef}${hattip}`;

    return output;
}


