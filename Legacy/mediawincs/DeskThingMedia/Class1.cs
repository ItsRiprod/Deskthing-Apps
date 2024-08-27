using Windows.Media.Control;
using Windows.Foundation.Metadata;
using Windows.Storage.Streams;

namespace DeskThingMediaLibrary
{
    public class DeskThingMediaHelper
    {
        public async Task<Dictionary<string, object>> GetCurrentMediaPropertiesAsync()
        {
            if (!ApiInformation.IsTypePresent("Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager"))
            {
                return new Dictionary<string, object> { { "Error", "API not present on this system." } };
            }

            var sessions = await GlobalSystemMediaTransportControlsSessionManager.RequestAsync();
            var currentSession = sessions.GetCurrentSession();
            if (currentSession == null)
            {
                return new Dictionary<string, object> { { "Error", "No active media session" } };
            }

            var mediaProperties = await currentSession.TryGetMediaPropertiesAsync();

            var result = new Dictionary<string, object>
            {
                { "AlbumArtist", mediaProperties.AlbumArtist },
                { "AlbumTitle", mediaProperties.AlbumTitle },
                { "AlbumTrackCount", mediaProperties.AlbumTrackCount },
                { "Artist", mediaProperties.Artist },
                { "Genres", string.Join(", ", mediaProperties.Genres) },
                { "PlaybackType", mediaProperties.PlaybackType.ToString() },
                { "Subtitle", mediaProperties.Subtitle },
                { "Thumbnail", await ConvertToBase64Async(mediaProperties.Thumbnail) },
                { "Title", mediaProperties.Title },
                { "TrackNumber", mediaProperties.TrackNumber }
            };

            return result;
        }
        private async Task<string> ConvertToBase64Async(IRandomAccessStreamReference thumbnail)
        {
            if (thumbnail == null) return null;

            var stream = await thumbnail.OpenReadAsync();
            var reader = new DataReader(stream);
            var bytes = new byte[stream.Size];
            await reader.LoadAsync((uint)stream.Size);
            reader.ReadBytes(bytes);

            return Convert.ToBase64String(bytes);
        }
    }
}
