"use client";

import { useState } from "react";

type GalleryImage = {
  id: string;
  image_url: string;
};

export default function ProductGallery({
  images,
  title,
}: {
  images: GalleryImage[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const activeImage = images[activeIndex]?.image_url || images[0]?.image_url;

  function nextImage() {
    setActiveIndex((prev) => (prev + 1) % images.length);
  }

  function prevImage() {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  return (
    <>
      <div className="rounded-[2rem] border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-zinc-100">
          <img
            src={activeImage}
            alt={title}
            onClick={() => setZoomImage(activeImage)}
            className="h-80 w-full cursor-zoom-in object-cover sm:h-[520px]"
          />

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl font-black shadow"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={nextImage}
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl font-black shadow"
              >
                ›
              </button>
            </>
          ) : null}

          {images.length > 1 ? (
            <div className="absolute bottom-3 left-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white -translate-x-1/2">
              {activeIndex + 1} / {images.length}
            </div>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {images.slice(0, 8).map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-20 min-w-20 overflow-hidden rounded-2xl border-2 bg-zinc-100 ${
                  activeIndex === index
                    ? "border-zinc-950"
                    : "border-transparent"
                }`}
              >
                <img
                  src={image.image_url}
                  alt={`${title} thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                />

                <span className="absolute bottom-1 right-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                  {index + 1}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {images.length > 1 ? (
          <p className="mt-3 text-center text-sm text-zinc-500">
            Geser thumbnail atau pakai tombol panah. Klik foto untuk memperbesar.
          </p>
        ) : (
          <p className="mt-3 text-center text-sm text-zinc-500">
            Klik foto untuk memperbesar.
          </p>
        )}
      </div>

      {zoomImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomImage(null)}
        >
          <button
            type="button"
            onClick={() => setZoomImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-black text-zinc-950"
          >
            Tutup
          </button>

          <img
            src={zoomImage}
            alt={title}
            className="max-h-[85vh] max-w-full rounded-3xl object-contain"
          />
        </div>
      ) : null}
    </>
  );
            }
