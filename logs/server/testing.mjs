"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = require("ws");
var ws = null;
var connectWebSocket = function () { return __awaiter(void 0, void 0, void 0, function () {
    var reponse, token, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, fetch("https://panel.wepwawet.net/api/client/servers/4edd6252-68e6-4388-b025-54d37e1343e2/websocket", {
                    headers: {
                        accept: "application/json",
                        "accept-language": "en-US,en;q=0.9",
                        priority: "u=1, i",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "x-requested-with": "XMLHttpRequest",
                        "x-xsrf-token": "eyJpdiI6ImZGeEZkbzZMRGNwaFhMb2Z5bFlyd1E9PSIsInZhbHVlIjoiaWFXR1RyYi9xR0dPTzhLNFdyNWtnaUVQSzVYRExvWGN3ak1tSnV3R2pDck9iVTNyOFljeE9ZTXRRT2owaVpKalRFRjNjQlZZWjJZekQ3Mkx6cm1DZnhKcDhKMjRrS1dXLzlNd0VzY2JkOTdncXRuV2ZQMUgrUm9Ca3VmcEt1SSsiLCJtYWMiOiI4N2E5YjQ4ZjhmYTIxMjAxMWU0ODUzNmNjNTM3MGU5NDBmMjdhMjAwMmRhN2I0NzhiYjI1ZmVmMmVkYmZiMDI2IiwidGFnIjoiIn0=",
                        cookie: "remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d=eyJpdiI6IlNpc2JvYlhwQzFxR2JOZTZ3bWRIaEE9PSIsInZhbHVlIjoiZlJ6YWU4M0gxVGlLYlNiK0lOajhtZUpHZlIyU3Mrd0YwOVhhcmFXYUxxRDdKdm1MTUNEdjRwVUI5UmdGV3QvWHBuaEhEbnFZdldNMkdhd2NVR0s2ZFc2OTA3cEpBU2VINmcwdlpRVU9XRi85QStxNTgyc3FKeGltNUNLalRPa2lZaklBK0ZkN2pHQ0dzUjRjNWNjL2lIMGNiUDQzRlRCTVRRS3pmbkdxMU5GWmFPUXRxQ1NxSksxS3RDR2pWVUlVMTlSWlRGSCt2Uzlla0ZxVnNKb0ExL3NrT2lzbkVYQmFEcWJvdElxRG02ND0iLCJtYWMiOiI4Y2Q5YjFiNTY2Zjg3NTQxNTQ1ZDMwZTRkZmVlODczMDUzM2Y1Y2IyOTc4YTVmNzE5Y2QyMTYwMjlhMGRmZmRjIiwidGFnIjoiIn0%3D; XSRF-TOKEN=eyJpdiI6ImZGeEZkbzZMRGNwaFhMb2Z5bFlyd1E9PSIsInZhbHVlIjoiaWFXR1RyYi9xR0dPTzhLNFdyNWtnaUVQSzVYRExvWGN3ak1tSnV3R2pDck9iVTNyOFljeE9ZTXRRT2owaVpKalRFRjNjQlZZWjJZekQ3Mkx6cm1DZnhKcDhKMjRrS1dXLzlNd0VzY2JkOTdncXRuV2ZQMUgrUm9Ca3VmcEt1SSsiLCJtYWMiOiI4N2E5YjQ4ZjhmYTIxMjAxMWU0ODUzNmNjNTM3MGU5NDBmMjdhMjAwMmRhN2I0NzhiYjI1ZmVmMmVkYmZiMDI2IiwidGFnIjoiIn0%3D; pterodactyl_session=eyJpdiI6Ikh3cFFxZXMvMkxiWWIvSHI4Sm81dWc9PSIsInZhbHVlIjoiY2VFTHlRejFtM3VRRmxNQXhvTUdkeG55T3prVTlVZk5zRWpUVkhrUVlma0RZUUdleUFEa1RNcm83eEJIRTJnRnhCVHlEblBLbitKdFpIdGQ5UFVPcEF0eitlWEFKTGZaUE9vZW1sc3BBRkZpRkp1a0hieVhERUZHMHc0Y2NoaHkiLCJtYWMiOiI5OGNiYTFhNDI3N2EzMTVhMjU1ODliNmY3NzllZmUxYjU4YzUyMzQ5NmEzNDlmM2ZlZDU5YThiZjgzMTBkNDI2IiwidGFnIjoiIn0%3D",
                        Referer: "https://panel.wepwawet.net/server/4edd6252",
                        "Referrer-Policy": "same-origin",
                    },
                    body: null,
                    method: "GET",
                })];
            case 1:
                reponse = _c.sent();
                _b = (_a = JSON).parse;
                return [4 /*yield*/, reponse.text()];
            case 2:
                token = _b.apply(_a, [_c.sent()]).token;
                console.log("The Token", token);
                ws = new ws_1.WebSocket("wss://p-na-01.wepwawet.net:8080/api/servers/4edd6252-68e6-4388-b025-54d37e1343e2/ws");
                ws.onopen(function () {
                    ws === null || ws === void 0 ? void 0 : ws.send(JSON.stringify({
                        event: "auth",
                        args: [token],
                    }));
                });
                ws.onmessage(function (event) {
                    console.log("Data received from WS ", event);
                });
                ws.onerror(function (error) {
                    console.log("Error received from WS: ", error);
                });
                ws.onclose(function () {
                    console.log("Connection closed");
                });
                return [2 /*return*/];
        }
    });
}); };
connectWebSocket();
