const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getFiles(filePath, fileList);
        } else if (filePath.endsWith('.ejs')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const viewsDir = path.join(__dirname, 'views');
const ejsFiles = getFiles(viewsDir);

let changedFiles = 0;

ejsFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // Replace classes
    content = content.replace(/\bbg-white\b/g, 'bg-body');
    content = content.replace(/\bbg-light\b/g, 'bg-body-tertiary');
    content = content.replace(/\btable-light\b/g, 'table-secondary'); // fallback for table headers
    content = content.replace(/\btext-dark\b/g, 'text-body');
    
    // Fix badges and warnings that need text-dark for contrast
    content = content.replace(/\bbg-warning text-body\b/g, 'bg-warning text-dark');
    content = content.replace(/\bbg-warning\s+text-body\b/g, 'bg-warning text-dark');
    content = content.replace(/warning text-body/g, 'warning text-dark');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
        changedFiles++;
    }
});

console.log(`\nReplacement complete. Updated ${changedFiles} files.`);
