import { ipcRenderer } from 'electron'

export function chooseDirectory(defaultPath) {
    return ipcRenderer.invoke('choose-direcotry', defaultPath)
}

export function chooseFile(defaultPath) {
    return ipcRenderer.invoke('choose-file', defaultPath)
}

export function saveFile(defaultPath) {
    return ipcRenderer.invoke('save-file', defaultPath)
}

export function openPath(defaultPath) {
    return ipcRenderer.invoke('open-path', defaultPath)
}

export function showItemInFolder(defaultPath) {
    return ipcRenderer.invoke('show-item-in-folder', defaultPath)
}
