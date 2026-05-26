# ==============================================================================
# ROUTEIQ ENTERPRISE GITHUB AUTOMATION PUSH SCRIPT
# ==============================================================================
# This script initializes Git, creates the repository on GitHub using the GitHub REST API,
# and pushes the codebase automatically.

[CmdletBinding()]
param (
    [Parameter(Mandatory=$false)]
    [string]$GitHubUsername,

    [Parameter(Mandatory=$false)]
    [string]$GitHubToken,

    [Parameter(Mandatory=$false)]
    [string]$RepositoryName = "routeiq-enterprise",

    [Parameter(Mandatory=$false)]
    [ValidateSet("public", "private")]
    [string]$Visibility = "private"
)

# Prompt for values if not supplied via parameters
if (-not $GitHubUsername) {
    $GitHubUsername = Read-Host -Prompt "Enter your GitHub Username"
}

if (-not $GitHubToken) {
    $GitHubToken = Read-Host -Prompt "Enter your GitHub Personal Access Token (PAT with repo scope)"
}

Write-Host "`n--- STARTING GITHUB REPOSITORY DEPLOYMENT ---" -ForegroundColor Cyan

# 1. Initialize Git local repository
if (-not (Test-Path .git)) {
    Write-Host "Initializing Git local repository..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "Git repository already initialized." -ForegroundColor Yellow
}

# 2. Add files and make initial commit
Write-Host "Staging files..." -ForegroundColor Yellow
git add -A

Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: RouteIQ Smart Road Intelligence Platform"

# 3. Create the repository on GitHub using the REST API
Write-Host "Creating repository '$RepositoryName' on GitHub (Visibility: $Visibility)..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept"        = "application/vnd.github.v3+json"
}

$body = @{
    name        = $RepositoryName
    private     = ($Visibility -eq "private")
    description = "AI-powered Smart Road Intelligence Platform named RouteIQ"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "Successfully created GitHub repository: $($response.html_url)" -ForegroundColor Green
} catch {
    # If it failed, it might be because the repository already exists. We can attempt to continue.
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 422) {
        Write-Host "Repository '$RepositoryName' may already exist. Proceeding to configure remote." -ForegroundColor Yellow
    } else {
        Write-Error "Failed to create GitHub repository: $_"
        exit
    }
}

# 4. Set remote origin
Write-Host "Configuring remote origin URL..." -ForegroundColor Yellow

# Remove origin if it already exists to avoid duplicate failures
git remote remove origin 2>$null

$remoteUrl = "https://$($GitHubUsername):$($GitHubToken)@github.com/$GitHubUsername/$RepositoryName.git"
git remote add origin $remoteUrl

# 5. Rename branch and push
Write-Host "Pushing to main branch on GitHub..." -ForegroundColor Yellow
git branch -M main
git push -u origin main -f

Write-Host "`n--- DEPLOYMENT COMPLETED SUCCESSFULLY ---" -ForegroundColor Green
Write-Host "Your enterprise codebase is now live at: https://github.com/$GitHubUsername/$RepositoryName" -ForegroundColor Cyan
