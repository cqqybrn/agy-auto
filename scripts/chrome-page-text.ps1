# Find Chrome/Edge OAuth callback tab, activate it, return page text (auth code lives on page, not URL).
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName UIAutomationClient | Out-Null
Add-Type -AssemblyName UIAutomationTypes | Out-Null

$root = [System.Windows.Automation.AutomationElement]::RootElement
$winCond = New-Object System.Windows.Automation.PropertyCondition(
  [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
  [System.Windows.Automation.ControlType]::Window
)
$windows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $winCond)
$chunks = New-Object System.Collections.Generic.List[string]

function Is-Browser([string]$name) {
  return $name -match 'Chrome|Edge|Brave|Chromium'
}

function Is-AuthTitle([string]$name) {
  # Strict: official callback title. Do NOT match plain "Antigravity" (IDE / WebUI tabs).
  return $name -match 'Authentication' -or $name -match 'oauth-callback'
}

function Try-SelectAuthTab($win) {
  try {
    $tabCond = New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
      [System.Windows.Automation.ControlType]::TabItem
    )
    $tabs = $win.FindAll([System.Windows.Automation.TreeScope]::Descendants, $tabCond)
    foreach ($tab in $tabs) {
      try {
        $tn = [string]$tab.Current.Name
        if (-not (Is-AuthTitle $tn)) { continue }
        try {
          $sel = $tab.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern)
          if ($sel) { $sel.Select(); Start-Sleep -Milliseconds 250; return $true }
        } catch {}
        try {
          $inv = $tab.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
          if ($inv) { $inv.Invoke(); Start-Sleep -Milliseconds 250; return $true }
        } catch {}
      } catch {}
    }
  } catch {}
  return $false
}

function Collect-Text($win) {
  # Edit fields (code box)
  try {
    $editCond = New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
      [System.Windows.Automation.ControlType]::Edit
    )
    foreach ($edit in $win.FindAll([System.Windows.Automation.TreeScope]::Descendants, $editCond)) {
      try {
        $vp = $edit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
        if (-not $vp) { continue }
        $val = [string]$vp.Current.Value
        if ([string]::IsNullOrWhiteSpace($val)) { continue }
        if ($val -match 'oauth-callback' -or $val -match '[?&]code=' -or $val -match 'Paste this code' -or $val -match '^4/' -or $val.Length -ge 20) {
          [void]$chunks.Add($val)
        }
      } catch {}
    }
  } catch {}

  # Text nodes
  try {
    $textCond = New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
      [System.Windows.Automation.ControlType]::Text
    )
    $n = 0
    foreach ($t in $win.FindAll([System.Windows.Automation.TreeScope]::Descendants, $textCond)) {
      $n++
      if ($n -gt 120) { break }
      try {
        $tn = [string]$t.Current.Name
        if ([string]::IsNullOrWhiteSpace($tn) -or $tn.Length -lt 8) { continue }
        if ($tn -match 'Paste this code|authentication|authorization|授权|oauth|4/' -or $tn.Length -ge 24) {
          [void]$chunks.Add($tn)
        }
      } catch {}
    }
  } catch {}

  # Document name / value
  try {
    $docCond = New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
      [System.Windows.Automation.ControlType]::Document
    )
    foreach ($doc in $win.FindAll([System.Windows.Automation.TreeScope]::Descendants, $docCond)) {
      try {
        $dn = [string]$doc.Current.Name
        if ($dn) { [void]$chunks.Add($dn) }
        $vp = $doc.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
        if ($vp) {
          $val = [string]$vp.Current.Value
          if ($val) { [void]$chunks.Add($val) }
        }
      } catch {}
    }
  } catch {}
}

$authWindow = $null
foreach ($w in $windows) {
  $name = ''
  try { $name = [string]$w.Current.Name } catch { continue }
  if (-not (Is-Browser $name)) { continue }

  if (Is-AuthTitle $name) {
    $authWindow = $w
    break
  }

  # Background tab: select "Google Antigravity Authentication" tab inside this browser window
  if (Try-SelectAuthTab $w) {
    $authWindow = $w
    # refresh name after select
    break
  }
}

if ($authWindow) {
  Collect-Text $authWindow
}

# Also: any browser omnibox currently showing oauth-callback (active tab)
foreach ($w in $windows) {
  $name = ''
  try { $name = [string]$w.Current.Name } catch { continue }
  if (-not (Is-Browser $name)) { continue }
  try {
    $editCond = New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
      [System.Windows.Automation.ControlType]::Edit
    )
    foreach ($edit in $w.FindAll([System.Windows.Automation.TreeScope]::Descendants, $editCond)) {
      try {
        $vp = $edit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
        if (-not $vp) { continue }
        $val = [string]$vp.Current.Value
        if ($val -match 'oauth-callback' -or $val -match 'Paste this code' -or $val -match '[?&]code=') {
          [void]$chunks.Add($val)
        }
      } catch {}
    }
  } catch {}
}

($chunks -join "`n")
