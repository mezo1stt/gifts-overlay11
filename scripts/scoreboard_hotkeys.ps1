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
Write-Host " [Alt] + [1]     : زيادة نقطة (+1) للفريق الأحمر 🔴" -ForegroundColor Green
Write-Host " [Alt] + [2]     : زيادة نقطة (+1) للفريق الثاني 🟢" -ForegroundColor Green
Write-Host " [Alt] + [+]     : زيادة نقطة (+1) للفريق النشط 🔔" -ForegroundColor Yellow
Write-Host " [Alt] + [-]     : إنقاص نقطة (-1) للفريق النشط 🔔" -ForegroundColor Red
Write-Host " [Alt] + [3]     : إنقاص نقطة (-1) للفريق الأحمر 🔴" -ForegroundColor DarkRed
Write-Host " [Alt] + [4]     : إنقاص نقطة (-1) للفريق الثاني 🟢" -ForegroundColor DarkRed
Write-Host "----------------------------------------------------------"
Write-Host "جاهز ويعمل الآن في خلفية الويندوز بالكامل!" -ForegroundColor White
Write-Host "يمكنك تصغير هذه الشاشة والاستمتاع باللعب أو البث الآن." -ForegroundColor Gray

$global:currentTeam = "a"

function Send-ScoreUpdate($team, $delta) {
    try {
        if ($delta -gt 0) {
            [System.Console]::Beep(1200, 90)
        } else {
            [System.Console]::Beep(650, 110)
        }
    } catch {}

    $body = @{ team = $team; delta = $delta } | ConvertTo-Json -Compress
    $teamName = if ($team -eq "a") { "الفريق الأحمر 🔴" } else { "الفريق الثاني 🟢" }
    $sign = if ($delta -gt 0) { "+$delta" } else { "$delta" }

    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] تم إرسال: $sign لـ ($teamName)" -ForegroundColor $(if ($delta -gt 0) { "Green" } else { "Red" })

    # Ultra-fast non-blocking background web request
    [System.Threading.ThreadPool]::QueueUserWorkItem({
        param($bodyJson)
        $endpoints = @(
            "https://gifts-overlay11.onrender.com/api/scoreboard/board_XXXX/score",
            "https://gifts-overlay11.onrender.com/api/scoreboard/default/score",
            "http://127.0.0.1:3001/api/scoreboard/board_XXXX/score"
        )
        foreach ($u in $endpoints) {
            try {
                $wc = New-Object System.Net.WebClient
                $wc.Headers.Add("Content-Type", "application/json")
                $wc.UploadString($u, "POST", $bodyJson) | Out-Null
            } catch {}
        }
    }, $body) | Out-Null
}

class HiddenForm : System.Windows.Forms.Form {
    HiddenForm() {
        $this.ShowInTaskbar = $false
        $this.WindowState = [System.Windows.Forms.FormWindowState]::Minimized
    }

    [void]WndProc([ref][System.Windows.Forms.Message]$m) {
        if ($m.Value.Msg -eq 0x0312) { # WM_HOTKEY
            $id = $m.Value.WParam.ToInt32()
            if ($id -eq 1) { 
                # Alt + 1 -> Direct increase Team A (Red)
                $global:currentTeam = "a"
                Send-ScoreUpdate "a" 1 
            }
            elseif ($id -eq 2) { 
                # Alt + 2 -> Direct increase Team B
                $global:currentTeam = "b"
                Send-ScoreUpdate "b" 1 
            }
            elseif ($id -eq 3) { 
                # Alt + Plus -> Increase active team
                Send-ScoreUpdate $global:currentTeam 1 
            }
            elseif ($id -eq 4) { 
                # Alt + Minus -> Decrease active team
                Send-ScoreUpdate $global:currentTeam -1 
            }
            elseif ($id -eq 5) {
                # Alt + 3 -> Decrease Red
                $global:currentTeam = "a"
                Send-ScoreUpdate "a" -1
            }
            elseif ($id -eq 6) {
                # Alt + 4 -> Decrease Blue
                $global:currentTeam = "b"
                Send-ScoreUpdate "b" -1
            }
        }
        ([System.Windows.Forms.Form]$this).WndProc($m)
    }
}

$form = [HiddenForm]::new()
$MOD_ALT = 0x0001

# Hotkeys:
# 1: Alt + 1 (Direct +1 Red)
[HotKeyHelper]::RegisterHotKey($form.Handle, 1, $MOD_ALT, 0x31) # '1'
[HotKeyHelper]::RegisterHotKey($form.Handle, 1, $MOD_ALT, 0x61) # Numpad 1

# 2: Alt + 2 (Direct +1 Blue)
[HotKeyHelper]::RegisterHotKey($form.Handle, 2, $MOD_ALT, 0x32) # '2'
[HotKeyHelper]::RegisterHotKey($form.Handle, 2, $MOD_ALT, 0x62) # Numpad 2

# 3: Alt + Plus (=/+)
[HotKeyHelper]::RegisterHotKey($form.Handle, 3, $MOD_ALT, 0xBB) # VK_OEM_PLUS
[HotKeyHelper]::RegisterHotKey($form.Handle, 3, $MOD_ALT, 0x6B) # VK_ADD (Numpad)

# 4: Alt + Minus (-)
[HotKeyHelper]::RegisterHotKey($form.Handle, 4, $MOD_ALT, 0xBD) # VK_OEM_MINUS
[HotKeyHelper]::RegisterHotKey($form.Handle, 4, $MOD_ALT, 0x6D) # VK_SUBTRACT (Numpad)

# 5: Alt + 3 (Direct -1 Red)
[HotKeyHelper]::RegisterHotKey($form.Handle, 5, $MOD_ALT, 0x33) # '3'

# 6: Alt + 4 (Direct -1 Blue)
[HotKeyHelper]::RegisterHotKey($form.Handle, 6, $MOD_ALT, 0x34) # '4'

[System.Windows.Forms.Application]::Run($form)

# Cleanup on exit
for ($i = 1; $i -le 6; $i++) {
    [HotKeyHelper]::UnregisterHotKey($form.Handle, $i)
}
