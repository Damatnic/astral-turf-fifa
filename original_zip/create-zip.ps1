$sourcePath = Get-Location
$destinationPath = Join-Path $sourcePath "FinalAstralTurf.zip"

# Remove existing zip if it exists
if (Test-Path $destinationPath) {
    Remove-Item $destinationPath -Force
}

# Get all files except excluded directories
$filesToZip = Get-ChildItem -Path $sourcePath -Recurse | 
    Where-Object { 
        $_.FullName -notmatch 'node_modules' -and
        $_.FullName -notmatch '\\dist\\' -and
        $_.FullName -notmatch '\\.git\\' -and
        $_.FullName -notmatch 'src-tauri\\target' -and
        $_.Name -ne 'FinalAstralTurf.zip' -and
        $_.Name -ne 'FinalAstralTurf.tar.gz'
    }

# Create the zip archive
$filesToZip | Compress-Archive -DestinationPath $destinationPath -Force

Write-Host "Created FinalAstralTurf.zip successfully!"
Get-Item $destinationPath | Select-Object Name, Length, LastWriteTime