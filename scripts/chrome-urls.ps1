# ASCII-only: list https URLs from Chrome/Edge/Brave address bars via UI Automation.
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName UIAutomationClient | Out-Null
Add-Type -AssemblyName UIAutomationTypes | Out-Null

$root = [System.Windows.Automation.AutomationElement]::RootElement
$winCond = New-Object System.Windows.Automation.PropertyCondition(
  [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
  [System.Windows.Automation.ControlType]::Window
)
$windows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $winCond)
$urls = New-Object System.Collections.Generic.List[string]

function Add-Url([string]$val) {
  if ([string]::IsNullOrWhiteSpace($val)) { return }
  $v = $val.Trim()
  if ($v -match '^https?://' -or $v -match 'oauth-callback' -or $v -match '[?&]code=') {
    if (-not $urls.Contains($v)) { [void]$urls.Add($v) }
  }
}

function Read-EditValue($edit) {
  try {
    $vp = $edit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
    if ($vp) { return [string]$vp.Current.Value }
  } catch {}
  return ''
}

foreach ($w in $windows) {
  $name = ''
  try { $name = [string]$w.Current.Name } catch { continue }
  if ($name -notmatch 'Chrome|Edge|Brave|Chromium') { continue }

  foreach ($an in @(
    'Address and search bar',
    'Omnibox'
  )) {
    try {
      $nameCond = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::NameProperty, $an
      )
      $el = $w.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $nameCond)
      if ($el) { Add-Url (Read-EditValue $el) }
    } catch {}
  }

  try {
    $editCond = New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
      [System.Windows.Automation.ControlType]::Edit
    )
    $edits = $w.FindAll([System.Windows.Automation.TreeScope]::Descendants, $editCond)
    $n = 0
    foreach ($edit in $edits) {
      $n++
      if ($n -gt 50) { break }
      try {
        $val = Read-EditValue $edit
        if ($val -match '^https?://' -or $val -match 'oauth-callback' -or $val -match '[?&]code=') {
          Add-Url $val
        }
      } catch {}
    }
  } catch {}
}

if ($urls.Count -eq 0) { '[]' } else { ($urls | ConvertTo-Json -Compress) }
