import React, { useState } from 'react';
import { imgUrl } from '../../../../services/screenshot.service';
import { fmt } from '../../../../utils/helpers';

const ScreenshotsPanel = ({ shots = [], date }) => {
  const [lightbox, setLightbox] = useState(null);

  if (!shots.length) return (
    <div style={{ textAlign:'center', padding:'32px', color:'var(--text2)' }}>
      <div style={{ fontSize:32, marginBottom:8 }}>🖥</div>
      <div>No screenshots for {date}</div>
    </div>
  );

  return (
    <>
      <div className="screenshot-grid">
        {shots.map((s, i) => (
          <div key={i} className="screenshot-thumb" onClick={() => setLightbox(s)}>
            <img src={imgUrl(s.file_path)} alt="" onError={e => e.target.style.display='none'}/>
            <div className="screenshot-time">{fmt.time(s.captured_at)}</div>
          </div>
        ))}
      </div>
      {lightbox && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setLightbox(null)}>
          <div style={{ position:'relative', maxWidth:'90vw', background:'var(--bg2)', padding:16, borderRadius:10, border:'1px solid var(--border2)' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} style={{ position:'absolute', top:-12, right:-12, background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--text)', width:28, height:28, borderRadius:'50%', cursor:'pointer', fontSize:14 }}>✕</button>
            <img src={imgUrl(lightbox.file_path)} alt="" style={{ maxWidth:'85vw', maxHeight:'80vh', borderRadius:8 }}/>
            <div style={{ marginTop:8, textAlign:'center', color:'var(--text2)', fontSize:12 }}>{fmt.datetime(lightbox.captured_at)}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScreenshotsPanel;
