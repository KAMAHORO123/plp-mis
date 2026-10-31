# Assessment face position model

`face-detector.tflite` is MediaPipe BlazeFace short-range, float16, version 1.
Source: https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite
Documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector

The browser loads this model from the same origin. Camera frames stay on the device and are not saved. Face presence/position feedback is not identity verification, gaze tracking, or proof of cheating. If detection cannot load, the preview explicitly says that the position check is unavailable.

Runtime WASM files come from the locked `@mediapipe/tasks-vision` dependency. `scripts/prepare-vision.mjs` copies them before development and production builds.
