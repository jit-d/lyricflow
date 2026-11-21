import { useState, useEffect, useRef } from 'react';
import { fetchLyricsExact } from './engine/lyrics/lrclib';
import { parseLRC, findActiveLineIndex, type LyricLine } from './engine/lyrics/lrcParser';

export default function App() {
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [songTitle, setSongTitle] = useState('Kesariya');
  const [artistName, setArtistName] = useState('Arijit Singh');
  
  const [bgColor, setBgColor] = useState('#000000');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [albumArt, setAlbumArt] = useState<string | null>(null);

  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState(32);
  const [animationStyle, setAnimationStyle] = useState('karaoke');
  
  const [filmGrain, setFilmGrain] = useState(false);
  const [vignette, setVignette] = useState(true);
  const [backgroundBlur, setBackgroundBlur] = useState(false);

  const activeIndex = findActiveLineIndex(lines, currentTimeMs);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || durationMs === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    audioRef.current.currentTime = (percent * durationMs) / 1000;
  };

  const formatTime = (ms: number) => {
    if (!ms || isNaN(ms)) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const fetchLyricsForSong = async (exactDuration: number) => {
    setLoading(true);
    setLines([]);
    try {
      const lyricsData = await fetchLyricsExact(songTitle, artistName, exactDuration);
      if (lyricsData && lyricsData.syncedLyrics) {
        setLines(parseLRC(lyricsData.syncedLyrics));
      } else {
        alert("No synchronized lyrics found.");
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !audioRef.current) return;
    
    const fileUrl = URL.createObjectURL(file);
    audioRef.current.src = fileUrl;

    const tempAudio = new Audio(fileUrl);
    tempAudio.addEventListener('loadedmetadata', () => {
      const exactSeconds = Math.round(tempAudio.duration);
      setDurationMs(tempAudio.duration * 1000);
      fetchLyricsForSong(exactSeconds);
    });

    const jsmediatags = (window as any).jsmediatags;
    if (jsmediatags) {
      jsmediatags.read(file, {
        onSuccess: (tag: any) => {
          const image = tag.tags.picture;
          if (image) {
            const base64String = btoa(
              new Uint8Array(image.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            setAlbumArt(`data:${image.format};base64,${base64String}`);
          }
        },
        onError: () => console.log('No album art found'),
      });
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setBgImage(URL.createObjectURL(file));
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateTime = () => setCurrentTimeMs(audio.currentTime * 1000);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  useEffect(() => {
    if (activeIndex !== -1) {
      const activeEl = document.getElementById(`line-${activeIndex}`);
      if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  const renderKaraokeLine = (line: LyricLine, isActive: boolean) => {
    if (!isActive) return line.text;

    const totalDuration = line.endMs - line.startMs;
    const elapsed = currentTimeMs - line.startMs;
    const progress = Math.max(0, Math.min(1, elapsed / totalDuration));
    
    // Move the background mask to create the wipe effect
    const bgPosition = `${100 - (progress * 100)}%`;

    return (
      <span className="smooth-karaoke-container">
        <span className="smooth-karaoke-base">{line.text}</span>
        <span 
          className="smooth-karaoke-fill"
          style={{ backgroundPosition: bgPosition }}
        >
          {line.text}
        </span>
      </span>
    );
  };

  return (
    <div className="app">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div>
          <h1 className="logo">Lyric<span>Flow</span></h1>
          <p className="subtitle">Cinematic Music & Lyrics Studio</p>
        </div>
        
        <div className="control-group">
          <label>Song Title</label>
          <input value={songTitle} onChange={(e) => setSongTitle(e.target.value)} />
        </div>

        <div className="control-group">
          <label>Artist Name</label>
          <input value={artistName} onChange={(e) => setArtistName(e.target.value)} />
        </div>

        <div className="panel">
          <div className="section-title">Typography</div>
          <div className="control-group">
            <label>Font Family</label>
            <select 
              value={fontFamily} 
              onChange={(e) => setFontFamily(e.target.value)} 
              style={{ padding: '10px', background: '#1c1b26', color: 'white', border: '1px solid #302e3c', borderRadius: '8px', outline: 'none' }}
            >
              <option value="Inter">Inter</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Bebas Neue">Bebas Neue</option>
              <option value="Cormorant Garamond">Cormorant Garamond</option>
            </select>
          </div>
          <div className="control-group">
            <label>Font Size: {fontSize}px</label>
            <input type="range" min="18" max="55" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
          </div>
        </div>

        <div className="panel">
          <div className="section-title">Lyric Animation</div>
          <select 
            value={animationStyle} 
            onChange={(e) => setAnimationStyle(e.target.value)} 
            style={{ padding: '10px', background: '#1c1b26', color: 'white', border: '1px solid #302e3c', borderRadius: '8px', outline: 'none' }}
          >
            <option value="karaoke">Karaoke Highlight</option>
            <option value="fade">Fade In</option>
            <option value="slide">Slide Up</option>
            <option value="static">Static Text</option>
          </select>
        </div>

        <div className="panel">
          <div className="section-title">Cinematic Effects</div>
          <label style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={filmGrain} onChange={(e) => setFilmGrain(e.target.checked)} /> Film Grain
          </label>
          <label style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={vignette} onChange={(e) => setVignette(e.target.checked)} /> Vignette
          </label>
          <label style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={backgroundBlur} onChange={(e) => setBackgroundBlur(e.target.checked)} /> Background Blur
          </label>
        </div>

        <div className="panel">
          <div className="section-title">Background</div>
          <input type="color" value={bgColor} onChange={(e) => { setBgColor(e.target.value); setBgImage(null); }} />
          <input type="file" accept="image/*" onChange={handleBgUpload} />
          {bgImage && <button className="remove-button" onClick={() => setBgImage(null)}>Remove Image</button>}
        </div>

        <div className="control-group">
          <label className="section-title">Audio File</label>
          <div className="upload-box" style={{ position: 'relative' }}>
            <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
            <span>Click to Upload MP3</span>
          </div>
        </div>
        
        {loading && <p style={{ color: '#a78bfa', fontSize: '13px' }}>Fetching lyrics...</p>}
        
        {/* HIDDEN AUDIO ELEMENT */}
        <audio ref={audioRef} style={{ display: 'none' }} />
      </div>

      {/* WORKSPACE */}
      <div className="workspace">
        <div className="workspace-header">
          <h2>9:16 Canvas</h2>
          <span>LIVE PREVIEW</span>
        </div>

        <div className="preview" style={{
          background: bgImage ? `url(${bgImage}) center/cover` : bgColor,
        }}>
          
          <div 
            className={backgroundBlur ? "preview-background-blur" : ""} 
            style={{ 
              position: 'absolute', inset: 0, 
              background: albumArt ? `url(${albumArt}) center/cover` : 'transparent',
              opacity: albumArt ? 0.4 : 0,
              zIndex: 0 
            }} 
          />
          
          <div className="preview-overlay" />
          {vignette && <div className="vignette" />}

          <div className="lyrics-container">
            {lines.length === 0 && !loading && <div className="empty-state">Upload an MP3 to start</div>}
            
            {lines.map((line, i) => {
              const isActive = i === activeIndex;
              
              let animClass = '';
              if (isActive) {
                if (animationStyle === 'fade') animClass = 'lyric-fade';
                if (animationStyle === 'slide') animClass = 'lyric-slide';
              }

              return (
                <p 
                  key={i} 
                  id={`line-${i}`}
                  className={`lyric-line ${isActive ? 'active' : 'inactive'} ${animClass}`}
                  style={{
                    fontFamily,
                    fontSize: isActive ? `${fontSize}px` : `${fontSize * 0.7}px`,
                  }}
                >
                  {animationStyle === 'karaoke' ? renderKaraokeLine(line, isActive) : line.text}
                </p>
              );
            })}
          </div>
          
          {filmGrain && <div className="film-grain" />}
        </div>

        {/* CUSTOM PLAYER CONTROLS */}
        <div className="custom-player">
          <button className="play-btn" onClick={togglePlay}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <div className="progress-container">
            <span className="time-text">{formatTime(currentTimeMs)}</span>
            
            <div className="progress-bar" onClick={handleSeek}>
              <div 
                className="progress-fill" 
                style={{ width: `${durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0}%` }} 
              />
            </div>
            
            <span className="time-text">{formatTime(durationMs)}</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}