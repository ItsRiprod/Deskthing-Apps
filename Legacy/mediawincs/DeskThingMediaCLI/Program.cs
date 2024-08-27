using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Windows.Media.Control;
using Windows.Foundation.Metadata;
using Windows.Storage.Streams;
using System.Text.Json;
using Windows.Media;
using Windows.Graphics.Imaging;

namespace DeskThingMediaCLI
{
    class Program
    {
        static async Task Main(string[] args)
        {
            if (args.Length == 0)
            {
                await GetMediaPropertiesAsync();
                return;
            }

            bool success = false;
            var sessions = await GlobalSystemMediaTransportControlsSessionManager.RequestAsync();
            var currentSession = sessions.GetCurrentSession();
            if (currentSession == null)
            {
                Console.WriteLine("{ \"error\": \"No active media session.\" }");
                return;
            }

            var command = args[0].ToLowerInvariant();
            switch (command)
            {
                case "play":
                    success = await currentSession.TryPlayAsync();
                    break;
                case "pause":
                    success = await currentSession.TryPauseAsync();
                    break;
                case "toggleplaypause":
                    success = await currentSession.TryTogglePlayPauseAsync();
                    break;
                case "stop":
                    success = await currentSession.TryStopAsync();
                    break;
                case "next":
                    success = await currentSession.TrySkipNextAsync();
                    break;
                case "previous":
                    success = await currentSession.TrySkipPreviousAsync();
                    break;
                case "fastforward":
                    success = await currentSession.TryFastForwardAsync();
                    break;
                case "rewind":
                    success = await currentSession.TryRewindAsync();
                    break;
                case "seek":
                    if (args.Length < 2 || !long.TryParse(args[1], out long positionMs))
                    {
                        Console.WriteLine("{ \"error\": \"Seek command requires position in milliseconds.\" }");
                        return;
                    }
                    success = await currentSession.TryChangePlaybackPositionAsync(positionMs * 10000);
                    break;
                case "setrepeat":
                    if (args.Length < 2)
                    {
                        Console.WriteLine("{ \"error\": \"SetRepeat command requires mode (none, all, one).\" }");
                        return;
                    }
                    var repeatMode = args[1].ToLowerInvariant();
                    switch (repeatMode)
                    {
                        case "off":
                            success = await currentSession.TryChangeAutoRepeatModeAsync(MediaPlaybackAutoRepeatMode.None);
                            break;
                        case "all":
                            success = await currentSession.TryChangeAutoRepeatModeAsync(MediaPlaybackAutoRepeatMode.List);
                            break;
                        case "track":
                            success = await currentSession.TryChangeAutoRepeatModeAsync(MediaPlaybackAutoRepeatMode.Track);
                            break;
                        default:
                            Console.WriteLine("{ \"error\": \"Invalid repeat mode.\" }");
                            return;
                    }
                    break;
                case "setshuffle":
                    if (args.Length < 2 || !bool.TryParse(args[1], out bool shuffleState))
                    {
                        Console.WriteLine("{ \"error\": \"SetShuffle command requires shuffle state (true or false).\" }");
                        return;
                    }
                    success = await currentSession.TryChangeShuffleActiveAsync(shuffleState);
                    break;
                default:
                    Console.WriteLine("{ \"error\": \"Unknown command.\" }");
                    return;
            }

            Console.WriteLine(success ? "{ \"success\": true }" : "{ \"success\": false }");
        }

        static async Task GetMediaPropertiesAsync()
        {
            if (!ApiInformation.IsTypePresent("Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager"))
            {
                Console.WriteLine("{ \"error\": \"API not present on this system.\" }");
                return;
            }

            var sessions = await GlobalSystemMediaTransportControlsSessionManager.RequestAsync();
            var currentSession = sessions.GetCurrentSession();
            if (currentSession == null)
            {
                Console.WriteLine("{ \"error\": \"No active media session.\" }");
                return;
            }

            var mediaProperties = await currentSession.TryGetMediaPropertiesAsync();
            var playbackInfo = currentSession.GetPlaybackInfo();
            var timelineInfo = currentSession.GetTimelineProperties();

            var result = new Dictionary<string, object>
            {
                { "album", mediaProperties?.AlbumTitle ?? null },
                { "artist", mediaProperties?.Artist ?? null },
                { "playlist", null },
                { "playlist_id", null },
                { "track_name", mediaProperties?.Title ?? string.Empty },
                { "shuffle_state", playbackInfo?.IsShuffleActive },
                { "repeat_state", playbackInfo?.AutoRepeatMode switch
                    {
                        MediaPlaybackAutoRepeatMode.None => "off",
                        MediaPlaybackAutoRepeatMode.List => "all",
                        MediaPlaybackAutoRepeatMode.Track => "track",
                        _ => null
                    }
                },
                { "is_playing", playbackInfo?.PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing },
                { "can_fast_forward", playbackInfo?.Controls.IsFastForwardEnabled ?? false },
                { "can_skip", playbackInfo?.Controls.IsNextEnabled ?? false },
                { "can_like", false },
                { "can_change_volume", false },
                { "can_set_output", false },
                { "track_duration", timelineInfo?.EndTime.TotalMilliseconds },
                { "track_progress", timelineInfo?.Position.TotalMilliseconds },
                { "volume", null },
                { "thumbnail", await ConvertThumbnailToBase64Async(mediaProperties?.Thumbnail) },
                { "device", currentSession.SourceAppUserModelId },
                { "id", mediaProperties?.Title ?? string.Empty },
                { "device_id", "" }
            };

            string jsonOutput = JsonSerializer.Serialize(result);
            Console.WriteLine(jsonOutput);
        }

        static async Task<string> ConvertThumbnailToBase64Async(IRandomAccessStreamReference thumbnail)
        {
            if (thumbnail == null) return "N/A";

            using (var stream = await thumbnail.OpenReadAsync())
            {
                var decoder = await BitmapDecoder.CreateAsync(stream);
                var transform = new BitmapTransform()
                {
                    ScaledWidth = Convert.ToUInt32(decoder.OrientedPixelWidth / 1.2), // Adjust the scale factor as needed
                    ScaledHeight = Convert.ToUInt32(decoder.OrientedPixelHeight / 1.2) // Adjust the scale factor as needed
                };
                var pixelData = await decoder.GetPixelDataAsync(
                    BitmapPixelFormat.Rgba8,
                    BitmapAlphaMode.Premultiplied,
                    transform,
                    ExifOrientationMode.IgnoreExifOrientation,
                    ColorManagementMode.DoNotColorManage);

                var pixels = pixelData.DetachPixelData();

                using (var resizedStream = new InMemoryRandomAccessStream())
                {
                    var encoder = await BitmapEncoder.CreateAsync(BitmapEncoder.PngEncoderId, resizedStream);
                    encoder.SetPixelData(
                        BitmapPixelFormat.Rgba8,
                        BitmapAlphaMode.Premultiplied,
                        transform.ScaledWidth,
                        transform.ScaledHeight,
                        decoder.DpiX,
                        decoder.DpiY,
                        pixels);
                    await encoder.FlushAsync();

                    var reader = new DataReader(resizedStream.GetInputStreamAt(0));
                    var bytes = new byte[resizedStream.Size];
                    await reader.LoadAsync((uint)resizedStream.Size);
                    reader.ReadBytes(bytes);

                    return Convert.ToBase64String(bytes);
                }
            }
        }
    }
}
