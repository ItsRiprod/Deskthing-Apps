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
    
    -- Check browsers for web players with JavaScript detection
    if trackInfo = "" then
        try
            tell application "Google Chrome"
                repeat with w from 1 to count of windows
                    repeat with t from 1 to count of tabs of window w
                        set tabURL to URL of tab t of window w
                        set tabTitle to title of tab t of window w
                        
                        try
                            if tabURL contains "soundcloud.com" then
                                -- Check if SoundCloud has media (playing OR paused)
                                set hasPlayControl to (execute tab t of window w javascript "document.querySelector('.playControl') !== null")
                                
                                if hasPlayControl then
                                    -- Get track info from DOM elements (works on feed page)
                                    try
                                        set trackName to (execute tab t of window w javascript "document.querySelector('.playbackSoundBadge__titleLink') ? document.querySelector('.playbackSoundBadge__titleLink').title : null")
                                        set artistName to (execute tab t of window w javascript "document.querySelector('.playbackSoundBadge__lightLink') ? document.querySelector('.playbackSoundBadge__lightLink').title : null")
                                        
                                        if trackName is not missing value and trackName is not "" and trackName is not "null" then
                                            if artistName is not missing value and artistName is not "" and artistName is not "null" then
                                                set trackInfo to "SoundCloud: " & trackName & " by " & artistName
                                                return trackInfo
                                            else
                                                set trackInfo to "SoundCloud: " & trackName & " by Unknown Artist"
                                                return trackInfo
                                            end if
                                        end if
                                    on error
                                        -- Fallback to tab title parsing if DOM method fails
                                        if tabTitle contains " by " then
                                            set AppleScript's text item delimiters to " by "
                                            set titleParts to every text item of tabTitle
                                            set trackName to item 1 of titleParts
                                            set artistPart to item 2 of titleParts
                                            set AppleScript's text item delimiters to ""
                                            
                                            -- Clean up track name
                                            if trackName starts with "Stream " then
                                                set trackName to text 8 thru -1 of trackName
                                            end if
                                            
                                            -- Clean up artist (remove " | Listen online..." part)
                                            if artistPart contains " | " then
                                                set AppleScript's text item delimiters to " | "
                                                set artistParts to every text item of artistPart
                                                set artistPart to item 1 of artistParts
                                                set AppleScript's text item delimiters to ""
                                            end if
                                            
                                            set trackInfo to "SoundCloud: " & trackName & " by " & artistPart
                                            return trackInfo
                                        end if
                                    end try
                                end if
                                
                            else if tabURL contains "youtube.com/watch" then
                                -- Check if YouTube video is actually playing
                                set isPlaying to (execute tab t of window w javascript "document.querySelector('video') && !document.querySelector('video').paused")
                                
                                if isPlaying then
                                    -- Parse video title (remove view count and " - YouTube" suffix)
                                    set cleanTitle to tabTitle
                                    if cleanTitle contains " - YouTube" then
                                        set AppleScript's text item delimiters to " - YouTube"
                                        set titleParts to every text item of cleanTitle
                                        set cleanTitle to item 1 of titleParts
                                        set AppleScript's text item delimiters to ""
                                    end if
                                    
                                    -- Remove view count prefix like "(1412) "
                                    if cleanTitle starts with "(" and cleanTitle contains ") " then
                                        set AppleScript's text item delimiters to ") "
                                        set titleParts to every text item of cleanTitle
                                        set AppleScript's text item delimiters to ""
                                        if (count of titleParts) > 1 then
                                            set cleanTitle to ""
                                            repeat with i from 2 to count of titleParts
                                                set cleanTitle to cleanTitle & item i of titleParts
                                                if i < count of titleParts then set cleanTitle to cleanTitle & ") "
                                            end repeat
                                        end if
                                    end if
                                    
                                    set trackInfo to "YouTube: " & cleanTitle
                                    return trackInfo
                                end if
                                
                            else if tabURL contains "open.spotify.com" then
                                -- Check if Spotify Web Player is actually playing
                                set isPlaying to (execute tab t of window w javascript "document.querySelector('[data-testid=\"control-button-playpause\"]') && document.querySelector('[data-testid=\"control-button-playpause\"]').getAttribute('aria-label').includes('Pause')")
                                
                                if isPlaying then
                                    if tabTitle contains " • " then
                                        set AppleScript's text item delimiters to " • "
                                        set titleParts to every text item of tabTitle
                                        set AppleScript's text item delimiters to ""
                                        if (count of titleParts) >= 2 then
                                            set trackInfo to "Spotify Web: " & (item 1 of titleParts) & " by " & (item 2 of titleParts)
                                            return trackInfo
                                        end if
                                    end if
                                end if
                                
                            end if
                        on error
                            -- Skip tabs that can't execute JavaScript
                        end try
                    end repeat
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
    
    -- Log comprehensive results to terminal instead of showing dialog
    log "Current Music Status: " & trackInfo
    log "Relevant running apps: " & runningApps
    
    return trackInfo
end run 