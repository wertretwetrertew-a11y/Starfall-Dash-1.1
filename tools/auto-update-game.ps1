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
  Write-Host "This game folder is not a Git repository."
  Write-Host "Expected: Starfall-Dash-1.1\"
  Read-Host "Press Enter to exit"
  exit 1
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
