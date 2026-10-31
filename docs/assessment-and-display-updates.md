# Assessment and display updates

Trainers set each module's quiz duration (1–120 minutes) and the final exam duration (2–240 minutes) in the course builder. Draft changes must be saved. Enrolled courses retain the existing content lock; trainers create a new version to change those courses.

The API sets the attempt deadline. The displayed countdown uses server time and monotonic elapsed time. Late answers are ignored. Leaving the tab, attempting route navigation, leaving full screen, or losing the camera terminates the attempt. Terminated attempts cannot pass. Answers are locked immediately; interrupted submission requests are retried, including after a reload in the same browser tab. The submit endpoint is idempotent. Browser events are client signals, so these measures cannot guarantee cheating prevention or stop a deliberately modified client.

Camera positioning uses a local MediaPipe model, with a face guide, detected face outline, and feedback for off-centre, missing, distant, or multiple faces. Frames are neither saved nor transmitted. This is position feedback, not identity verification or eye/gaze tracking. Detection errors do not automatically fail a learner. If the detector is unavailable, the preview explicitly says so.

The shared profile controls offer photo upload/removal and the same circular photo/initials treatment in every role's header and profile. Theme choice is saved locally; language switching remains available on public pages and dashboards. The opportunity help panel uses the local English, Kinyarwanda and French FAQ and requires no API key or usage fees.

Vision runtime files are copied before `dev`/`build` from the locked dependency. The Docker Hub build includes that preparation script. The standalone landing project includes its own theme control and FAQ copy so it can still deploy independently.
