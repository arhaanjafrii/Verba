// Audio recorder utility for browser recording functionality

class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.audioLevel = 0;
  }

  /**
   * Request microphone access and set up the media recorder
   * @returns {Promise<boolean>} - Whether setup was successful
   */
  async setup() {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create the media recorder
      this.mediaRecorder = new MediaRecorder(this.stream);
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      // Set up audio analysis
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);
      
      // Start monitoring audio levels
      this.startAudioLevelMonitoring();
      
      return true;
    } catch (error) {
      console.error('Error setting up audio recorder:', error);
      return false;
    }
  }

  /**
   * Start recording audio
   * @returns {Promise<boolean>} - Whether recording started successfully
   */
  async start() {
    if (!this.mediaRecorder) {
      const setupSuccess = await this.setup();
      if (!setupSuccess) return false;
    }
    
    // Reset audio chunks
    this.audioChunks = [];
    
    try {
      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;
      
      // Set up data available event handler if not already set
      if (!this.mediaRecorder.ondataavailable) {
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };
      }
      
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  /**
   * Stop recording audio
   * @returns {Promise<Blob|null>} - The recorded audio blob or null if failed
   */
  stop() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        // Create audio blob from chunks using the correct MIME type
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.isRecording = false;
        resolve(audioBlob);
      };
      
      // Stop recording
      this.mediaRecorder.stop();
    });
  }

  /**
   * Start monitoring audio levels
   */
  startAudioLevelMonitoring() {
    if (!this.analyser) return;
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    const updateAudioLevel = () => {
      if (!this.analyser) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      
      // Update audio level with more sensitivity for better visualization
      this.audioLevel = sum / dataArray.length;
      
      // Continue monitoring regardless of recording state
      // This ensures we always have updated audio levels for visualization
      requestAnimationFrame(updateAudioLevel);
    };
    
    updateAudioLevel();
  }
  
  /**
   * Get the current audio level (0-255)
   * @returns {number} - The current audio level
   */
  getAudioLevel() {
    return this.audioLevel;
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close().catch(err => console.error('Error closing audio context:', err));
      this.audioContext = null;
      this.analyser = null;
      this.microphone = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.audioLevel = 0;
  }

  /**
   * Create an audio URL for playback
   * @param {Blob} audioBlob - The audio blob
   * @returns {string} - The audio URL
   */
  static createAudioURL(audioBlob) {
    return URL.createObjectURL(audioBlob);
  }

  /**
   * Revoke an audio URL to free up memory
   * @param {string} url - The audio URL to revoke
   */
  static revokeAudioURL(url) {
    URL.revokeObjectURL(url);
  }
}

export default AudioRecorder;