export type FaceBox = { originX: number; originY: number; width: number; height: number };
export function facePosition(boxes: FaceBox[], width: number, height: number) {
  if (!boxes.length) return 'No face visible — look towards the camera';
  if (boxes.length > 1) return 'More than one face visible';
  const box = boxes[0], x = (box.originX + box.width / 2) / width, y = (box.originY + box.height / 2) / height;
  if (box.width / width < .16) return 'Move a little closer';
  if (box.width / width > .65) return 'Move a little further back';
  if (x < .28 || x > .72 || y < .22 || y > .75) return 'Centre your face in the guide';
  return 'Face in position';
}
