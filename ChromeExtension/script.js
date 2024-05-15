document.addEventListener("DOMContentLoaded", function() {
  const canvas = document.getElementById("paintCanvas");
  const ctx = canvas.getContext("2d");
  let painting = false;
  let tool = 'brush'; // Default tool
  let startX, startY; // Coordinates for starting point of line
  let tempCanvas, tempCtx; // Temporal canvas and context for preview line

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function startPosition(e) {
    painting = true;
    startX = getMousePos(e).x;
    startY = getMousePos(e).y;
    if (tool === 'fill') {
      fill(e);
    } else if (tool === 'line') {
      createTempCanvas();
      drawTempLine(e);
    } else {
      draw(e);
    }
  }

  function endPosition() {
    painting = false;
    ctx.beginPath();
    if (tool === 'line') {
      drawLineEnd();
      clearTempCanvas();
    }
    saveCanvas(); // Save the canvas content whenever drawing ends
  }

  function draw(e) {
    if (!painting || (tool !== 'brush' && tool !== 'eraser')) return;

    const pos = getMousePos(e);
    ctx.lineWidth = document.getElementById("brushSize").value;
    ctx.lineCap = "round";
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : document.getElementById("colorPicker").value;

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function fill(e) {
    const pos = getMousePos(e);
    const fillColor = document.getElementById("colorPicker").value;
    const pixelStack = [[pos.x, pos.y]];
    const startColor = getPixelColor(pos.x, pos.y);

    if (startColor === fillColor) return;

    while (pixelStack.length) {
      const [x, y] = pixelStack.pop();
      let currentY = y;

      while (currentY >= 0 && matchStartColor(x, currentY, startColor)) {
        currentY -= 1;
      }

      currentY += 1;
      let reachLeft = false;
      let reachRight = false;

      while (currentY < canvas.height && matchStartColor(x, currentY, startColor)) {
        colorPixel(x, currentY, fillColor);

        if (x > 0) {
          if (matchStartColor(x - 1, currentY, startColor)) {
            if (!reachLeft) {
              pixelStack.push([x - 1, currentY]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }

        if (x < canvas.width - 1) {
          if (matchStartColor(x + 1, currentY, startColor)) {
            if (!reachRight) {
              pixelStack.push([x + 1, currentY]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }

        currentY += 1;
      }
    }

    saveCanvas(); // Save the canvas content after fill
  }

  function createTempCanvas() {
    tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx = tempCanvas.getContext('2d');
    tempCtx.strokeStyle = document.getElementById("colorPicker").value;
    tempCtx.lineWidth = document.getElementById("brushSize").value;
  }

  function drawTempLine(e) {
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.beginPath();
    tempCtx.moveTo(startX, startY);
    const pos = getMousePos(e);
    tempCtx.lineTo(pos.x, pos.y);
    tempCtx.stroke();
  }

  function drawLineEnd() {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    const pos = getMousePos(event);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function clearTempCanvas() {
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  }

  function getPixelColor(x, y) {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    return `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
  }

  function matchStartColor(x, y, startColor) {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const currentColor = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
    return currentColor === startColor;
  }

  function colorPixel(x, y, fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, 1, 1);
  }

  function saveCanvas() {
    localStorage.setItem('canvasContent', canvas.toDataURL());
  }

  function loadCanvas() {
    const dataURL = localStorage.getItem('canvasContent');
    if (dataURL) {
      const img = new Image();
      img.src = dataURL;
      img.onload = function() {
        ctx.drawImage(img, 0, 0);
      };
    }
  }

  // Load the canvas content when the extension is opened
  loadCanvas();

  canvas.addEventListener("mousedown", startPosition);
  canvas.addEventListener("mouseup", endPosition);
  canvas.addEventListener("mousemove", function(e) {
    if (painting && tool === 'line') {
      drawTempLine(e);
    } else {
      draw(e);
    }
  });

  document.getElementById("clearBtn").addEventListener("click", function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem('canvasContent'); // Clear the saved content
  });

  document.getElementById("pencilBtn").addEventListener("click", function() {
    tool = 'brush';
  });

  document.getElementById("eraserBtn").addEventListener("click", function() {
    tool = 'eraser';
  });

  document.getElementById("fillBtn").addEventListener("click", function() {
    tool = 'fill';
  });

  document.getElementById("lineBtn").addEventListener("click", function() {
    tool = 'line';
  });

  document.getElementById("downloadBtn").addEventListener("click", function() {
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    link.click();
  });

  document.getElementById("colorPicker").addEventListener("input", function() {
    if (tool === 'eraser') {
      tool = 'brush'; // Switch back to brush when color changes
    }
  });

  document.getElementById("brushSize").addEventListener("input", function() {
    if (tool === 'line') {
      tempCtx.lineWidth = this.value;
    } else {
      ctx.lineWidth = this.value;
  }
  });
document.getElementById("downloadBtn").addEventListener("click", function() {
  const fileName = document.getElementById("fileName").value || 'drawing.png';
  const link = document.createElement('a');
  link.download = fileName.endsWith('.png') ? fileName : fileName + '.png';
  link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
  link.click();
});

});
