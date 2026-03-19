// ─── magis-studio/frontend/src/components/social/CreatePostModal.jsx ─────────
import { useState, useRef } from 'react';
import { useCreatePost } from '../../hooks/useSocial';
import './CreatePostModal.css';

const MAX_FILES = 10;
const ACCEPTED  = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm';

export default function CreatePostModal({ onClose }) {
  const [files, setFiles]         = useState([]);
  const [previews, setPreviews]   = useState([]);
  const [caption, setCaption]     = useState('');
  const [type, setType]           = useState('regular');
  const [visibility, setVisibility] = useState('public');
  const [commentsOn, setCommentsOn] = useState(true);
  const [dragOver, setDragOver]   = useState(false);
  const fileInputRef = useRef(null);
  const createMutation = useCreatePost();

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles).slice(0, MAX_FILES - files.length);
    setFiles(prev => [...prev, ...arr]);
    arr.forEach(f => {
      const url = URL.createObjectURL(f);
      setPreviews(prev => [...prev, { url, type: f.type.startsWith('video') ? 'video' : 'image' }]);
    });
  };

  const removeFile = (i) => {
    URL.revokeObjectURL(previews[i].url);
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && files.length === 0) return;

    setIsUploading(true);
    const uploadedMedia = [];

    try {
      // Unsigned Upload to Cloudinary for each file
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (cloudName && uploadPreset) {
        for (const fileObj of files) {
          const formData = new FormData();
          formData.append('file', fileObj);
          formData.append('upload_preset', uploadPreset);

          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
            method: 'POST',
            body: formData
          });

          if (res.ok) {
            const data = await res.json();
            uploadedMedia.push({
              url: data.secure_url,
              type: data.resource_type === 'video' ? 'video' : 'image',
              publicId: data.public_id
            });
          }
        }
      }
    } catch(err) {
       console.error("Error uploading to cloudinary", err);
    } finally {
      setIsUploading(false);
    }

    const fd = new FormData();
    fd.append('caption', caption);
    fd.append('type', type);
    fd.append('visibility', visibility);
    fd.append('commentsEnabled', String(commentsOn));
    fd.append('mockMedia', JSON.stringify(uploadedMedia)); // Enviar la multimedia procesada al mock

    await createMutation.mutateAsync(fd);
    onClose();
  };

  const isPending = createMutation.isPending || isUploading;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Nueva publicación">
      <div className="create-modal glass-heavy" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="create-modal__header">
          <h2 className="create-modal__title">Nueva publicación</h2>
          <button className="create-modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="create-modal__form">
          <div className="create-modal__body">

            {/* Media drop zone */}
            <div
              className={`create-modal__dropzone ${dragOver ? 'is-dragover' : ''} ${previews.length > 0 ? 'has-files' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => previews.length === 0 && fileInputRef.current?.click()}
            >
              {previews.length === 0 ? (
                <div className="create-modal__dropzone-empty">
                  <span className="create-modal__dropzone-icon" aria-hidden="true">◈</span>
                  <p>Arrastra fotos/videos o <button type="button" className="create-modal__browse-btn"
                    onClick={() => fileInputRef.current?.click()}>selecciona archivos</button></p>
                  <p className="create-modal__dropzone-hint font-mono">JPG · PNG · WEBP · MP4 · hasta {MAX_FILES} archivos</p>
                </div>
              ) : (
                <div className="create-modal__previews">
                  {previews.map((p, i) => (
                    <div key={i} className="create-modal__preview">
                      {p.type === 'video'
                        ? <video src={p.url} className="create-modal__preview-media" muted />
                        : <img src={p.url} alt={`Preview ${i+1}`} className="create-modal__preview-media" />
                      }
                      <button
                        type="button"
                        className="create-modal__preview-remove"
                        onClick={() => removeFile(i)}
                        aria-label={`Eliminar imagen ${i+1}`}
                      >✕</button>
                    </div>
                  ))}
                  {previews.length < MAX_FILES && (
                    <button type="button"
                      className="create-modal__add-more"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Añadir más archivos"
                    >+</button>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept={ACCEPTED}
                multiple hidden onChange={(e) => addFiles(e.target.files)} />
            </div>

            {/* Caption */}
            <div className="create-modal__field">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Escribe un caption... #hashtags @menciones"
                className="create-modal__caption"
                maxLength={2200}
                rows={3}
                aria-label="Caption"
              />
              <span className="create-modal__char-count font-mono">
                {caption.length}/2200
              </span>
            </div>

            {/* Options row */}
            <div className="create-modal__options">
              <div className="create-modal__option-group">
                <label className="create-modal__label font-mono">Tipo</label>
                <select value={type} onChange={e => setType(e.target.value)}
                  className="create-modal__select" aria-label="Tipo de publicación">
                  <option value="regular">Regular</option>
                  <option value="story">Story (24h)</option>
                  <option value="gear_review_share">Gear Review</option>
                  <option value="track_share">Track Share</option>
                </select>
              </div>

              <div className="create-modal__option-group">
                <label className="create-modal__label font-mono">Visibilidad</label>
                <select value={visibility} onChange={e => setVisibility(e.target.value)}
                  className="create-modal__select" aria-label="Visibilidad">
                  <option value="public">Público</option>
                  <option value="followers">Solo seguidores</option>
                  <option value="private">Privado</option>
                </select>
              </div>

              <div className="create-modal__option-group create-modal__option-group--toggle">
                <label className="create-modal__label font-mono">Comentarios</label>
                <button
                  type="button"
                  className={`create-modal__toggle ${commentsOn ? 'is-on' : ''}`}
                  onClick={() => setCommentsOn(v => !v)}
                  aria-pressed={commentsOn}
                >
                  <span className="create-modal__toggle-thumb" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="create-modal__footer">
            <button type="button" className="create-modal__btn create-modal__btn--ghost"
              onClick={onClose} disabled={isPending}>Cancelar</button>
            <button
              type="submit"
              className="create-modal__btn create-modal__btn--primary"
              disabled={isPending || (!caption.trim() && files.length === 0)}
            >
              {isUploading ? 'Subiendo multimedia...' : createMutation.isPending ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>

      {/* Click outside to close */}
      <div className="modal-overlay__backdrop" onClick={onClose} aria-hidden="true" />
    </div>
  );
}
