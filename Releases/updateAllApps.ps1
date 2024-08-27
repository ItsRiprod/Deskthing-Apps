param (
    [string]$version
)

# Define the base directories
$appExamplesPath = "C:\Users\legom\OneDrive\Desktop\Coding\Website-Development\deskthing-apps"
$releasesPath = "C:\Users\legom\OneDrive\Desktop\Coding\Website-Development\deskthing-apps\releases"

# Ensure the destination directory exists
if (-not (Test-Path $releasesPath)) {
    New-Item -Path $releasesPath -ItemType Directory
}

# Get all directories under appExamples, excluding Legacy and Releases
$appDirs = Get-ChildItem -Path $appExamplesPath -Directory | Where-Object {
    $_.Name -ne 'Legacy' -and $_.Name -ne 'Releases'
}

foreach ($appDir in $appDirs) {
    $projectPath = $appDir.FullName

    # Update the version only if a version is provided
    if ($version) {
        Write-Output "Updating version of project at $projectPath to $version"
        Push-Location -Path $projectPath
        try {
            & npm version $version
            Write-Output "Version updated to $version for $projectPath"
        } catch {
            Write-Error "An error occurred while updating the version for ${projectPath}: $($_)"
        }
        finally {
            Pop-Location
        }
    }

    # Change the version of the project
    Push-Location -Path $projectPath
    try {        
        # Run npm build
        Write-Output "Building project at $projectPath"
        & npm run build
        Write-Output "Build completed for $projectPath"

        # Define the build path
        $buildPath = Join-Path -Path $projectPath -ChildPath "builds"
        if (Test-Path $buildPath) {
            $appName = $appDir.Name
            $zipFileName = "$appName-app-v$version.zip"
            $zipFilePath = Join-Path -Path $releasesPath -ChildPath $zipFileName

            # Remove existing zip file if it exists
            if (Test-Path $zipFilePath) {
                Remove-Item -Path $zipFilePath
            }

            # Create the zip file
            $buildContents = Get-ChildItem -Path $buildPath -File -Recurse
            Compress-Archive -Path $buildContents -DestinationPath $zipFilePath -Force
            Write-Output "Zipped $buildPath to $zipFilePath"
        } else {
            Write-Output "No build folder found for $appName"
        }
    } catch {
        Write-Error "An error occurred while processing ${projectPath}: $($_)"
    }
    finally {
        Pop-Location
    }
}
