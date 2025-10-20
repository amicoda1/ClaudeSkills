param(
    [switch]$SetupDocTools
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

function Ensure-Dir {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

Ensure-Dir (Join-Path $repoRoot '.local')
Ensure-Dir (Join-Path $repoRoot '.local/work')
Ensure-Dir (Join-Path $repoRoot '.local/out')
Ensure-Dir (Join-Path $repoRoot '.local/tools')

$skillRoots = @('document','presentation','spreadsheet','pdf','other')
foreach ($skill in $skillRoots) {
    Ensure-Dir (Join-Path $repoRoot ".local/work/$skill")
    Ensure-Dir (Join-Path $repoRoot ".local/work/$skill/specs")
    Ensure-Dir (Join-Path $repoRoot ".local/out/$skill")
}

if ($SetupDocTools) {
    $python = $null
    foreach ($candidate in @('py -3','py','python')) {
        try {
            $ver = & $candidate --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                $python = $candidate
                break
            }
        } catch {}
    }
    if (-not $python) {
        throw 'Python 3 não encontrado. Instale Python 3 ou execute o script sem -SetupDocTools.'
    }

    $venvPath = Join-Path $repoRoot '.local/.venv'
    if (-not (Test-Path $venvPath)) {
        Write-Host "Criando venv em $venvPath"
        & $python -m venv $venvPath
    }
    $venvPython = Join-Path $venvPath 'Scripts/python.exe'
    if (-not (Test-Path $venvPython)) {
        throw "Venv inválido em $venvPath (python.exe não encontrado)."
    }

    Write-Host 'Atualizando pip...'
    & $venvPython -m pip install --upgrade pip

    $packages = @('PyYAML','python-docx','python-pptx','openpyxl','reportlab')
    Write-Host "Instalando pacotes: $($packages -join ', ')"
    & $venvPython -m pip install $packages
}

Write-Host 'Ambiente local pronto.'
