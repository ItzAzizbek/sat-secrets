import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

const PROOFS = [
  '/proofs/proof1.jpeg',
  '/proofs/proof2.jpeg',
  '/proofs/proof3.jpeg',
  '/proofs/proof4.jpeg',
  '/proofs/proof5.jpeg',
];

const CredibilityGallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">
        Wanna see previous Products ?
      </h2>

      {/* Scrollable Gallery Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {PROOFS.map((src, index) => (
          <div
            key={index}
            className="flex-shrink-0 relative group cursor-pointer border-2 border-gray-200 hover:border-black transition-all w-64 md:w-80"
            onClick={() => setSelectedImage(src)}
          >
            <div className="aspect-[9/16] bg-gray-100 relative overflow-hidden">
              <img
                src={src}
                alt={`Proof ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 bg-white border-2 border-black p-2 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                  <ZoomIn size={20} />
                </div>
              </div>
            </div>
            <div className="p-3 border-t-2 border-transparent group-hover:border-black transition-colors bg-white">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-black">
                Proof {index + 1}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal/Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full bg-white border-4 border-black p-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-4 -right-4 bg-black text-white p-2 hover:bg-gray-800 transition-colors z-10"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage}
              alt="Proof Full Size"
              className="w-full h-full max-h-[85vh] object-contain bg-gray-100"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CredibilityGallery;
