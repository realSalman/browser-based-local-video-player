import './style.css'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'

// Elements
const dropOverlay = document.getElementById('drop-overlay') as HTMLDivElement
const dropZoneBox = document.getElementById('drop-zone-box') as HTMLDivElement
const fileInput = document.getElementById('file-input') as HTMLInputElement
const videoContainer = document.getElementById('video-container') as HTMLDivElement
const videoElement = document.getElementById('my-video') as HTMLVideoElement
const closeVideoBtn = document.getElementById('close-video-btn') as HTMLButtonElement

let player: Player | null = null
let currentObjectUrl: string | null = null
let dragCounter = 0

// Initialize Drag & Drop Events
function initDragAndDrop() {
  // Prevent default behaviors for drag events on the whole document
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, preventDefaults, false)
  })

  document.addEventListener('dragenter', (e) => {
    if (e.dataTransfer?.types.includes('Files')) {
      dragCounter++;
      dropOverlay.classList.add('dragging')
    }
  })

  document.addEventListener('dragover', (e) => {
    if (e.dataTransfer?.types.includes('Files')) {
      dropOverlay.classList.add('dragging')
      e.dataTransfer.dropEffect = 'copy'
    }
  })

  // Hide overlay when leaving window
  document.addEventListener('dragleave', () => {
    dragCounter--;
    if (dragCounter === 0) {
      dropOverlay.classList.remove('dragging')
    }
  })

  // Handle drop
  document.addEventListener('drop', handleDrop, false)

  // Handle click to open
  dropZoneBox.addEventListener('click', () => {
    fileInput.click()
  })

  fileInput.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files
    if (files && files.length > 0) {
      handleFile(files[0])
      fileInput.value = '' // Reset input
    }
  })

  // Handle Close Button
  closeVideoBtn.addEventListener('click', () => {
    if (player) {
      player.pause()
      player.src('')
    }
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl)
      currentObjectUrl = null
    }

    // Hide video, show drop zone
    videoContainer.classList.add('hidden')
    dropOverlay.classList.remove('overlay-state')
    dropOverlay.classList.add('empty-state')
  })
}

function preventDefaults(e: Event) {
  e.preventDefault()
  e.stopPropagation()
}

function handleDrop(e: DragEvent) {
  dropOverlay.classList.remove('dragging')
  dragCounter = 0 // Reset counter
  
  const dt = e.dataTransfer
  if (!dt) return
  
  const files = dt.files
  if (files.length > 0) {
    handleFile(files[0])
  }
}

function handleFile(file: File) {
  // We want to try playing almost anything since user requested "all formats",
  // though browsers naturally have limitations.
  if (!file.type.startsWith('video/') && !file.name.match(/\.(mkv|avi|mp4|webm|ogg|mov)$/i)) {
    console.warn('The dropped file does not appear to be a common video format, but we will try anyway.', file.name)
  }

  // Revoke old URL to avoid memory leak
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl)
  }

  // Create new object URL
  currentObjectUrl = URL.createObjectURL(file)

  // Remove empty state from overlay so it only shows on drag
  dropOverlay.classList.remove('empty-state')
  videoContainer.classList.remove('hidden')

  // Initialize or update Video.js player
  if (!player) {
    player = videojs(videoElement, {
      controls: true,
      autoplay: true,
      preload: 'auto',
      fluid: false, // We handle sizing via CSS
      controlBar: {
        skipButtons: {
          forward: 10,
          backward: 10
        }
      }
    })
  }

  // Set the source and play
  player.src({ type: file.type || 'video/mp4', src: currentObjectUrl })
  player.ready(() => {
    const activePlayer = player;
    if (activePlayer) {
      const playPromise = activePlayer.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.error("Error playing video:", err));
      }
    }
  })
}

// Add Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  if (!player) return;

  switch (e.key.toLowerCase()) {
    case ' ':
    case 'k':
      e.preventDefault();
      if (player.paused()) player.play();
      else player.pause();
      break;
    case 'arrowleft':
    case 'j':
      e.preventDefault();
      player.currentTime(Math.max(0, (player.currentTime() as number) - 10));
      break;
    case 'arrowright':
    case 'l':
      e.preventDefault();
      player.currentTime((player.currentTime() as number) + 10);
      break;
    case 'arrowup':
      e.preventDefault();
      player.volume(Math.min(1, (player.volume() as number) + 0.1));
      break;
    case 'arrowdown':
      e.preventDefault();
      player.volume(Math.max(0, (player.volume() as number) - 0.1));
      break;
    case 'f':
      e.preventDefault();
      if (player.isFullscreen()) player.exitFullscreen();
      else player.requestFullscreen();
      break;
    case 'm':
      e.preventDefault();
      player.muted(!player.muted());
      break;
  }
});

// Start
initDragAndDrop()
