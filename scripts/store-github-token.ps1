# Store a GitHub Personal Access Token in Git Credential Manager (Windows).
# Run locally:  .\scripts\store-github-token.ps1
# Do not paste tokens in chat or commit them to the repo.

param(
    [string]$Username = "bmubook",
    [string]$HostName = "github.com"
)

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed or not on PATH."
    exit 1
}

$token = Read-Host "Paste your GitHub PAT (input is hidden)" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if ([string]::IsNullOrWhiteSpace($plain)) {
    Write-Error "Token is empty."
    exit 1
}

$cred = @"
protocol=https
host=$HostName
username=$Username
password=$plain
"@

$cred | git credential-manager store --no-ui
$plain = $null

Set-Location $PSScriptRoot\..
$head = git ls-remote origin HEAD 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Credential stored, but git could not reach origin. Check token scopes (repo) and remote URL."
    exit 1
}

Write-Host "GitHub credential stored. Remote HEAD: $($head.Split()[0])"
