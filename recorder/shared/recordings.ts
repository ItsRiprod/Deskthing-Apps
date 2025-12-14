export type RecordingEntry = {
    id: string;
    filename?: string;
    directory?: string
    durationSeconds?: number;
    sizeBytes?: number;
    createdAt?: string; // ISO string
    // doesnt get stored
    /** If the current is being actively played back */
    isPlaying?: boolean
    /** If the current is actively being recorded to */
    isRecording?: boolean
}

export type RecordingList = RecordingEntry[];