# PowerShell script to replace hardcoded API URLs with API_BASE_URL import
# This script fixes all BFF route files to use the config

$files = @(
    "app\web-bff\tasks\page-data\route.ts",
    "app\web-bff\tasks\[id]\complete\route.ts",
    "app\web-bff\store\page-data\route.ts",
    "app\web-bff\store\[id]\purchase\route.ts",
    "app\web-bff\routines\route.ts",
    "app\web-bff\routines\page-data\route.ts",
    "app\web-bff\routines\[id]\[action]\route.ts",
    "app\web-bff\quests\route.ts",
    "app\web-bff\quests\page-data\route.ts",
    "app\web-bff\quests\[id]\[action]\route.ts",
    "app\web-bff\family\page-data\route.ts",
    "app\web-bff\family\members\route.ts",
    "app\web-bff\family\members\[id]\route.ts",
    "app\web-bff\family\members\page-data\route.ts",
    "app\web-bff\meals\restaurants\route.ts",
    "app\web-bff\meals\recipes\route.ts",
    "app\web-bff\meals\plans\route.ts",
    "app\web-bff\meals\page-data\route.ts"
)

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        Write-Host "Processing: $file"
        $content = Get-Content $filePath -Raw
        
        # Replace localhost:3000 with localhost:3001 (in case some are correct)
        $content = $content -replace 'http://localhost:3000/api/v1', 'http://localhost:3001/api/v1'
        
        # Add import if not present
        if ($content -notmatch "import.*API_BASE_URL.*from.*@/lib/config") {
            $content = $content -replace "(import { NextResponse } from 'next/server';)", "`$1`nimport { API_BASE_URL } from '@/lib/config';"
        }
        
        # Replace hardcoded URLs with API_BASE_URL
        $content = $content -replace "const\s+(\w+)_API_URL\s*=\s*'http://localhost:3001/api/v1/([^']+)';", "const `$1_API_URL = ```${API_BASE_URL}/`$2```;"
        $content = $content -replace "const\s+API_URL\s*=\s*'http://localhost:3001/api/v1/([^']+)';", "const API_URL = ```${API_BASE_URL}/`$1```;"
        $content = $content -replace "const\s+API_URL\s*=\s*``http://localhost:3001/api/v1/([^``]+)``;", "const API_URL = ```${API_BASE_URL}/`$1```;"
        $content = $content -replace "fetch\(`http://localhost:3001/api/v1/([^`]+)`", "fetch(```${API_BASE_URL}/`$1```"
        $content = $content -replace "fetch\('http://localhost:3001/api/v1/([^']+)'", "fetch(```${API_BASE_URL}/`$1```"
        
        Set-Content $filePath $content -NoNewline
        Write-Host "  ✓ Updated"
    } else {
        Write-Host "  ✗ File not found: $file"
    }
}

Write-Host "`nDone! All files have been updated to use API_BASE_URL from config."
