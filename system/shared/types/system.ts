export interface SystemData {
    cpu?: {
        load: number;
        temp: number;
    },
    gpu?: {
        temp: number;
        usage: number;
    },
    ram?: {
        usage: number;
        total: number;
    },
    network?: {
        upload: number;
        download: number;
        ping: number;
        pingTime: number;
    },
    processes?: {
        count: number;
        active: number;
    }
}

export type SystemDataKeys = (keyof SystemData)[]