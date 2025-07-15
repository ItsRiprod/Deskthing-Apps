on run
    set trackInfo to ""
    
    -- Check Music app
    try
        tell application "System Events"
            if (name of processes) contains "Music" then
                tell application "Music"
                    if player state is playing then
                        set trackName to name of current track
                        set artistName to artist of current track
                        set albumName to album of current track
                        set trackInfo to "Music: " & trackName & " by " & artistName & " from " & albumName
                    end if
                end tell
            end if
        end tell
    on error e
        set trackInfo to trackInfo & "Music error: " & e & "\n"
    end try
    
    -- Check Spotify
    if trackInfo = "" then
        try
            tell application "System Events"
                if (name of processes) contains "Spotify" then
                    tell application "Spotify"
                        if player state is playing then
                            set trackName to name of current track
                            set artistName to artist of current track
                            set albumName to album of current track
                            set trackInfo to "Spotify: " & trackName & " by " & artistName & " from " & albumName
                        end if
                    end tell
                end if
            end tell
        on error e
            set trackInfo to trackInfo & "Spotify error: " & e & "\n"
        end try
    end if
    
    -- Check browsers for web players
    if trackInfo = "" then
        try
            tell application "System Events"
                set browserNames to {"Google Chrome", "Safari", "Firefox"}
                repeat with browserName in browserNames
                    if (name of processes) contains browserName then
                        tell application browserName
                            try
                                set windowCount to count of windows
                                repeat with i from 1 to windowCount
                                    set windowTitle to name of window i
                                    if windowTitle contains "▶" or windowTitle contains "♪" or windowTitle contains "🎵" or windowTitle contains " - " then
                                        set trackInfo to browserName & " Browser: " & windowTitle
                                        exit repeat
                                    end if
                                end repeat
                                if trackInfo ≠ "" then exit repeat
                            on error
                                -- Skip this browser window
                            end try
                        end tell
                    end if
                end repeat
            end tell
        on error e
            set trackInfo to trackInfo & "Browser error: " & e & "\n"
        end try
    end if
    
    -- Output results
    if trackInfo = "" then
        set trackInfo to "No music currently playing detected"
    end if
    
    -- Also check what processes are actually running
    set runningApps to ""
    try
        tell application "System Events"
            set processList to name of every process
            repeat with processName in processList
                if processName contains "Music" or processName contains "Spotify" or processName contains "Chrome" or processName contains "Safari" or processName contains "Firefox" then
                    set runningApps to runningApps & processName & ", "
                end if
            end repeat
        end tell
    end try
    
    -- Display comprehensive results
    display dialog "Current Music Status:" & return & return & trackInfo & return & return & "Relevant running apps: " & runningApps buttons {"OK"} default button "OK"
    
    return trackInfo
end run 