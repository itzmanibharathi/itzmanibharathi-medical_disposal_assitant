import React, { useState, useRef } from 'react';
import axios from 'axios';

const Home = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const formRef = useRef(null);
  const resultsRef = useRef(null);
  const fileInputRef = useRef(null);

  const colorOptions = [
    {
      value: 'red', label: 'Red', description: 'Infectious waste, blood products',
      bgColor: 'bg-red-500', borderColor: 'border-red-300', textColor: 'text-red-700',
    },
    {
      value: 'blue', label: 'Blue', description: 'Pharmaceutical waste, medications',
      bgColor: 'bg-blue-500', borderColor: 'border-blue-300', textColor: 'text-blue-700',
    },
    {
      value: 'yellow', label: 'Yellow', description: 'Sharps, needles, surgical instruments',
      bgColor: 'bg-yellow-500', borderColor: 'border-yellow-300', textColor: 'text-yellow-700',
    },
    {
      value: 'black', label: 'Black', description: 'General medical waste, non-regulated materials',
      bgColor: 'bg-slate-800', borderColor: 'border-slate-300', textColor: 'text-slate-800',
    },
  ];

  const colorDetailedInfo = {
    red: {
      color_code: 'Red',
      waste_type: 'Infectious / Contaminated plastics, tubing, gloves, IV sets',
      pre_disposal_steps: [
        'Remove liquids if present',
        'Sterilize via autoclave, microwave, or chemical method',
        'Shred for recycling or energy conversion',
      ],
    },
    blue: {
      color_code: 'Blue',
      waste_type: 'Glassware, metals, sharps, and metallic instruments',
      pre_disposal_steps: [
        'Wash or decontaminate if possible',
        'Autoclave or chemical sterilization',
        'Separate metal and glass for recycling',
      ],
    },
    yellow: {
      color_code: 'Yellow',
      waste_type: 'Anatomical waste, soiled dressings, expired pharmaceuticals, chemicals',
      pre_disposal_steps: [
        'Pack in leak-proof bags',
        'Pre-treat chemicals (neutralization) or tissue (autoclaving/incineration)',
        'Label clearly for incineration or controlled disposal',
      ],
    },
    black: {
      color_code: 'Black',
      waste_type: 'Non-hazardous general medical waste (paper, packaging, food waste)',
      pre_disposal_steps: [
        'Remove infectious or liquid contamination',
        'Sort recyclables (paper, plastics) from organic waste',
        'Compost organics or send recyclables to proper industrial recycling',
      ],
    },
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setError('Please upload a valid image file (JPG, PNG, GIF).');
      setToast({ message: 'Invalid file type. Please upload an image.', type: 'error' });
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedColor) {
      setError('Please select a container color.');
      setToast({ message: 'Please select a container color.', type: 'error' });
      return;
    }
    if (!selectedImage) {
      setError('Please select an image to classify.');
      setToast({ message: 'Please select an image.', type: 'error' });
      return;
    }
    if (isLoading) {
      setToast({ message: 'Request in progress. Please wait.', type: 'warning' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedImage);

      console.log('Sending request to /api/classify-medical-waste with container_color:', selectedColor);
      const response = await axios.post('http://localhost:8000/api/classify-medical-waste', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { container_color: selectedColor },
        timeout: 60000 // 60 seconds
      });

      console.log('Response Status:', response.status);
      console.log('Backend Response:', response.data);

      const requiredFields = [
        'class_name', 'category', 'disposal_technique', 'disposal_steps',
        'llm_reusability', 'container_color', 'suggested_color', 'timestamp_utc'
      ];
      const missingFields = requiredFields.filter(field => !(field in response.data));
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields in response: ${missingFields.join(', ')}`);
      }

      setResults(response.data);
      setToast({ message: 'Classification successful! Results stored in database.', type: 'success' });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      console.error('Axios Error Details:', {
        message: err.message,
        code: err.code,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data
        } : 'No response received'
      });
      const errorMessage = err.response?.data?.detail || err.message || 'Cannot classify the medical item. Please try again later.';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedColor('');
    setResults(null);
    setError(null);
    setIsLoading(false);
    setToast(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setError('Please upload a valid image file (JPG, PNG, GIF).');
        setToast({ message: 'Invalid file type. Please upload an image.', type: 'error' });
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setToast({ message: 'Copied to clipboard!', type: 'success' });
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4 sm:py-6 md:py-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-600' : toast.type === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
          <button className="ml-4 text-white" onClick={() => setToast(null)}>
            ✕
          </button>
        </div>
      )}

      <div className="text-center mb-8 sm:mb-12 md:mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-slate-600 rounded-full mb-4 border border-slate-300">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.78 0-2.678-2.153-1.415-3.414l5-5A2 2 0 009 9.172V5L8 4z"
            />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-blue-600 via-slate-700 to-black bg-clip-text text-transparent mb-2 sm:mb-4 animate-fade-in">
          Medical Disposal Assistant
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-700 max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-2 animate-fade-in-delay font-medium">
          AI-powered classification and disposal instructions for medical waste
        </p>
      </div>

      <div className="w-full mb-8 sm:mb-10 md:mb-12">
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border border-slate-300">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-slate-600 rounded-full mb-4 border border-slate-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H7a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-2">
              Select Waste Container Color
            </h3>
            <p className="text-slate-600 font-medium">Choose the color of the medical waste container you're using</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {colorOptions.map((color) => (
              <label
                key={color.value}
                className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 hover:shadow-lg ${
                  selectedColor === color.value
                    ? `${color.borderColor} bg-opacity-10 shadow-lg transform scale-105`
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="containerColor"
                  value={color.value}
                  checked={selectedColor === color.value}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="sr-only"
                />
                <div className="flex flex-col items-center space-y-3">
                  <div
                    className={`w-12 h-12 rounded-full ${color.bgColor} border-2 border-white shadow-lg flex items-center justify-center`}
                  >
                    {selectedColor === color.value && (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="text-center">
                    <h4
                      className={`font-bold text-lg ${
                        selectedColor === color.value ? color.textColor : 'text-slate-700'
                      }`}
                    >
                      {color.label}
                    </h4>
                    <p
                      className={`text-xs mt-1 leading-tight ${
                        selectedColor === color.value ? color.textColor : 'text-slate-600'
                      }`}
                    >
                      {color.description}
                    </p>
                  </div>
                </div>
                {selectedColor === color.value && (
                  <div className="absolute -top-1 -right-1">
                    <div
                      className={`w-6 h-6 rounded-full ${color.bgColor} border-2 border-white flex items-center justify-center shadow-lg`}
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </label>
            ))}
          </div>

          {selectedColor && (
            <div className="mt-8 animate-fade-in">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full ${
                      colorOptions.find((c) => c.value === selectedColor)?.bgColor
                    } border border-white shadow-md`}
                  ></div>
                  <div>
                    <p className="font-bold text-slate-800">
                      Selected: {colorDetailedInfo[selectedColor]?.color_code} Container
                    </p>
                    <p className="text-sm text-slate-600">
                      For: {colorOptions.find((c) => c.value === selectedColor)?.description}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`bg-gradient-to-br ${
                  selectedColor === 'red'
                    ? 'from-red-50 to-red-100 border-red-300'
                    : selectedColor === 'blue'
                    ? 'from-blue-50 to-blue-100 border-blue-300'
                    : selectedColor === 'yellow'
                    ? 'from-yellow-50 to-yellow-100 border-yellow-300'
                    : 'from-slate-50 to-slate-100 border-slate-300'
                } border-2 rounded-xl p-6 shadow-lg`}
              >
                <div className="mb-6">
                  <h4
                    className={`text-lg font-bold mb-3 flex items-center ${
                      selectedColor === 'red'
                        ? 'text-red-800'
                        : selectedColor === 'blue'
                        ? 'text-blue-800'
                        : selectedColor === 'yellow'
                        ? 'text-yellow-800'
                        : 'text-slate-800'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v2M7 7h10"
                      />
                    </svg>
                    Waste Type
                  </h4>
                  <p
                    className={`text-sm font-medium leading-relaxed ${
                      selectedColor === 'red'
                        ? 'text-red-700'
                        : selectedColor === 'blue'
                        ? 'text-blue-700'
                        : selectedColor === 'yellow'
                        ? 'text-yellow-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {colorDetailedInfo[selectedColor]?.waste_type}
                  </p>
                </div>
                <div>
                  <h4
                    className={`text-lg font-bold mb-4 flex items-center ${
                      selectedColor === 'red'
                        ? 'text-red-800'
                        : selectedColor === 'blue'
                        ? 'text-blue-800'
                        : selectedColor === 'yellow'
                        ? 'text-yellow-800'
                        : 'text-slate-800'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    Disposal Steps
                  </h4>
                  <div className="space-y-3">
                    {colorDetailedInfo[selectedColor]?.pre_disposal_steps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            selectedColor === 'red'
                              ? 'bg-red-600'
                              : selectedColor === 'blue'
                              ? 'bg-blue-600'
                              : selectedColor === 'yellow'
                              ? 'bg-yellow-600'
                              : 'bg-slate-600'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <p
                          className={`text-sm font-medium leading-relaxed ${
                            selectedColor === 'red'
                              ? 'text-red-700'
                              : selectedColor === 'blue'
                              ? 'text-blue-700'
                              : selectedColor === 'yellow'
                              ? 'text-yellow-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedColor && (
        <div ref={formRef} className="w-full mb-8 sm:mb-10 md:mb-12">
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border border-blue-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-slate-600 rounded-full mb-4 border border-slate-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-2">
                Upload Medical Item for Analysis
              </h3>
              <p className="text-slate-600 font-medium">Drag and drop an image or click to browse</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  isDragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-400 hover:border-blue-500'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-4">
                  <div
                    className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300 border border-slate-300 ${
                      isDragOver ? 'bg-blue-500' : 'bg-blue-100'
                    }`}
                  >
                    <svg
                      className={`w-8 h-8 transition-colors duration-300 ${isDragOver ? 'text-white' : 'text-blue-600'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-black">{isDragOver ? 'Drop your image here' : 'Choose image file'}</p>
                    <p className="text-sm text-slate-600 mt-1 font-medium">Supports: JPG, PNG, GIF (Max 10MB)</p>
                  </div>
                </div>
              </div>

              {imagePreview && (
                <div className="animate-fade-in">
                  <label className="block text-lg font-bold text-black mb-3 flex items-center">Image Preview</label>
                  <div className="relative bg-slate-50 rounded-xl p-6 border border-slate-300">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-80 mx-auto rounded-lg shadow-lg border border-slate-300"
                    />
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="bg-slate-600 hover:bg-slate-700 text-white rounded-full p-2 shadow-lg transition-colors duration-200 border border-slate-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={!selectedImage || !selectedColor || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex-1 shadow-lg hover:shadow-xl text-sm sm:text-base flex items-center justify-center border border-slate-300"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Analyze Image
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex-1 shadow-lg hover:shadow-xl text-sm sm:text-base flex items-center justify-center border border-slate-300"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(results || error) && (
        <div ref={resultsRef} className="w-full mb-8 sm:mb-10 md:mb-12 animate-fade-in">
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-xl border border-slate-300">
            {error ? (
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4 border border-slate-300">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-4">❌ Classification Failed</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto font-medium">{error}</p>
                <button
                  onClick={resetForm}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl border border-slate-300"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 border border-blue-300">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-2">Classification Results</h3>
                  <p className="text-slate-600 font-medium">Disposal instructions and details for the analyzed item</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-blue-700 flex items-center">
                        <span className="mr-2">🔬</span>
                        Item Identified
                      </h4>
                      <button
                        onClick={() => copyToClipboard(results.class_name)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-black font-bold text-xl mb-2">{results.class_name || 'Unknown Item'}</p>
                  </div>

                  <div className="bg-slate-50 border-l-4 border-slate-500 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-200">
                    <h4 className="text-lg font-bold text-black mb-4 flex items-center">
                      <span className="mr-2">🗂</span>
                      Waste Category
                    </h4>
                    <p className="text-black font-bold text-lg mb-2">{results.category || 'General Medical Waste'}</p>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-200">
                    <h4 className="text-lg font-bold text-black mb-4 flex items-center">
                      <span className="mr-2">🎨</span>
                      Selected Container Color
                    </h4>
                    <p className="text-black font-bold text-lg mb-2 capitalize">{results.container_color || 'N/A'}</p>
                  </div>

                  <div className="bg-slate-50 border-l-4 border-slate-500 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-200">
                    <h4 className="text-lg font-bold text-black mb-4 flex items-center">
                      <span className="mr-2">🎨</span>
                      Suggested Container Color
                    </h4>
                    <p className="text-black font-bold text-lg mb-2 capitalize">{results.suggested_color || 'N/A'}</p>
                    {results.container_color !== results.suggested_color && (
                      <p className="text-sm text-red-600 font-medium">
                        Warning: Selected color ({results.container_color}) does not match suggested color (
                        {results.suggested_color}).
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-200">
                    <h4 className="text-lg font-bold text-black mb-4 flex items-center">
                      <span className="mr-2">🕒</span>
                      Analysis Timestamp
                    </h4>
                    <p className="text-black font-medium">{formatTimestamp(results.timestamp_utc)}</p>
                  </div>

                  <div className="bg-slate-50 border-l-4 border-slate-500 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-slate-200">
                    <h4 className="text-lg font-bold text-black mb-4 flex items-center">
                      <span className="mr-2">🛠</span>
                      Disposal Technique
                    </h4>
                    <p className="text-black font-medium">{results.disposal_technique || 'N/A'}</p>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
                  <div className="px-6 py-4 bg-blue-50 flex items-center justify-between">
                    <h4 className="text-lg font-bold text-black flex items-center">
                      <span className="mr-2">📋</span>
                      Disposal Steps
                    </h4>
                  </div>
                  <div className="px-6 py-4 bg-blue-50">
                    <ol className="list-decimal list-inside space-y-2 text-black font-medium">
                      {results.disposal_steps?.map((step, index) => (
                        <li key={index} className="leading-relaxed">
                          {step}
                        </li>
                      )) || (
                        <li className="leading-relaxed">
                          No specific disposal steps provided. Follow standard protocols.
                        </li>
                      )}
                    </ol>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
                  <div className="px-6 py-4 bg-green-50 flex items-center justify-between">
                    <h4 className="text-lg font-bold text-black flex items-center">
                      <span className="mr-2">♻️</span>
                      Reusability Analysis
                    </h4>
                    <button
                      onClick={() => copyToClipboard(results.llm_reusability)}
                      className="text-green-600 hover:text-green-700 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="px-6 py-4 bg-green-50">
                    <p className="text-black font-medium leading-relaxed whitespace-pre-wrap">{results.llm_reusability}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-8 justify-center">
                  <button
                    onClick={() => window.print()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors duration-200 flex items-center border border-slate-300"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Print Instructions
                  </button>
                  <button
                    onClick={resetForm}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold transition-colors duration-200 flex items-center border border-slate-300"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Analyze Another Item
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;