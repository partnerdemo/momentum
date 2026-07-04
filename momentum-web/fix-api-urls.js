const fs = require('fs');
const path = require('path');

// Files to update with their specific patterns
const filesToUpdate = [
    {
        path: 'app/web-bff/tasks/[id]/complete/route.ts',
        urlPattern: /const API_URL = `http:\/\/localhost:3000\/api\/v1\/tasks\/\$\{taskId\}\/complete`;/g,
        replacement: 'const API_URL = `${API_BASE_URL}/tasks/${taskId}/complete`;'
    },
    {
        path: 'app/web-bff/store/[id]/purchase/route.ts',
        urlPattern: /const API_URL = `http:\/\/localhost:3000\/api\/v1\/store-items\/\$\{itemId\}\/purchase`;/g,
        replacement: 'const API_URL = `${API_BASE_URL}/store-items/${itemId}/purchase`;'
    },
    {
        path: 'app/web-bff/routines/route.ts',
        urlPattern: /const API_URL = 'http:\/\/localhost:3000\/api\/v1\/routines';/g,
        replacement: "const API_URL = `${API_BASE_URL}/routines`;"
    },
    {
        path: 'app/web-bff/quests/route.ts',
        urlPattern: /const API_URL = 'http:\/\/localhost:3000\/api\/v1\/quests';/g,
        replacement: "const API_URL = `${API_BASE_URL}/quests`;"
    },
    {
        path: 'app/web-bff/routines/[id]/[action]/route.ts',
        urlPattern: /const API_URL = `http:\/\/localhost:3000\/api\/v1\/routines\/\$\{id\}\/\$\{action\}`;/g,
        replacement: 'const API_URL = `${API_BASE_URL}/routines/${id}/${action}`;'
    },
    {
        path: 'app/web-bff/quests/[id]/[action]/route.ts',
        urlPattern: /const API_URL = `http:\/\/localhost:3000\/api\/v1\/quests\/\$\{id\}\/\$\{action\}`;/g,
        replacement: 'const API_URL = `${API_BASE_URL}/quests/${id}/${action}`;'
    },
    {
        path: 'app/web-bff/meals/restaurants/route.ts',
        urlPattern: /const API_URL = 'http:\/\/localhost:3000\/api\/v1\/meals\/restaurants';/g,
        replacement: "const API_URL = `${API_BASE_URL}/meals/restaurants`;"
    },
    {
        path: 'app/web-bff/meals/recipes/route.ts',
        urlPattern: /const API_URL = 'http:\/\/localhost:3000\/api\/v1\/meals\/recipes';/g,
        replacement: "const API_URL = `${API_BASE_URL}/meals/recipes`;"
    },
    {
        path: 'app/web-bff/meals/plans/route.ts',
        urlPattern: /const API_URL = 'http:\/\/localhost:3000\/api\/v1\/meals\/plans';/g,
        replacement: "const API_URL = `${API_BASE_URL}/meals/plans`;"
    }
];

// Files that need special handling (multiple URLs)
const specialFiles = [
    'app/web-bff/family/page-data/route.ts',
    'app/web-bff/family/members/route.ts',
    'app/web-bff/family/members/[id]/route.ts',
    'app/web-bff/family/members/page-data/route.ts'
];

function addImportIfMissing(content) {
    if (!content.includes("import { API_BASE_URL } from '@/lib/config'")) {
        // Add after the last import statement
        const lastImportIndex = content.lastIndexOf('import ');
        const endOfLineIndex = content.indexOf('\n', lastImportIndex);
        return content.slice(0, endOfLineIndex + 1) + "import { API_BASE_URL } from '@/lib/config';\n" + content.slice(endOfLineIndex + 1);
    }
    return content;
}

function updateFile(filePath, urlPattern, replacement) {
    const fullPath = path.join(__dirname, filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`❌ File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Add import if missing
    content = addImportIfMissing(content);

    // Replace URL pattern
    const newContent = content.replace(urlPattern, replacement);

    if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`✅ Updated: ${filePath}`);
    } else {
        console.log(`⚠️  No changes needed: ${filePath}`);
    }
}

function updateSpecialFile(filePath) {
    const fullPath = path.join(__dirname, filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`❌ File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Add import if missing
    content = addImportIfMissing(content);

    // Replace all localhost:3000 URLs with API_BASE_URL
    content = content.replace(/http:\/\/localhost:3000\/api\/v1/g, '${API_BASE_URL}');

    // Fix string quotes to template literals where needed
    content = content.replace(/'(\$\{API_BASE_URL\}[^']+)'/g, '`$1`');

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated (special): ${filePath}`);
}

console.log('🔧 Updating BFF routes to use API_BASE_URL...\n');

// Update regular files
filesToUpdate.forEach(({ path, urlPattern, replacement }) => {
    updateFile(path, urlPattern, replacement);
});

// Update special files
specialFiles.forEach(filePath => {
    updateSpecialFile(filePath);
});

console.log('\n✨ Done!');
