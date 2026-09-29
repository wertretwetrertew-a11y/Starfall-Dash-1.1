# Starfall Dash — automatic local updater
# Run from the repository root. Checks GitHub and updates the local copy safely.

$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/wertretwetrertew-a11y/Starfall-Dash-1.1.git"
$Branch = "main"
$IntervalSeconds = 15

function Write-Status($text) {
  Write-Host ("[" + (Get-Date -Format "HH:mm:ss") + "] " + $text)
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "Git не найден. Установи Git и запусти updater снова."
  Read-Host "Enter для выхода"
  exit 1
}

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not (Test-Path (Join-Path $Root ".git"))) {
  Write-Host "Папка игры не является Git-репозиторием."
  Write-Host "Ожидается: Starfall-Dash-1.1\"
  Read-Host "Enter для выхода"
  exit 1
}

Write-Status "Starfall Dash auto-updater запущен."
Write-Status "Проверка GitHub каждые $IntervalSeconds секунд."

while ($true) {
  try {
    git fetch origin $Branch --quiet

    $local = (git rev-parse HEAD).Trim()
    $remote = (git rev-parse "origin/$Branch").Trim()

    if ($local -eq $remote) {
      Write-Status "Версия актуальна: $($local.Substring(0,7))"
    } else {
      $status = git status --porcelain
      if ($status) {
        Write-Status "Найдено локальное изменение — обновление пропущено, чтобы ничего не затереть."
      } else {
        Write-Status "Найдена новая версия $($remote.Substring(0,7)). Обновляю игру..."
        git pull --ff-only origin $Branch
        if ($LASTEXITCODE -eq 0) {
          Write-Status "Игра обновлена до $($remote.Substring(0,7))."
        } else {
          Write-Status "Git pull не выполнен. Проверь репозиторий."
        }
      }
    }
  } catch {
    Write-Status "Ошибка проверки: $($_.Exception.Message)"
  }

  Start-Sleep -Seconds $IntervalSeconds
}
