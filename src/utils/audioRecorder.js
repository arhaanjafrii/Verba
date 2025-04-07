// Audio recorder utility for browser recording functionality

class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
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
    
    // Start recording
    this.mediaRecorder.start();
    this.isRecording = true;
    
    return true;
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
   * Clean up resources
   */
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
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