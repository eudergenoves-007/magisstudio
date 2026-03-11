import React, { createContext, useContext, useRef, useState } from 'react';
const AudioPlayerContext = createContext();

const MOCK_TRACKS = [
  {
    id: '1',
    title: "Frecuencia Ámbar (Mutación)",
    artist: "Magis",
    streamUrl: "https://res.cloudinary.com/dilmwlnux/video/upload/v1773184871/magis_studio/laboratorio_sonoro/lylvg2ieqb2xl4ahrien.mp3",
    artwork: { url: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=500&auto=format&fit=crop" },
    metadata: { bitDepth: 24, sampleRate: 48000 }
  },
  {
    id: '2',
    title: "Falsa Simetría (Simulacro)",
    artist: "Magis",
    streamUrl: "https://res.cloudinary.com/dilmwlnux/video/upload/v1773184864/magis_studio/laboratorio_sonoro/jqberoeli8ke2rhzpksg.mp3",
    artwork: { url: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=500&auto=format&fit=crop" },
    metadata: { bitDepth: 24, sampleRate: 48000 }
  },
  {
    id: '3',
    title: "Órbita Secreta (Gravedad)",
    artist: "Magis",
    streamUrl: "https://res.cloudinary.com/dilmwlnux/video/upload/v1773184858/magis_studio/laboratorio_sonoro/o5kwghpnhaetpgxbjnh8.mp3",
    artwork: { url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500&auto=format&fit=crop" },
    metadata: { bitDepth: 24, sampleRate: 48000 }
  }
];

export const AudioPlayerProvider = ({ children }) => {
  const audioRef = useRef(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentTrack = MOCK_TRACKS[trackIndex];

  const nextTrack = () => {
    setTrackIndex((prev) => (prev + 1) % MOCK_TRACKS.length);
  };

  const prevTrack = () => {
    setTrackIndex((prev) => (prev - 1 + MOCK_TRACKS.length) % MOCK_TRACKS.length);
  };

  const dispatch = (action) => {
    if (action.type === 'SET_TIME') setCurrentTime(action.value);
    if (action.type === 'SET_DURATION') setDuration(action.value);
    if (action.type === 'SET_PLAYING') setIsPlaying(action.value);
  };

  return (
    <AudioPlayerContext.Provider value={{
      currentTrack,
      isPlaying, currentTime, duration, volume: 1, isMuted: false, 
      isShuffled: false, repeatMode: 'none', isMinimized: false, audioRef, 
      dispatch, 
      togglePlayPause: () => setIsPlaying(!isPlaying), 
      nextTrack, prevTrack, 
      seekTo: (time) => { if(audioRef.current) audioRef.current.currentTime = time; }, 
      setVolume: (v) => { if(audioRef.current) audioRef.current.volume = v; }, 
      toggleMute: () => {}, toggleShuffle: () => {}, cycleRepeat: () => {}, toggleMinimized: () => {}
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};
export const useAudioPlayer = () => useContext(AudioPlayerContext);
