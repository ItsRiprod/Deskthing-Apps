import React, { useEffect, useState } from "react";
import { DeskThing } from "@deskthing/client";
import { AppSettings, DEVICE_CLIENT, SongData } from "@deskthing/types";
import { DISPLAY_ITEMS } from "../shared/recordTypes"
import { ClockComponent } from "./components/ClockComponent";
import { PlaybackComponent } from "./components/PlaybackComponent";

const App: React.FC = () => {
	const [settings, setSettings] = useState<AppSettings>();
	const [songData, setSongData] = useState<SongData | null>(null)
    const [thumbnail, setThumbnail] = useState<string>('')
    const [isPlaying, setIsPlaying] = useState<boolean>(false)

	const sizeClassMap = {
		small: 'w-[40vw] h-[40vw]',
		medium: 'w-[65vw] h-[65vw]',
		large: 'w-[100vw] h-[100vw]',
		xl: 'w-[130vw] h-[130vw]'
	};


	const textAlignMap: Record<string, string> = {
		left: 'items-start',
		center: 'items-center',
		right: 'items-end',
	};

	const recordXAlignMap: Record<string, Record<string, string>> = {
		small: {
			left: 'left-[-20vw]',
			center: 'left-[30vw]',
			right: 'left-[80vw]',
		},
		medium: {
			left: 'left-[-30vw]',
			center: 'left-[18vw]',
			right: 'left-[65vw]',
		},
		large: {
			left: 'left-[-100vh]',
			center: 'left-[0vh]',
			right: 'left-[100vh]',
		},
	};

	const recordYAlignMap: Record<string, Record<string, string>> = {
		small: {
			top: 'top-[-20vw]',
			middle: 'top-[10vw]',
			bottom: 'top-[40vw]',
		},
		medium: {
			top: 'top-[-35vw]',
			middle: 'top-[-2.5vw]',
			bottom: 'top-[27.5vw]',
		},
		large: {
			top: 'top-[-60vw]',
			middle: 'top-[-20vw]',
			bottom: 'top-[25vw]',
		},
	};


	useEffect(() => {
		const initializeSettings = async () => {
			const settings = await DeskThing.getSettings();
			if (settings) {
				setSettings(settings);
			}
		};

		initializeSettings();

		const removeSettingsListener = DeskThing.on(
			DEVICE_CLIENT.SETTINGS,
			(data) => {
				if (data.payload) {
					console.log("Settings updated:", data.payload);
					setSettings(data.payload);
				}
			}
		);

		return () => {
			removeSettingsListener();
		};
	}, []);

	useEffect(() => {
        let isMounted = true

        const initializeData = async () => {
            try {
                const data = await DeskThing.getMusic()
                if (isMounted && data) {
                    setSongData(data)
                    setThumbnail(data.thumbnail || '')
                }
            } catch (error) {
                console.error('Failed to initialize music data:', error)
            }
        }

        initializeData()

		const coverImg = document.getElementById('cover_img') as HTMLElement | null;
		const albumText = document.getElementById('album_text') as HTMLElement | null;
		const titleText = document.getElementById('title_text') as HTMLElement | null;
		const artistText = document.getElementById('artist_text') as HTMLElement | null;

		const unsubscribe = DeskThing.on('music', (data) => {
			if (!data?.payload) return;

			const newData = data.payload;

			if (songData?.id !== newData.id) {
				setIsPlaying((prev) => newData.is_playing ?? prev);

				if (coverImg) coverImg.style.backgroundImage = `url(${newData.thumbnail})`;
				if (titleText) titleText.textContent = newData.track_name;
				if (artistText) artistText.textContent = newData.artist;
				if (albumText) albumText.textContent = newData.album;
			}
		});

        return () => {
            isMounted = false
            unsubscribe()
        }
    }, [])

	return (
		settings && (
			<div className="flex-col w-screen h-screen flex justify-center items-center p-8" style={{background:`${songData ? songData.color?.rgba : 'rgb(0, 0, 0)'}`}}>
				<div className={`
					fixed 
					${recordXAlignMap[settings?.recordSize?.value][settings?.recordPosX?.value]} 
					${recordYAlignMap[settings?.recordSize?.value][settings?.recordPosY?.value]} 
					left-[-100vh] 
					rounded-full 
					${sizeClassMap[settings?.recordSize?.value]} 
					${isPlaying ? 'animate-spin-slow' : ''}
				`}>
					<div style={{backgroundImage:`url(./vinyl.svg)`}} className="absolute border-black w-full h-full bg-cover bg-center bg-no-repeat " />
					<div id="cover_img" style={{backgroundImage:`url(${thumbnail})`}} className="absolute rounded-full border-black border-2 w-[65%] h-[65%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cover bg-center bg-no-repeat" />
				</div>
				{settings?.display.value.includes(DISPLAY_ITEMS.CLOCK) && (
					<div className="absolute top-2 w-full flex justify-center">
						<ClockComponent currentSong={songData} />
					</div>
				)}
				<div className={`w-full h-full flex flex-col justify-center ${textAlignMap[settings?.textPos?.value]} relative`}>
					{settings?.display.value.includes(DISPLAY_ITEMS.ALBUM) && (
						<p id="album_text" className={`text-xl text-left ${songData?.color?.isLight ? 'text-black' : 'text-white'} font-light`}>{songData?.album || "Nothing" }</p>
					)}
					{settings?.display.value.includes(DISPLAY_ITEMS.TITLE) && (
						<p id="title_text" className={`text-4xl text-left ${songData?.color?.isLight ? 'text-black' : 'text-white'} font-bold`}>{songData?.track_name || "Nothing" }</p>
					)}
					{settings?.display.value.includes(DISPLAY_ITEMS.ARTISTS) && (
						<p id="artist_text" className={`text-3xl text-left ${songData?.color?.isLight ? 'text-black' : 'text-white'} font-normal`}>{songData?.artist || "Nothing" }</p>
					)}
				</div>
				{settings?.display.value.includes(DISPLAY_ITEMS.CONTROLS) && (
					<div className="absolute bottom-2 w-full flex justify-center">
						<PlaybackComponent />
					</div>
				)}
			</div>
		)
	);
};

export default App;
