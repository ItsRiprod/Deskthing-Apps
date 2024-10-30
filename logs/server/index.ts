import { DeskThing as DK } from 'deskthing-server';
const DeskThing = DK.getInstance();
import { WebSocket } from 'ws';
export { DeskThing } // Required export of this exact name for the server to connect

const start = async () => {
    let Data = await DeskThing.getData()
    DeskThing.on('data', (newData) => {
        // Syncs the data with the server
        Data = newData
        DeskThing.sendLog('New data received!' + Data)
    })

    // Template Items

    
        let ws: WebSocket | null = null;
    
        const connectWebSocket = async () => {
                const reponse = await fetch("https://panel.wepwawet.net/api/client/servers/4edd6252-68e6-4388-b025-54d37e1343e2/websocket", {
                    "headers": {
                      "accept": "application/json",
                      "accept-language": "en-US,en;q=0.9",
                      "priority": "u=1, i",
                      "sec-fetch-dest": "empty",
                      "sec-fetch-mode": "cors",
                      "sec-fetch-site": "same-origin",
                      "x-requested-with": "XMLHttpRequest",
                      "x-xsrf-token": "eyJpdiI6ImZGeEZkbzZMRGNwaFhMb2Z5bFlyd1E9PSIsInZhbHVlIjoiaWFXR1RyYi9xR0dPTzhLNFdyNWtnaUVQSzVYRExvWGN3ak1tSnV3R2pDck9iVTNyOFljeE9ZTXRRT2owaVpKalRFRjNjQlZZWjJZekQ3Mkx6cm1DZnhKcDhKMjRrS1dXLzlNd0VzY2JkOTdncXRuV2ZQMUgrUm9Ca3VmcEt1SSsiLCJtYWMiOiI4N2E5YjQ4ZjhmYTIxMjAxMWU0ODUzNmNjNTM3MGU5NDBmMjdhMjAwMmRhN2I0NzhiYjI1ZmVmMmVkYmZiMDI2IiwidGFnIjoiIn0=",
                      "cookie": "remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d=eyJpdiI6IlNpc2JvYlhwQzFxR2JOZTZ3bWRIaEE9PSIsInZhbHVlIjoiZlJ6YWU4M0gxVGlLYlNiK0lOajhtZUpHZlIyU3Mrd0YwOVhhcmFXYUxxRDdKdm1MTUNEdjRwVUI5UmdGV3QvWHBuaEhEbnFZdldNMkdhd2NVR0s2ZFc2OTA3cEpBU2VINmcwdlpRVU9XRi85QStxNTgyc3FKeGltNUNLalRPa2lZaklBK0ZkN2pHQ0dzUjRjNWNjL2lIMGNiUDQzRlRCTVRRS3pmbkdxMU5GWmFPUXRxQ1NxSksxS3RDR2pWVUlVMTlSWlRGSCt2Uzlla0ZxVnNKb0ExL3NrT2lzbkVYQmFEcWJvdElxRG02ND0iLCJtYWMiOiI4Y2Q5YjFiNTY2Zjg3NTQxNTQ1ZDMwZTRkZmVlODczMDUzM2Y1Y2IyOTc4YTVmNzE5Y2QyMTYwMjlhMGRmZmRjIiwidGFnIjoiIn0%3D; XSRF-TOKEN=eyJpdiI6ImZGeEZkbzZMRGNwaFhMb2Z5bFlyd1E9PSIsInZhbHVlIjoiaWFXR1RyYi9xR0dPTzhLNFdyNWtnaUVQSzVYRExvWGN3ak1tSnV3R2pDck9iVTNyOFljeE9ZTXRRT2owaVpKalRFRjNjQlZZWjJZekQ3Mkx6cm1DZnhKcDhKMjRrS1dXLzlNd0VzY2JkOTdncXRuV2ZQMUgrUm9Ca3VmcEt1SSsiLCJtYWMiOiI4N2E5YjQ4ZjhmYTIxMjAxMWU0ODUzNmNjNTM3MGU5NDBmMjdhMjAwMmRhN2I0NzhiYjI1ZmVmMmVkYmZiMDI2IiwidGFnIjoiIn0%3D; pterodactyl_session=eyJpdiI6Ikh3cFFxZXMvMkxiWWIvSHI4Sm81dWc9PSIsInZhbHVlIjoiY2VFTHlRejFtM3VRRmxNQXhvTUdkeG55T3prVTlVZk5zRWpUVkhrUVlma0RZUUdleUFEa1RNcm83eEJIRTJnRnhCVHlEblBLbitKdFpIdGQ5UFVPcEF0eitlWEFKTGZaUE9vZW1sc3BBRkZpRkp1a0hieVhERUZHMHc0Y2NoaHkiLCJtYWMiOiI5OGNiYTFhNDI3N2EzMTVhMjU1ODliNmY3NzllZmUxYjU4YzUyMzQ5NmEzNDlmM2ZlZDU5YThiZjgzMTBkNDI2IiwidGFnIjoiIn0%3D",
                      "Referer": "https://panel.wepwawet.net/server/4edd6252",
                      "Referrer-Policy": "same-origin"
                    },
                    "body": null,
                    "method": "GET"
                  });

                const token =  JSON.parse(await reponse.text()).token

                console.log('The Token', token)

                ws = new WebSocket(`wss://p-na-01.wepwawet.net:8080/api/servers/4edd6252-68e6-4388-b025-54d37e1343e2/ws`);
    
                ws.onopen = () => {
                    ws?.send(JSON.stringify({
                        event: 'auth',
                        args: [token]
                    })
                    );
                    DeskThing.sendLog('WebSocket connected');
                };
    
                ws.onmessage = (event) => {
                    DeskThing.sendLog('WebSocket message received: ' + event);
                    console.log('Data received from WS ', event);
                }
    
                ws.onerror = (error) => {
                  console.log('Error received from WS: ', error)
                    DeskThing.sendError('WebSocket error: ' + error);
                };
    
                ws.onclose = () => {
                    DeskThing.sendLog('WebSocket disconnected');
                };
        };

        await connectWebSocket();


    

} 

const stop = async () => {
    // Function called when the server is stopped
}

// Main Entrypoint of the server
DeskThing.on('start', start)

// Main exit point of the server
DeskThing.on('stop', stop)