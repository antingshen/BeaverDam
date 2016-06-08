document.addEventListener("DOMContentLoaded", function(event) {
  var img = new Image();
  img.src = frame_path(0);
  img.onload = function () {
    new Canvas(document.getElementById('frame'));
  }
});
