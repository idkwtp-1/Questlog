Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptPath = WScript.ScriptFullName
parentDir = fso.GetParentFolderName(scriptPath)
psCommand = "powershell -ExecutionPolicy Bypass -File """ & parentDir & "\run.ps1"""
WshShell.Run psCommand, 0, false
