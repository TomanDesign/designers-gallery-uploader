import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import Modal from 'react-modal';

const PhotoUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Fetch products from API
    const fetchProducts = async () => {
      try {
        const response = await axios.get('https://strefa.indigo-nails.com/api/products');
        setProducts(response.data.map(product => ({ value: product.id, label: product.name })));
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

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

    setCurrentAnnotation({ startX: startPoint.x, startY: startPoint.y, endX: x, endY: y });
    setModalIsOpen(true);
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
        context.fillStyle = 'blue';
        context.fillText(annotation.product.label, annotation.startX, annotation.startY - 5);
      });
    };
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('annotations', JSON.stringify(annotations.map(annotation => ({
      startX: annotation.startX,
      startY: annotation.startY,
      endX: annotation.endX,
      endY: annotation.endY,
      productId: annotation.product.value,
    }))));

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

  const handleModalSubmit = () => {
    if (selectedProduct) {
      setAnnotations([...annotations, { ...currentAnnotation, product: selectedProduct }]);
      setSelectedProduct(null);
      setModalIsOpen(false);
    } else {
      alert('Please select a product');
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
                {annotation.product.label} ({annotation.startX}, {annotation.startY}) to ({annotation.endX}, {annotation.endY})
              </li>
            ))}
          </ul>
        </div>
      )}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Select Product"
      >
        <h2>Select Product</h2>
        <Select
          value={selectedProduct}
          onChange={setSelectedProduct}
          options={products}
          placeholder="Select a product"
          isClearable
        />
        <button onClick={handleModalSubmit}>Submit</button>
      </Modal>
    </div>
  );
};

export default PhotoUploader;
