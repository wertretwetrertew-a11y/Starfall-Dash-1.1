# Starfall Dash - automatic local updater
# Run from the repository root. Checks GitHub and updates the local copy safely.

$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/wertretwetrertew-a11y/Starfall-Dash-1.1.git"
$Branch = "main"
$IntervalSeconds = 15

function Write-Status($text) {
  Write-Host ("[" + (Get-Date -Format "HH:mm:ss") + "] " + $text)
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "Git not found. Install Git and run the updater again."
  Read-Host "Press Enter to exit"
  exit 1
}

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not (Test-Path (Join-Path $Root ".git"))) {
  Write-Status "Git repository not found. Connecting this folder to the Starfall Dash GitHub repository..."
  git init --quiet
  if ($LASTEXITCODE -ne 0) { throw "Could not initialize Git in the game folder." }

  $remoteUrl = (git remote get-url origin 2>$null)
  if (-not $remoteUrl) {
    git remote add origin $RepoUrl
    if ($LASTEXITCODE -ne 0) { throw "Could not add the GitHub remote." }
  }

  git fetch origin $Branch --quiet
  if ($LASTEXITCODE -ne 0) { throw "Could not download the current main branch from GitHub." }

  git reset --hard "origin/$Branch" --quiet
  if ($LASTEXITCODE -ne 0) { throw "Could not synchronize the game folder with main." }

  Write-Status "Game folder connected to GitHub main."
}

Write-Status "Starfall Dash auto-updater started."
Write-Status "Checking GitHub every $IntervalSeconds seconds."

while ($true) {
  try {
    git fetch origin $Branch --quiet

    $local = (git rev-parse HEAD).Trim()
    $remote = (git rev-parse "origin/$Branch").Trim()

    if ($local -eq $remote) {
      Write-Status "Version is up to date: $($local.Substring(0,7))"
    } else {
      $status = git status --porcelain
      if ($status) {
        Write-Status "Local changes detected - update skipped to avoid overwriting them."
      } else {
        Write-Status "New version found: $($remote.Substring(0,7)). Updating game..."
        git pull --ff-only origin $Branch
        if ($LASTEXITCODE -eq 0) {
          Write-Status "Game updated to $($remote.Substring(0,7))."
        } else {
          Write-Status "Git pull failed. Check the repository."
        }
      }
    }
  } catch {
    Write-Status "Update check error: $($_.Exception.Message)"
  }

  Start-Sleep -Seconds $IntervalSeconds
}
