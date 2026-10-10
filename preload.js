const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onHotkeyTriggered: (callback) => ipcRenderer.on('global-hotkey-triggered', (event, data) => callback(data)),
    onCopiedToClipboard: (callback) => ipcRenderer.on('copied-to-clipboard', (event, data) => callback(data))
});

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on('global-hotkey-triggered', (event, { team, delta }) => {
        if (typeof window.triggerGlobalHotkeyScore === 'function') {
            window.triggerGlobalHotkeyScore(team, delta);
        }
    });

    ipcRenderer.on('copied-to-clipboard', (event, text) => {
        if (typeof window.showToast === 'function') {
            window.showToast(`📋 تم نسخ الرابط المشفر إلى الحافظة!`, 'success');
        }
    });
});
