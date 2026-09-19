param(
    [string]$Message = "Update portfolio"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

if (-not (Test-Path ".git")) {
    throw "This folder is not a Git repository. Open the correct project folder first."
}

Write-Host "Checking repository status..."
$gitStatus = git status --porcelain
if ([string]::IsNullOrWhiteSpace($gitStatus)) {
    Write-Host "No local changes to commit."
    return
}

Write-Host "Adding files..."
git add .

Write-Host "Creating commit..."
git commit -m $Message

Write-Host "Pushing to GitHub..."
git push origin HEAD

Write-Host "Deployment pushed successfully. Vercel should redeploy automatically if connected."
