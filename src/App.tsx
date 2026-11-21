import { useState, useEffect, useRef } from 'react';
import { fetchLyricsExact } from './engine/lyrics/lrclib';
import { parseLRC, findActiveLineIndex, type LyricLine } from './engine/lyrics/lrcParser';

const THEMES = {
  dark: {
    name: 'Cinematic Dark',
    background: 'linear-gradient(135deg, #1a1a2e, #000)',
    activeColor: '#ffffff',
    inactiveColor: '#555555',
    glow: '0 0 20px rgba(255,255,255,0.5)',
  },
  dreamy: {
    name: 'Dreamy Gradient',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    activeColor: '#ffffff',
    inactiveColor: 'rgba(255,255,255,0.4)',
    glow: '0 0 30px rgba(255,255,255,0.8)',
  },
  sunset: {
    name: 'Sunset Glow',
    background: 'linear-gradient(to top, #ff0844 0%, #ffb199 100%)',
    activeColor: '#ffffff',
    inactiveColor: 'rgba(0,0,0,0.4)',
    glow: '0 0 20px rgba(0,0,0,0.3)',
  }
};

export default function App() {
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [songTitle, setSongTitle] = useState('Kesariya');
  const [artistName, setArtistName] = useState('Arijit Singh');
  const [duration, setDuration] = useState(268);
  
  const [themeKey, setThemeKey] = useState<keyof typeof THEMES>('dark');
  const theme = THEMES[themeKey];

  const activeIndex = findActiveLineIndex(lines, currentTimeMs);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchLyricsForSong = async (exactDuration: number) => {
    setLoading(true);
    setLines([]);
    try {
      // Now uses the exactDuration we passed in
      const lyricsData = await fetchLyricsExact(songTitle, artistName, exactDuration);
      if (lyricsData && lyricsData.syncedLyrics) {
        setLines(parseLRC(lyricsData.syncedLyrics));
      } else {
        alert("No synchronized lyrics found for this song.");
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // UPDATED: Now reads the file length automatically
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !audioRef.current) return;
    
    const fileUrl = URL.createObjectURL(file);
    audioRef.current.src = fileUrl;

    // Create a temporary audio object just to read the duration
    const tempAudio = new Audio(fileUrl);
    tempAudio.addEventListener('loadedmetadata', () => {
      const exactSeconds = Math.round(tempAudio.duration);
      
      // 1. Update the UI box
      setDuration(exactSeconds);
      
      // 2. Fetch lyrics using the exact math from the file
      fetchLyricsForSong(exactSeconds);
    });
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => setCurrentTimeMs(audio.currentTime * 1000);
    audio.addEventListener('timeupdate', updateTime);
    return () => audio.removeEventListener('timeupdate', updateTime);
  }, []);

  useEffect(() => {
    if (activeIndex !== -1) {
      const activeEl = document.getElementById(`line-${activeIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeIndex]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#111', color: '#fff', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* LEFT SIDE: Controls */}
      <div style={{ width: '340px', padding: '20px', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
        <h1 style={{ margin: 0 }}>LyricFlow Studio</h1>
        
        <div>
          <label style={{ fontSize: '12px', color: '#888' }}>Song Title</label>
          <input value={songTitle} onChange={(e) => setSongTitle(e.target.value)} style={{ width: '100%', padding: '8px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', marginTop: '4px' }} />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#888' }}>Artist Name</label>
          <input value={artistName} onChange={(e) => setArtistName(e.target.value)} style={{ width: '100%', padding: '8px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', marginTop: '4px' }} />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#888' }}>Duration (auto-detected)</label>
          <input type="number" value={duration} readOnly style={{ width: '100%', padding: '8px', background: '#111', color: '#888', border: '1px solid #333', borderRadius: '4px', marginTop: '4px', cursor: 'not-allowed' }} />
        </div>

        <div style={{ marginTop: '10px' }}>
          <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '8px' }}>Upload MP3</label>
          <input type="file" accept="audio/*" onChange={handleFileUpload} style={{ color: '#fff' }} />
        </div>
        
        {loading && <p style={{ color: '#aaa' }}>Reading file & fetching lyrics...</p>}

        <div style={{ marginTop: '20px' }}>
          <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '8px' }}>Visual Theme</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((key) => (
              <button 
                key={key} 
                onClick={() => setThemeKey(key)}
                style={{ 
                  padding: '10px', 
                  background: themeKey === key ? '#fff' : '#222', 
                  color: themeKey === key ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {THEMES[key].name}
              </button>
            ))}
          </div>
        </div>

        <audio ref={audioRef} controls style={{ width: '100%', marginTop: 'auto' }} />
      </div>

      {/* RIGHT SIDE: The 9:16 Cinematic Canvas */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', padding: '20px' }}>
        <div style={{
          height: '100%',
          aspectRatio: '9 / 16',
          background: theme.background,
          borderRadius: '0px',
          boxShadow: 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          transition: 'background 1s ease'
        }}>
          <div style={{ 
            height: '100%', 
            overflow: 'hidden', 
            padding: '40px 20px', 
            display: 'flex', 
            flexDirection: 'column',
            gap: '24px',
            maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
          }}>
            {lines.length === 0 && !loading && <p style={{ color: theme.inactiveColor, textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>Upload an MP3 to see lyrics</p>}
            
            {lines.map((line, i) => {
              const isActive = i === activeIndex;
              const isPrevious = i < activeIndex;
              
              return (
                <p 
                  key={i} 
                  id={`line-${i}`}
                  style={{
                    margin: 0,
                    fontSize: isActive ? '32px' : '20px',
                    fontWeight: isActive ? '900' : '500',
                    color: isActive ? theme.activeColor : theme.inactiveColor,
                    textAlign: 'center',
                    textShadow: isActive ? theme.glow : 'none',
                    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: isActive ? 'scale(1.05)' : 'scale(0.95)',
                    opacity: isActive ? 1 : (isPrevious ? 0.2 : 0.4),
                  }}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}