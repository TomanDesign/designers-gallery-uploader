import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const PhotoUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  const handleFileChange = (e) => {
    let file = e.target.files[0];
    setSelectedFile(file);

    let reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPoint({ x, y });
    setIsDrawing(true);
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(false);

    const product = prompt('Enter product name:');
    const description = prompt('Enter product description:');

    setAnnotations([...annotations, { startX: startPoint.x, startY: startPoint.y, endX: x, endY: y, product, description }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawImageWithAnnotations();
    context.strokeStyle = 'red';
    context.lineWidth = 2;
    context.strokeRect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y);
  };

  const drawImageWithAnnotations = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const image = new Image();
    image.src = imagePreviewUrl;
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      annotations.forEach(annotation => {
        context.strokeStyle = 'blue';
        context.lineWidth = 2;
        context.strokeRect(annotation.startX, annotation.startY, annotation.endX - annotation.startX, annotation.endY - annotation.startY);
      });
    };
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('annotations', JSON.stringify(annotations));

    try {
      const response = await axios.post('https://strefa.indigo-nails.com/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log(response.data);
    } catch (error) {
      console.error('There was an error uploading the file!', error);
    }
  };

  useEffect(() => {
    if (imagePreviewUrl) {
      drawImageWithAnnotations();
    }
  }, [imagePreviewUrl, annotations]);

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {imagePreviewUrl && (
        <div>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            width={500}
            height={500}
            style={{ border: '1px solid black' }}
          />
          <button onClick={handleUpload}>Upload</button>
          <ul>
            {annotations.map((annotation, index) => (
              <li key={index}>
                {annotation.product} - {annotation.description} ({annotation.startX}, {annotation.startY}) to ({annotation.endX}, {annotation.endY})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PhotoUploader;
