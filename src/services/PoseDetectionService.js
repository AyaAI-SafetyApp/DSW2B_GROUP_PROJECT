import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import '@tensorflow/tfjs-backend-webgl';

// Import only what we need to avoid loading all models
let poseDetection = null;

/**
 * Pose Detection Service for Self-Defense Training
 * This service provides real-time pose detection and classification
 * for self-defense movements with high accuracy (>90% target)
 */
class PoseDetectionService {
  constructor() {
    this.detector = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.confidenceThreshold = 0.3;
  }

  /**
   * Initialize the pose detection model
   */
  async initialize() {
    if (this.isInitialized || this.isInitializing) {
      return this.detector;
    }

    this.isInitializing = true;
    
    try {
      // Wait for TensorFlow.js to be ready
      await tf.ready();
      
      console.log('Initializing pose detection model...');
      
      // Dynamically import pose detection to avoid loading all models
      if (!poseDetection) {
        poseDetection = await import('@tensorflow-models/pose-detection');
      }
      
      // Use MoveNet Lightning for better performance on mobile
      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true
      };
      
      this.detector = await poseDetection.createDetector(model, detectorConfig);
      this.isInitialized = true;
      this.isInitializing = false;
      
      console.log('Pose detection model initialized successfully');
      return this.detector;
    } catch (error) {
      console.error('Error initializing pose detection:', error);
      this.isInitializing = false;
      throw error;
    }
  }

  /**
   * Detect poses from camera frame using TensorFlow.js
   * @param {ImageSource} imageSource - Camera frame or image
   * @param {Object} options - Detection options
   * @returns {Array} Array of detected poses
   */
  async detectPoses(imageSource, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.detector) {
      throw new Error('Detector not initialized');
    }

    try {
      const defaultOptions = {
        maxPoses: 1,
        flipHorizontal: false,
        scoreThreshold: this.confidenceThreshold
      };

      const poses = await this.detector.estimatePoses(
        imageSource, 
        { ...defaultOptions, ...options }
      );

      return poses;
    } catch (error) {
      console.error('Error detecting poses:', error);
      throw error;
    }
  }

  /**
   * Calculate pose accuracy by comparing detected keypoints with expected positions
   * @param {Object} detectedPose - Pose with detected keypoints
   * @param {Object} expectedPose - Expected pose with target keypoints
   * @param {number} tolerance - Distance tolerance in pixels
   * @returns {number} Accuracy percentage (0-100)
   */
  calculatePoseAccuracy(detectedPose, expectedPose, tolerance = 50) {
    if (!detectedPose || !expectedPose || !detectedPose.keypoints) {
      return 0;
    }

    const detectedKeypoints = detectedPose.keypoints;
    const expectedKeypoints = expectedPose.keypoints;

    if (!expectedKeypoints || expectedKeypoints.length === 0) {
      return 0;
    }

    let correctKeypoints = 0;
    let totalKeypoints = 0;

    expectedKeypoints.forEach(expectedKp => {
      const detectedKp = detectedKeypoints.find(kp => kp.name === expectedKp.name);
      
      if (detectedKp && detectedKp.score > this.confidenceThreshold) {
        totalKeypoints++;
        
        const distance = Math.sqrt(
          Math.pow(detectedKp.x - expectedKp.x, 2) + 
          Math.pow(detectedKp.y - expectedKp.y, 2)
        );
        
        if (distance <= tolerance) {
          correctKeypoints++;
        }
      }
    });

    return totalKeypoints > 0 ? Math.round((correctKeypoints / totalKeypoints) * 100) : 0;
  }

  /**
   * Get key defensive pose keypoints for self-defense moves
   * @param {string} poseName - Name of the defensive pose
   * @returns {Object} Pose definition with expected keypoints
   */
  getDefensivePoseKeypoints(poseName) {
    const defensivePoses = {
      'guard_stance': {
        name: 'Guard Stance',
        description: 'Basic defensive stance',
        keypoints: [
          { name: 'left_wrist', x: 0.3, y: 0.4, importance: 'high' },
          { name: 'right_wrist', x: 0.7, y: 0.4, importance: 'high' },
          { name: 'left_elbow', x: 0.25, y: 0.5, importance: 'medium' },
          { name: 'right_elbow', x: 0.75, y: 0.5, importance: 'medium' },
          { name: 'left_shoulder', x: 0.2, y: 0.3, importance: 'high' },
          { name: 'right_shoulder', x: 0.8, y: 0.3, importance: 'high' }
        ]
      },
      'block_high': {
        name: 'High Block',
        description: 'Blocking high attacks',
        keypoints: [
          { name: 'left_wrist', x: 0.4, y: 0.2, importance: 'high' },
          { name: 'right_wrist', x: 0.6, y: 0.2, importance: 'high' },
          { name: 'left_elbow', x: 0.3, y: 0.3, importance: 'high' },
          { name: 'right_elbow', x: 0.7, y: 0.3, importance: 'high' }
        ]
      },
      'block_low': {
        name: 'Low Block',
        description: 'Blocking low attacks',
        keypoints: [
          { name: 'left_wrist', x: 0.3, y: 0.6, importance: 'high' },
          { name: 'right_wrist', x: 0.7, y: 0.6, importance: 'high' },
          { name: 'left_elbow', x: 0.2, y: 0.5, importance: 'medium' },
          { name: 'right_elbow', x: 0.8, y: 0.5, importance: 'medium' }
        ]
      },
      'punch_ready': {
        name: 'Punch Ready',
        description: 'Ready to punch position',
        keypoints: [
          { name: 'right_wrist', x: 0.8, y: 0.4, importance: 'high' },
          { name: 'right_elbow', x: 0.6, y: 0.5, importance: 'high' },
          { name: 'left_wrist', x: 0.2, y: 0.4, importance: 'medium' },
          { name: 'right_shoulder', x: 0.7, y: 0.3, importance: 'medium' }
        ]
      }
    };

    return defensivePoses[poseName] || null;
  }

  /**
   * Get feedback for pose improvement
   * @param {Object} detectedPose - Current detected pose
   * @param {string} targetPose - Target pose name
   * @returns {string} Feedback message
   */
  getFeedback(detectedPose, targetPoseName) {
    const targetPose = this.getDefensivePoseKeypoints(targetPoseName);
    if (!targetPose) return 'Unknown pose target';

    const accuracy = this.calculatePoseAccuracy(detectedPose, targetPose);
    
    if (accuracy > 90) {
      return 'Perfect form! Excellent technique.';
    } else if (accuracy > 80) {
      return 'Great job! Minor adjustments needed.';
    } else if (accuracy > 70) {
      return 'Good effort. Focus on your positioning.';
    } else {
      return `Adjust your ${targetPose.name.toLowerCase()}. Keep practicing!`;
    }
  }

  /**
   * Draw pose keypoints on canvas
   * @param {Array} poses - Array of detected poses
   * @param {Canvas} canvas - Canvas element
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   */
  drawPoseKeypoints(poses, canvas, ctx) {
    if (!poses || poses.length === 0) return;

    poses.forEach(pose => {
      pose.keypoints.forEach(keypoint => {
        if (keypoint.score > this.confidenceThreshold) {
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = this.getKeypointColor(keypoint.score);
          ctx.fill();
          
          // Draw keypoint name for debugging
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.fillText(keypoint.name, keypoint.x + 8, keypoint.y - 8);
        }
      });

      // Draw skeleton connections
      this.drawSkeleton(pose.keypoints, ctx);
    });
  }

  /**
   * Draw skeleton connections between keypoints
   * @param {Array} keypoints - Array of keypoints
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   */
  drawSkeleton(keypoints, ctx) {
    const connections = [
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'],
      ['right_knee', 'right_ankle']
    ];

    connections.forEach(([pointA, pointB]) => {
      const kpA = keypoints.find(kp => kp.name === pointA);
      const kpB = keypoints.find(kp => kp.name === pointB);

      if (kpA && kpB && kpA.score > this.confidenceThreshold && kpB.score > this.confidenceThreshold) {
        ctx.beginPath();
        ctx.moveTo(kpA.x, kpA.y);
        ctx.lineTo(kpB.x, kpB.y);
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }

  /**
   * Get color based on keypoint confidence score
   * @param {number} score - Confidence score (0-1)
   * @returns {string} Color hex code
   */
  getKeypointColor(score) {
    if (score > 0.8) return '#00ff00'; // Green for high confidence
    if (score > 0.5) return '#ffff00'; // Yellow for medium confidence
    return '#ff6600'; // Orange for low confidence
  }

  /**
   * Clean up detector resources
   */
  dispose() {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
      this.isInitialized = false;
      console.log('PoseDetectionService: Detector disposed');
    }
  }

  /**
   * Check if service is ready
   * @returns {boolean} True if initialized and ready
   */
  isReady() {
    return this.isInitialized && this.detector !== null;
  }
}

// Export singleton instance
export default new PoseDetectionService();