# Copy omnibox URL only from Google Antigravity Authentication window/tab (never IDE tabs).
$ErrorActionPreference = 'SilentlyContinue'
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class AgyOmni3 {
  public const uint KEYEVENTF_KEYUP = 0x0002;
  public const uint INPUT_KEYBOARD = 1;
  public const ushort VK_CONTROL = 0x11;
  public const ushort VK_L = 0x4C;
  public const ushort VK_C = 0x43;
  public const ushort VK_A = 0x41;
  [StructLayout(LayoutKind.Sequential)] public struct INPUT { public uint type; public KEYBDINPUT ki; }
  [StructLayout(LayoutKind.Sequential)] public struct KEYBDINPUT {
    public ushort wVk; public ushort wScan; public uint dwFlags; public uint time; public IntPtr dwExtraInfo;
  }
  [DllImport("user32.dll", SetLastError=true)] public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  public static void Tap(ushort vk, bool down) {
    INPUT[] arr = new INPUT[1];
    arr[0].type = INPUT_KEYBOARD;
    arr[0].ki.wVk = vk;
    arr[0].ki.dwFlags = down ? 0u : KEYEVENTF_KEYUP;
    SendInput(1, arr, Marshal.SizeOf(typeof(INPUT)));
  }
  public static void Chord(ushort vk) {
    Tap(VK_CONTROL, true); System.Threading.Thread.Sleep(40);
    Tap(vk, true); System.Threading.Thread.Sleep(40);
    Tap(vk, false); System.Threading.Thread.Sleep(40);
    Tap(VK_CONTROL, false);
  }
}
"@

Add-Type -AssemblyName UIAutomationClient | Out-Null
Add-Type -AssemblyName UIAutomationTypes | Out-Null

function Force-Foreground([IntPtr]$hWnd) {
  $prev = [AgyOmni3]::GetForegroundWindow()
  $pid1 = 0; $pid2 = 0
  $tForeground = [AgyOmni3]::GetWindowThreadProcessId($prev, [ref]$pid1)
  $tTarget = [AgyOmni3]::GetWindowThreadProcessId($hWnd, [ref]$pid2)
  $tCurrent = [AgyOmni3]::GetCurrentThreadId()
  if ($tForeground -ne $tCurrent) { [void][AgyOmni3]::AttachThreadInput($tCurrent, $tForeground, $true) }
  if ($tTarget -ne $tCurrent) { [void][AgyOmni3]::AttachThreadInput($tCurrent, $tTarget, $true) }
  [void][AgyOmni3]::ShowWindow($hWnd, 9)
  [void][AgyOmni3]::BringWindowToTop($hWnd)
  [void][AgyOmni3]::SetForegroundWindow($hWnd)
  if ($tForeground -ne $tCurrent) { [void][AgyOmni3]::AttachThreadInput($tCurrent, $tForeground, $false) }
  if ($tTarget -ne $tCurrent) { [void][AgyOmni3]::AttachThreadInput($tCurrent, $tTarget, $false) }
}

# Prefer UIA: select Authentication tab, then copy omnibox
$root = [System.Windows.Automation.AutomationElement]::RootElement
$winCond = New-Object System.Windows.Automation.PropertyCondition(
  [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
  [System.Windows.Automation.ControlType]::Window
)
$targetEl = $null
foreach ($w in $root.FindAll([System.Windows.Automation.TreeScope]::Children, $winCond)) {
  $name = ''
  try { $name = [string]$w.Current.Name } catch { continue }
  if ($name -notmatch 'Chrome|Edge|Brave|Chromium') { continue }

  if ($name -match 'Authentication' -or $name -match 'oauth-callback') {
    $targetEl = $w
    break
  }

  $tabCond = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::TabItem
  )
  foreach ($tab in $w.FindAll([System.Windows.Automation.TreeScope]::Descendants, $tabCond)) {
    try {
      $tn = [string]$tab.Current.Name
      if ($tn -notmatch 'Authentication' -and $tn -notmatch 'oauth-callback') { continue }
      try {
        $sel = $tab.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern)
        if ($sel) { $sel.Select(); Start-Sleep -Milliseconds 300 }
      } catch {}
      $targetEl = $w
      break
    } catch {}
  }
  if ($targetEl) { break }
}

if (-not $targetEl) { '' ; exit 0 }

try { Set-Clipboard -Value '' } catch {}
Start-Sleep -Milliseconds 60

$prev = [AgyOmni3]::GetForegroundWindow()
$hwnd = [IntPtr]$targetEl.Current.NativeWindowHandle
if ($hwnd -eq [IntPtr]::Zero) { '' ; exit 0 }
Force-Foreground $hwnd
Start-Sleep -Milliseconds 280
[AgyOmni3]::Chord([AgyOmni3]::VK_L)
Start-Sleep -Milliseconds 150
[AgyOmni3]::Chord([AgyOmni3]::VK_A)
Start-Sleep -Milliseconds 80
[AgyOmni3]::Chord([AgyOmni3]::VK_C)
Start-Sleep -Milliseconds 220
if ($prev -ne [IntPtr]::Zero) { [void][AgyOmni3]::SetForegroundWindow($prev) }

$clip = ''
try { $clip = Get-Clipboard -Raw } catch { $clip = '' }
if ($null -eq $clip) { $clip = '' }
# Only return if it looks like oauth / auth code material
if ($clip -match 'oauth-callback' -or $clip -match '[?&]code=' -or $clip -match '^4/' -or $clip -match 'Paste this code') {
  $clip
} else {
  ''
}
