# ==============================================================================
# MEZO TIK - اختصارات الكيبورد الشاملة للوحة النتائج (Scoreboard Global Hotkeys)
# تعمل في خلفية الويندوز بالكامل حتى وأنت داخل الألعاب أو OBS!
# ==============================================================================

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class HotKeyHelper {
    [DllImport("user32.dll")]
    public static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);
    [DllImport("user32.dll")]
    public static extern bool UnregisterHotKey(IntPtr hWnd, int id);
}
"@ -ReferencedAssemblies "System.Windows.Forms"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   🎮 اختصارات الاسكوربورد الشاملة (MEZO TIK) - شغال في الخلفية   " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [Alt] + [+]     : زيادة النتيجة (+1) 🔔" -ForegroundColor Green
Write-Host " [Alt] + [-]     : إنقاص النتيجة (-1) 🔔" -ForegroundColor Red
Write-Host " [Alt] + [1]     : تحديد التحكم لـ (الفريق 1) 🔴" -ForegroundColor Magenta
Write-Host " [Alt] + [2]     : تحديد التحكم لـ (الفريق 2) 🟢" -ForegroundColor Magenta
Write-Host "----------------------------------------------------------"
Write-Host "جاهز ويعمل الآن في خلفية الويندوز! يمكنك تصغير هذه الشاشة والاستمتاع باللعب." -ForegroundColor White

$serverUrl = "https://gifts-overlay11.onrender.com"
$localUrl = "http://localhost:3001"
$currentTeam = "a"

function Send-ScoreUpdate($team, $delta) {
    try {
        [System.Console]::Beep($(if ($delta -gt 0) { 1200 } else { 650 }), 120)
    } catch {}

    $body = @{ team = $team; delta = $delta } | ConvertTo-Json
    $teamName = if ($team -eq "a") { "الفريق 1" } else { "الفريق 2" }
    $sign = if ($delta -gt 0) { "+$delta" } else { "$delta" }

    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] تم إرسال: $sign لـ ($teamName) 🚀" -ForegroundColor Yellow

    # Try local first, then remote (updates both board_XXXX and default)
    Start-Job -ScriptBlock {
        param($body, $localUrl, $serverUrl)
        $targets = @("board_XXXX", "default")
        foreach ($t in $targets) {
            try {
                Invoke-RestMethod -Uri "$localUrl/api/scoreboard/$t/score" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 1 -ErrorAction SilentlyContinue | Out-Null
            } catch {
                try {
                    Invoke-RestMethod -Uri "$serverUrl/api/scoreboard/$t/score" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 3 -ErrorAction SilentlyContinue | Out-Null
                } catch {}
            }
        }
    } -ArgumentList $body, $localUrl, $serverUrl | Out-Null
}

class HiddenForm : System.Windows.Forms.Form {
    HiddenForm() {
        $this.ShowInTaskbar = $false
        $this.WindowState = [System.Windows.Forms.FormWindowState]::Minimized
    }

    [void]WndProc([ref][System.Windows.Forms.Message]$m) {
        if ($m.Value.Msg -eq 0x0312) { # WM_HOTKEY
            $id = $m.Value.WParam.ToInt32()
            if ($id -eq 1) { Send-ScoreUpdate $global:currentTeam 1 }
            elseif ($id -eq 2) { Send-ScoreUpdate $global:currentTeam -1 }
            elseif ($id -eq 3) {
                $global:currentTeam = "a"
                [System.Console]::Beep(900, 100)
                Write-Host "🎯 تم التبديل للتحكم في (الفريق 1) 🔴" -ForegroundColor Cyan
            }
            elseif ($id -eq 4) {
                $global:currentTeam = "b"
                [System.Console]::Beep(1100, 100)
                Write-Host "🎯 تم التبديل للتحكم في (الفريق 2) 🟢" -ForegroundColor Green
            }
        }
        ([System.Windows.Forms.Form]$this).WndProc($m)
    }
}

$form = [HiddenForm]::new()
$MOD_ALT = 0x0001

# Hotkeys:
# 1: Alt + Plus (=/+)
[HotKeyHelper]::RegisterHotKey($form.Handle, 1, $MOD_ALT, 0xBB) # VK_OEM_PLUS
[HotKeyHelper]::RegisterHotKey($form.Handle, 1, $MOD_ALT, 0x6B) # VK_ADD (Numpad)

# 2: Alt + Minus (-)
[HotKeyHelper]::RegisterHotKey($form.Handle, 2, $MOD_ALT, 0xBD) # VK_OEM_MINUS
[HotKeyHelper]::RegisterHotKey($form.Handle, 2, $MOD_ALT, 0x6D) # VK_SUBTRACT (Numpad)

# 3: Alt + 1
[HotKeyHelper]::RegisterHotKey($form.Handle, 3, $MOD_ALT, 0x31) # '1'
# 4: Alt + 2
[HotKeyHelper]::RegisterHotKey($form.Handle, 4, $MOD_ALT, 0x32) # '2'

[System.Windows.Forms.Application]::Run($form)

# Cleanup on exit
[HotKeyHelper]::UnregisterHotKey($form.Handle, 1)
[HotKeyHelper]::UnregisterHotKey($form.Handle, 2)
[HotKeyHelper]::UnregisterHotKey($form.Handle, 3)
[HotKeyHelper]::UnregisterHotKey($form.Handle, 4)
